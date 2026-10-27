import { Router } from "express";
import { supabase } from "../lib/supabase.js";
import { config } from "../config.js";
import { parseCheckoutItems, priceCheckoutItems } from "../lib/checkout.js";
import {
  asyncHandler,
  HttpError,
  sanitize,
  generateTrackingCode,
  rateLimit
} from "../lib/helpers.js";

const router = Router();

/* ---------- GET /api/config : public store config ---------- */
router.get(
  "/config",
  asyncHandler(async (_req, res) => {
    res.json({
      storeName: config.storeName,
      whatsappNumber: config.whatsappNumber,
      trackingPrefix: config.trackingPrefix
    });
  })
);

/* ---------- GET /api/products?category=&q=&limit=&offset= ---------- */

const tokenize = (v) =>
  String(v || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);

/* common words map to the real category slugs */
const CATEGORY_SYNONYMS = {
  watch: ["analog", "smart", "smc"],
  watches: ["analog", "smart", "smc"],
  bag: ["school", "side", "travel"],
  bags: ["school", "side", "travel"],
  backpack: ["school", "travel"],
  backpacks: ["school", "travel"],
  shoe: ["shoe"],
  shoes: ["shoe"],
  slipper: ["chappal", "crocs"],
  slippers: ["chappal", "crocs"],
  sandal: ["chappal"],
  sandals: ["chappal"],
  footwear: ["shoe", "chappal", "crocs"],
  earphone: ["airpod", "headphone"],
  earphones: ["airpod", "headphone"],
  airpods: ["airpod"],
  headphone: ["headphone"],
  headphones: ["headphone"],
  pant: ["pant"],
  pants: ["pant"],
  trouser: ["pant"],
  trousers: ["pant"],
  shirt: ["shirt"],
  shirts: ["shirt"],
  tees: ["tshirt", "tcombo"],
  tee: ["tshirt", "tcombo"],
  tshirt: ["tshirt", "tcombo"],
  tshirts: ["tshirt", "tcombo"],
  combo: ["combo", "tcombo", "smc"],
  combos: ["combo", "tcombo", "smc"]
};

/**
 * Relevance score: exact word hits on category > name > product code.
 * Descriptions are intentionally ignored (marketing noise).
 */
function scoreProduct(p, terms) {
  const nameTok = tokenize(p.name);
  const catTok = tokenize(p.category);
  const code = String(p.product_code || "").toLowerCase();
  let score = 0;

  for (const t of terms) {
    if (t.length < 2) continue;
    if (catTok.includes(t) || CATEGORY_SYNONYMS[t]?.includes(p.category)) score += 120;
    if (code === t) score += 90;
    else if (code.includes(t)) score += 55;
    if (nameTok.includes(t)) score += 80;
    else if (
      t.length >= 4 &&
      nameTok.some((tok) => tok.startsWith(t))
    ) {
      score += 30;
    }
  }
  return score;
}

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const { category, q } = req.query;
    const limit = Math.min(Number(req.query.limit) || 1000, 1000);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const filterCat = category && category !== "all";

    /* ---------- browse mode ---------- */
    if (!q) {
      let query = supabase
        .from("products")
        .select("*", { count: "exact" })
        .order("sort_order", { ascending: true })
        .range(offset, offset + limit - 1);
      if (filterCat) query = query.eq("category", category);

      const { data, error, count } = await query;
      if (error) throw new HttpError(500, error.message);
      return res.json({ products: data || [], total: count || 0 });
    }

    /* ---------- search mode: candidates from DB, ranked here ---------- */
    const terms = sanitize(q, 80)
      .toLowerCase()
      .replace(/["%*,()]/g, " ")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 4);

    const synSlugs = [...new Set(terms.flatMap((t) => CATEGORY_SYNONYMS[t] || []))];

    const tasks = [];
    // 1) synonym categories ("watch" -> analog/smart/smc …)
    if (synSlugs.length) {
      let tq = supabase.from("products").select("*").in("category", synSlugs);
      if (filterCat) tq = tq.eq("category", category);
      tasks.push(tq);
    }
    // 2) word matches on name / code / category
    if (terms.length) {
      let wq = supabase.from("products").select("*");
      if (filterCat) wq = wq.eq("category", category);
      const conds = [];
      for (const w of terms) {
        const pattern = `"*${w}*"`;
        conds.push(
          `name.ilike.${pattern}`,
          `product_code.ilike.${pattern}`,
          `category.ilike.${pattern}`
        );
      }
      tasks.push(wq.or(conds.join(",")));
    }

    const results = await Promise.all(tasks);
    const merged = new Map();
    for (const r of results) {
      if (r.error) throw new HttpError(500, r.error.message);
      for (const p of r.data || []) merged.set(p.id, p);
    }

    const lowerTerms = terms.map((t) => t.toLowerCase());
    const ranked = [...merged.values()]
      .map((p) => ({ p, s: scoreProduct(p, lowerTerms) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s || (a.p.sort_order || 0) - (b.p.sort_order || 0))
      .map((x) => x.p);

    res.json({
      products: ranked.slice(offset, offset + limit),
      total: ranked.length
    });
  })
);

/* ---------- GET /api/products/:code ---------- */
router.get(
  "/products/:code",
  asyncHandler(async (req, res) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("product_code", req.params.code)
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!data) throw new HttpError(404, "Product not found");
    res.json({ product: data });
  })
);

