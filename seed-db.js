// ============================================================
// Trend Mart - Database Seed Script
// Reads all products from the 16 category pages, uploads the
// images to Supabase Storage (product-images bucket), and
// inserts every product into the products table.
//
// Usage:
//   1. Make sure Index/shared/config.js has your Supabase URL +
//      anon + service_role keys and ENABLE_DB: true
//   2. Run the SQL in trend-mart-database.sql in the SQL Editor
//   3. node seed-db.js
// (Requires Node.js 18+)
// ============================================================
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const INDEX = path.join(ROOT, 'Index');
const BUCKET = 'product-images';

const PAGES = {
    'bag/school.html': 'school',
    'bag/side.html': 'side',
    'bag/travel.html': 'travel',
    'chappal/chappal.html': 'chappal',
    'chappal/crocs.html': 'crocs',
    'dress/combo.html': 'combo',
    'dress/combotshirt.html': 'tcombo',
    'dress/pant.html': 'pant',
    'dress/shirt.html': 'shirt',
    'dress/tshirt.html': 'tshirt',
    'headset/airpod.html': 'airpod',
    'headset/headphone.html': 'headphone',
    'shoe/shoe.html': 'shoe',
    'watch/analog.html': 'analog',
    'watch/smart.html': 'smart',
    'watch/smc.html': 'smc'
};

function getConfig() {
    const file = path.join(INDEX, 'shared', 'config.js');
    const src = fs.readFileSync(file, 'utf8');
    const grab = (key) => {
        const m = src.match(new RegExp(key + '\\s*:\\s*"([^"]*)"'));
        return m ? m[1] : '';
    };
    return {
        url: grab('SUPABASE_URL'),
        anon: grab('SUPABASE_ANON_KEY'),
        service: grab('SUPABASE_SERVICE_KEY')
    };
}

function parseProducts(htmlFile, category) {
    const file = path.join(INDEX, htmlFile);
    const html = fs.readFileSync(file, 'utf8');
    const marker = 'const products = [';
    const start = html.indexOf(marker);
    if (start === -1) return [];
    const end = html.indexOf('];', start);
    if (end === -1) return [];
    const arrText = html.slice(start + marker.length, end);
    let arr = [];
    try {
        arr = eval('[' + arrText + ']');
    } catch (e) {
        console.error('  PARSE FAILED ' + htmlFile + ': ' + e.message);
        return [];
    }
    return arr.map(function (p, i) {
        return {
            product_code: String(p.code || (category + '-' + (i + 1))),
            name: String(p.name || ''),
            price: String(p.price || ''),
            mrp: deriveMrp(p.price),
            description: String(p.description || p.desc || ''),
            img: String(p.img || ''),
            category: category,
            out_of_stock: false,
            offer_percent: 0,
            sort_order: i + 1
        };
    }).reduce(function (acc, p) {
        const seen = acc._seen || (acc._seen = {});
        if (seen[p.product_code]) {
            let n = 2;
            let base = p.product_code;
            while (seen[base + '-' + n]) n++;
            p.product_code = base + '-' + n;
        }
        seen[p.product_code] = true;
        acc.push(p);
        return acc;
    }, []);
}

function resolveImage(imgPath, pageRel) {
    const dir = path.dirname(pageRel);
    const candidates = [
        path.join(INDEX, imgPath),
        path.join(INDEX, dir, imgPath),
        path.join(INDEX, dir, path.basename(imgPath))
    ];
    for (const c of candidates) {
        if (fs.existsSync(c)) return c;
    }
    return null;
}

function mimeOf(file) {
    const ext = path.extname(file).toLowerCase();
    const map = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp' };
    return map[ext] || 'image/jpeg';
}

async function deriveMrp(price) {
    // prices look like "₹ 1449/-" or "1449" -> strip non-digits
    const digits = String(price || '').replace(/[^0-9]/g, '');
    if (!digits) return '';
    const p = parseInt(digits, 10);
    if (!p) return '';
    // MRP = price + ~25% uplift, rounded up to nearest 10
    const mrp = Math.ceil((p * 1.25) / 10) * 10;
    return '₹ ' + mrp + '/-';
}

