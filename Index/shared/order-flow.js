(function () {
    "use strict";

    function absUrl(u) {
        try { return new URL(u, location.href).href; } catch (e) { return u; }
    }

    function plainText(d) {
        return String(d || '').replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();
    }

    function cfg() {
        return window.TM_CONFIG || {};
    }

    function waNumber() {
        return cfg().WHATSAPP_NUMBER || '9188384350';
    }

    function parsePrice(price) {
        const n = parseFloat(String(price || '').replace(/[^0-9.]/g, ''));
        return isNaN(n) ? 0 : n;
    }

    let confirmEl = null;
    let lastOrder = null;

    function ensureConfirmModal() {
        if (confirmEl && document.body.contains(confirmEl)) return;
        confirmEl = document.createElement('div');
        confirmEl.id = 'tm-order-confirm';
        confirmEl.className = 'tm-order-confirm';
        confirmEl.innerHTML =
            '<div class="tm-order-confirm-box">' +
            '<button class="tm-order-confirm-close" type="button" onclick="window.TMOrderFlow.closeConfirm()">&times;</button>' +
            '<div class="tm-order-confirm-icon">&#10003;</div>' +
            '<h3>Order Placed!</h3>' +
            '<div class="tm-order-confirm-product">' +
            '<img id="tm-confirm-img" alt="">' +
            '<div><div id="tm-confirm-name" class="tm-confirm-name"></div>' +
            '<div id="tm-confirm-price" class="tm-confirm-price"></div></div>' +
            '</div>' +
            '<div class="tm-order-confirm-tracking">' +
            '<div class="tm-confirm-tracking-label">Your Tracking Code</div>' +
            '<div id="tm-confirm-code" class="tm-confirm-code"></div>' +
            '</div>' +
            '<button class="tm-order-confirm-share" type="button" onclick="window.TMOrderFlow.shareOrder()">Share</button>' +
            '<button class="tm-order-confirm-ok" type="button" onclick="window.TMOrderFlow.closeConfirm()">Done</button>' +
            '</div>';
        document.body.appendChild(confirmEl);
        const style = document.createElement('style');
        style.id = 'tm-order-confirm-style';
        style.textContent =
            '.tm-order-confirm{position:fixed;inset:0;background:rgba(0,0,0,.55);display:none;align-items:center;justify-content:center;z-index:999999;padding:20px}' +
            '.tm-order-confirm.active{display:flex}' +
            '.tm-order-confirm-box{background:#fff;border-radius:14px;width:100%;max-width:380px;padding:26px 22px;position:relative;text-align:center;max-height:90vh;overflow-y:auto}' +
            '.tm-order-confirm-close{position:absolute;top:10px;right:14px;font-size:26px;background:none;border:none;cursor:pointer;color:#555}' +
            '.tm-order-confirm-icon{width:58px;height:58px;margin:0 auto 10px;border-radius:50%;background:#25D366;color:#fff;font-size:30px;line-height:58px}' +
            '.tm-order-confirm-box h3{margin:0 0 14px;font-size:1.25rem}' +
            '.tm-order-confirm-product{display:flex;gap:12px;align-items:center;border:1px solid #eee;border-radius:8px;padding:10px;margin-bottom:14px;background:#fafafa;text-align:left}' +
            '.tm-order-confirm-product img{width:54px;height:54px;object-fit:cover;border-radius:6px}' +
            '.tm-confirm-name{font-weight:600;font-size:14px}' +
            '.tm-confirm-price{color:#e63946;font-weight:600;font-size:14px;margin-top:2px}' +
            '.tm-order-confirm-tracking{background:#f1f9ff;border:1px dashed #2196f3;border-radius:8px;padding:10px;margin-bottom:16px}' +
            '.tm-confirm-tracking-label{font-size:12px;color:#666;margin-bottom:4px}' +
            '.tm-confirm-code{font-size:20px;font-weight:700;letter-spacing:1px;color:#1565c0}' +
            '.tm-order-confirm-share{width:100%;padding:13px;border:none;border-radius:8px;background:#2196f3;color:#fff;font-size:16px;font-weight:600;cursor:pointer;margin-bottom:8px}' +
            '.tm-order-confirm-ok{width:100%;padding:13px;border:none;border-radius:8px;background:#eee;color:#333;font-size:16px;font-weight:600;cursor:pointer}';
        document.head.appendChild(style);
    }

    function buildMessage(product, name, phone, address, trackingCode) {
        const lines = [];
        lines.push("Hey I'm interested to buy this product");
        lines.push("");
        lines.push("Product: " + product.name);
        lines.push("Code: " + product.code);
        lines.push("Price: " + product.price);
        lines.push("Description: " + plainText(product.desc || product.description));
        lines.push("Image: " + absUrl(product.img));
        if (trackingCode) {
            lines.push("");
            lines.push("*Tracking Code: " + trackingCode + "*");
        }
        lines.push("");
        lines.push("Customer: " + name);
        lines.push("Phone: " + phone);
        if (address) lines.push("Address: " + address);
        lines.push("");
        lines.push("Please confirm my order.");
        return lines.join("\n");
    }

    function openWhatsApp(message, openWin) {
        const url = "https://wa.me/" + waNumber() + "?text=" + encodeURIComponent(message);
        if (openWin && !openWin.closed) {
            openWin.location.href = url;
        } else {
            window.open(url, '_blank');
        }
    }

    function placeOrderDB(product, name, phone, address) {
        return window.TMSupabase.placeOrder({
            customer_name: name,
            customer_phone: phone,
            customer_address: address,
            items: [{ id: product.id, code: product.code, name: product.name, price: product.price, img: absUrl(product.img), qty: 1 }],
            total: parsePrice(product.price),
            order_time: new Date().toISOString(),
            whatsapp_redirect_time: new Date().toISOString()
        });
    }

    function showConfirm(product, trackingCode) {
        ensureConfirmModal();
        lastOrder = { product: product, code: trackingCode };
        document.getElementById('tm-confirm-img').src = absUrl(product.img);
        document.getElementById('tm-confirm-name').textContent = product.name;
        document.getElementById('tm-confirm-price').textContent = product.price;
        document.getElementById('tm-confirm-code').textContent = trackingCode || '';
        confirmEl.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeConfirm() {
        if (confirmEl) confirmEl.classList.remove('active');
        document.body.style.overflow = '';
    }

    function shareOrder() {
        if (!lastOrder) return;
        const code = lastOrder.code;
        const text = code
            ? "I just placed an order on Trend Fashion Club. Track my order with code: " + code
            : "I just placed an order on Trend Fashion Club.";
        const shareData = {
            title: 'Order Confirmed',
            text: text,
            url: location.origin + location.pathname.replace(/[^/]*$/, '') + 'track.html'
        };
        if (navigator.share) {
            navigator.share(shareData).catch(function () {});
        } else {
            const wa = 'https://wa.me/?text=' + encodeURIComponent(text + ' ' + shareData.url);
            window.open(wa, '_blank');
        }
    }

    window.TMOrderFlow = {
        submitBuyOrder: function (product, name, phone, address, openWin) {
            if (!product) return Promise.resolve(false);
            const msg = buildMessage(product, name, phone, address, "");
            if (window.TMSupabase && window.TMSupabase.isConfigured()) {
                return placeOrderDB(product, name, phone, address).then(function (res) {
                    const code = res.ok ? res.code : "";
                    const fullMsg = buildMessage(product, name, phone, address, code);
                    openWhatsApp(fullMsg, openWin);
                    showConfirm(product, code);
                    return !!code;
                }).catch(function () {
                    openWhatsApp(msg, openWin);
                    showConfirm(product, "");
                    return false;
                });
            }
            openWhatsApp(msg, openWin);
            showConfirm(product, "");
            return Promise.resolve(false);
        },
        closeConfirm: closeConfirm,
        shareOrder: shareOrder
    };
})();