/* ---------- GET /api/categories : distinct categories with counts ---------- */
router.get(
  "/categories",
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabase
      .from("products")
      .select("category,image_url,out_of_stock");
    if (error) throw new HttpError(500, error.message);

    const map = new Map();
    for (const p of data || []) {
      if (!map.has(p.category)) {
        map.set(p.category, { slug: p.category, count: 0, image: "" });
      }
      const cat = map.get(p.category);
      cat.count += 1;
      if (!cat.image && p.image_url) cat.image = p.image_url;
    }
    res.json({ categories: [...map.values()] });
  })
);

/* ---------- GET /api/content : offers + banners + active popups ---------- */
router.get(
  "/content",
  asyncHandler(async (_req, res) => {
    const [offersRes, bannersRes, popupsRes] = await Promise.all([
      supabase.from("offers").select("*").eq("active", true).order("created_at", { ascending: false }),
      supabase.from("banners").select("*").eq("active", true).order("sort_order", { ascending: true }),
      supabase.from("popups").select("*").eq("active", true).order("created_at", { ascending: false })
    ]);

    for (const result of [offersRes, bannersRes, popupsRes]) {
      if (result.error) throw new HttpError(500, "Could not load store content");
    }

    const now = Date.now();
    const popups = (popupsRes.data || []).filter((p) => {
      const start = p.start_date ? new Date(p.start_date).getTime() : 0;
      const end = p.end_date ? new Date(p.end_date).getTime() : Infinity;
      return now >= start && now <= end;
    });

    res.json({
      offers: offersRes.data || [],
      banners: bannersRes.data || [],
      popups
    });
  })
);

/* ---------- POST /api/orders : place an order ---------- */
router.post("/orders", rateLimit({ windowMs: 60_000, max: 10 }), asyncHandler(async (req, res) => {
  const body = req.body || {};
  const customer_name = sanitize(body.customer_name, 120);
  const customer_phone = sanitize(body.customer_phone, 20);
  const customer_address = sanitize(body.customer_address, 400);
  if (!customer_name) throw new HttpError(400, "Name is required");
  if (!/^[0-9+\-\s]{10,15}$/.test(customer_phone)) throw new HttpError(400, "Valid phone number required");

  const requested = parseCheckoutItems(body.items);
  const { data: catalog, error: productError } = await supabase
    .from("products")
    .select("id,product_code,name,price,image_url,out_of_stock")
    .in("product_code", requested.map((item) => item.code));
  if (productError) throw new HttpError(500, "Cannot verify current prices");
  const { items, total } = priceCheckoutItems(requested, catalog);
  const now = new Date().toISOString();
  const payload = {
    customer_name, customer_phone, customer_address, items, total,
    status: "Order Placed", status_history: [{ status: "Order Placed", at: now }],
    order_time: now, whatsapp_redirect_time: now
  };
  for (let attempt = 0; attempt < 5; attempt++) {
    payload.tracking_code = generateTrackingCode();
    const { data, error } = await supabase.from("orders").insert(payload).select().single();
    if (!error) return res.status(201).json({ ok: true, order: data });
    if (error.code !== "23505") throw new HttpError(500, "Could not save order");
  }
  throw new HttpError(500, "Please retry your order");
}));

/* ---------- GET /api/orders/track/:code ---------- */
router.get(
  "/orders/track/:code",
  rateLimit({ windowMs: 60_000, max: 30 }),
  asyncHandler(async (req, res) => {
    const code = sanitize(req.params.code, 20).toUpperCase();
    const { data, error } = await supabase
      .from("orders")
      .select("tracking_code,items,total,status,status_history,order_time,created_at")
      .eq("tracking_code", code)
      .maybeSingle();
    if (error) throw new HttpError(500, error.message);
    if (!data) throw new HttpError(404, "No order found with this tracking code");
    res.json({ order: data });
  })
);

/* ---------- POST /api/chat : proxy to the AI edge function ---------- */
router.post(
  "/chat",
  rateLimit({ windowMs: 60_000, max: 25 }),
  asyncHandler(async (req, res) => {
    if (!config.chatFunctionUrl) {
      return res.json({ reply: "Chat is not configured yet." });
    }
    const message = sanitize(req.body?.message, 1000);
    const sessionId = sanitize(req.body?.session_id, 80) || "anon";
    if (!message) throw new HttpError(400, "Message is required");

    const upstream = await fetch(config.chatFunctionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.supabaseServiceKey}`,
        apikey: config.supabaseServiceKey
      },
      body: JSON.stringify({ message, session_id: sessionId })
    });

    if (!upstream.ok) {
      return res.json({ reply: "Sorry, the assistant is unavailable right now." });
    }
    const text = await upstream.text();
    try {
      res.status(upstream.status).json(JSON.parse(text));
    } catch {
      res.json({ reply: text });
    }
  })
);

export default router;