function api(base, cfg) {
    const headers = {
        'apikey': cfg.service,
        'Authorization': 'Bearer ' + cfg.service,
        'Content-Type': 'application/json'
    };
    return {
        createBucket: async () => {
            const r = await fetch(base + '/storage/v1/bucket', {
                method: 'POST', headers,
                body: JSON.stringify({ id: BUCKET, name: BUCKET, public: true })
            });
            if (!r.ok) {
                const t = await r.text();
                if (!String(t).includes('already exists') && !String(t).includes('Duplicate')) {
                    throw new Error('createBucket failed: ' + r.status + ' ' + t);
                }
            }
            console.log('Bucket ready: ' + BUCKET);
        },
        upload: async (storagePath, fileBuf, mime) => {
            const r = await fetch(base + '/storage/v1/object/' + BUCKET + '/' + storagePath, {
                method: 'POST',
                headers: {
                    'apikey': cfg.service,
                    'Authorization': 'Bearer ' + cfg.service,
                    'Content-Type': mime,
                    'x-upsert': 'true'
                },
                body: fileBuf
            });
            if (!r.ok) {
                const t = await r.text();
                throw new Error('upload ' + storagePath + ' failed: ' + r.status + ' ' + t);
            }
        },
        insertProducts: async (rows) => {
            const r = await fetch(base + '/rest/v1/products?on_conflict=product_code', {
                method: 'POST',
                headers: { ...headers, 'Prefer': 'resolution=merge-duplicates,return=minimal' },
                body: JSON.stringify(rows)
            });
            if (!r.ok) {
                const t = await r.text();
                throw new Error('insert products failed: ' + r.status + ' ' + t);
            }
        }
    };
}

async function main() {
    const cfg = getConfig();
    if (!cfg.url || cfg.url.indexOf('YOUR_') === 0) {
        console.error('ERROR: Put your Supabase keys in Index/shared/config.js first.');
        return;
    }
    if (!cfg.service || cfg.service.indexOf('YOUR_') === 0) {
        console.error('ERROR: service_role key is missing in config.js (needed for seeding).');
        return;
    }
    console.log('Connecting to ' + cfg.url);

    const client = await api(cfg.url, cfg);
    await client.createBucket();

    let uploaded = 0, skipped = 0, inserted = 0, failed = 0;

    for (const [pageRel, category] of Object.entries(PAGES)) {
        const products = parseProducts(pageRel, category);
        console.log('\n' + category + ' (' + pageRel + ') -> ' + products.length + ' products');

        const rows = [];
        for (const p of products) {
            const resolved = resolveImage(p.img, pageRel);
            let imageUrl = '';
            if (!resolved) {
                skipped++;
                console.log('  ! missing image file: ' + p.img);
            } else {
                const storagePath = category + '/' + path.basename(resolved);
                const buf = fs.readFileSync(resolved);
                try {
                    await client.upload(storagePath, buf, mimeOf(resolved));
                    imageUrl = cfg.url + '/storage/v1/object/public/' + BUCKET + '/' + storagePath;
                    uploaded++;
                } catch (e) {
                    failed++;
                    console.log('  ! upload error ' + p.img + ': ' + e.message);
                    continue;
                }
            }
            rows.push({
                product_code: p.product_code,
                name: p.name,
                price: p.price,
                mrp: p.mrp,
                description: p.description,
                image_url: imageUrl,
                category: p.category,
                out_of_stock: false,
                offer_percent: 0,
                sort_order: p.sort_order
            });
        }

        if (rows.length > 0) {
            try {
                await client.insertProducts(rows);
                inserted += rows.length;
                console.log('  inserted ' + rows.length + ' into DB');
            } catch (e) {
                failed += rows.length;
                console.error('  ! insert error: ' + e.message);
            }
        }
    }

    console.log('\n===== DONE =====');
    console.log('Images uploaded: ' + uploaded);
    console.log('Products inserted/updated: ' + inserted);
    console.log('Missing image files (skipped): ' + skipped);
    console.log('Errors: ' + failed);
    console.log('\nNext: open Admin/admin.html -> Products tab to manage everything.');
}

main().catch(function (e) {
    console.error('FATAL:', e);
});
