import express from "express";
import crypto from "crypto";
import multer from "multer";
import jwt from "jsonwebtoken";

const app = express();
app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const SB_URL = process.env.SUPABASE_URL || "https://ycezesfuypzgdmpamooh.supabase.co";
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY;
// Publishable key is intentionally public. Supabase RLS still controls which rows are readable.
const PUBLIC_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || "sb_publishable_X8XTU-_ICnmTpI18sJWZzQ_hqN6OnqY";
const STORE = process.env.STORE_NAME || "Trend Mart";
const WA = process.env.WHATSAPP_NUMBER || "9188384350";
const PREFIX = process.env.TRACKING_PREFIX || "TM";
const ADM_EMAIL = process.env.ADMIN_EMAIL;
const ADM_PASS = process.env.ADMIN_PASSWORD;
const JWT_SEC = process.env.JWT_SECRET;
const JWT_EXP = parseInt(process.env.JWT_EXPIRES_IN) || 7;
const CHAT_URL = process.env.CHAT_FUNCTION_URL;

async function sb(table, opts = {}) {
  const method = (opts.method || "GET").toUpperCase();
  const publicRead = method === "GET";
  const firstKey = publicRead ? (PUBLIC_KEY || SB_KEY) : SB_KEY;
  if (!firstKey) throw new Error("Supabase server key is not configured");

  const url = new URL("/rest/v1/" + table, SB_URL);
  Object.entries(opts.params || {}).forEach(([k, v]) => url.searchParams.set(k, String(v)));

  const requestWithKey = (key) => {
    // Supabase's sb_publishable_/sb_secret_ keys are API keys, NOT JWTs.
    // Sending them as Authorization Bearer causes "Invalid JWT" responses.
    const headers = {
      apikey: key,
      "Content-Type": "application/json",
      Prefer: opts.prefer || "return=representation"
    };
    if (!key.startsWith("sb_")) headers.Authorization = "Bearer " + key;
    return fetch(url, {
      method,
      headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined
    });
  };

  const response = await requestWithKey(firstKey);
  // Restricted RLS can return 200 with zero visible rows rather than 401.
  // Fall back to the server key when available, without ever exposing it to the client.
  if (publicRead && SB_KEY && SB_KEY !== firstKey) {
    if (!response.ok && [401, 403].includes(response.status)) {
      return requestWithKey(SB_KEY);
    }
    if (response.ok) {
      const publicRows = await response.clone().json().catch(() => null);
      if (Array.isArray(publicRows) && publicRows.length === 0) {
        const privileged = await requestWithKey(SB_KEY);
        if (privileged.ok) return privileged;
      }
    }
  }
  return response;
}

function timingEq(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a), bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function genCode() { return PREFIX + "-" + crypto.randomBytes(4).toString("hex").toUpperCase(); }
function san(s) { return String(s || "").replace(/<[^>]*>/g, "").trim().slice(0, 500); }

app.get("/api/health", (_, res) => res.json({ ok: true, name: STORE }));
app.get("/api/config", (_, res) => res.json({ storeName: STORE, whatsappNumber: WA, trackingPrefix: PREFIX }));

app.get("/api/categories", async (_req, res) => {
  try {
    const response = await sb("products", { params: { select: "category,image_url,out_of_stock", limit: "1000" } });
    if (!response.ok) throw new Error("Could not load categories");
    const products = await response.json();
    if (!Array.isArray(products)) throw new Error("Unexpected category response");
    const byCategory = new Map();
    for (const p of products) {
      if (!p.category) continue;
      if (!byCategory.has(p.category)) byCategory.set(p.category, { slug: p.category, count: 0, image: "" });
      const cat = byCategory.get(p.category);
      cat.count += 1;
      if (!cat.image && p.image_url) cat.image = p.image_url;
    }
    res.json({ categories: [...byCategory.values()] });
  } catch (e) {
    console.error("[categories]", e);
    res.status(503).json({ error: "Categories are temporarily unavailable" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const response = await sb("products", { params: { select: "*", order: "sort_order.asc", limit: "1000" } });
    if (!response.ok) throw new Error("Could not load catalogue");
    const products = await response.json();
    if (!Array.isArray(products)) throw new Error("Unexpected catalogue response");

    let filtered = products;
    const category = typeof req.query.category === "string" ? req.query.category : "";
    if (category && category !== "all") filtered = filtered.filter((p) => p.category === category);
    const query = String(req.query.q || req.query.search || "").trim().toLowerCase().slice(0, 100);
    if (query) {
      const words = query.split(/\s+/).filter(Boolean);
      const synonyms = {
        watch: ["analog", "smart", "smc"], watches: ["analog", "smart", "smc"],
        bag: ["school", "side", "travel"], bags: ["school", "side", "travel"],
        shoes: ["shoe"], slippers: ["chappal", "crocs"],
        tshirt: ["tshirt", "tcombo"], earphones: ["airpod", "headphone"]
      };
      filtered = filtered.filter((p) => words.every((word) => {
        const searchable = String([p.name, p.category, p.product_code].join(" ")).toLowerCase();
        return searchable.includes(word) || (synonyms[word] || []).includes(p.category);
      }));
    }
    const limit = Math.min(1000, Math.max(1, parseInt(req.query.limit, 10) || 1000));
    const offset = Math.max(0, parseInt(req.query.offset, 10) || 0);
    res.json({ products: filtered.slice(offset, offset + limit), total: filtered.length });
  } catch (e) {
    console.error("[products]", e);
    res.status(503).json({ error: "Product catalogue is temporarily unavailable" });
  }
});

app.get("/api/products/:code", async (req, res) => {
  try {
    const code = String(req.params.code || "").slice(0, 40);
    const response = await sb("products", { params: { select: "*", product_code: "eq." + code, limit: "1" } });
    if (!response.ok) throw new Error("Could not load product");
    const products = await response.json();
    if (!Array.isArray(products)) throw new Error("Unexpected product response");
    if (!products[0]) return res.status(404).json({ error: "Product not found" });
    res.json({ product: products[0] });
  } catch (e) {
    console.error("[product]", e);
    res.status(503).json({ error: "Product details are temporarily unavailable" });
  }
});

app.post("/api/orders", async (req, res) => {
  try {
    const { customer_name, customer_phone, items, total_amount, address } = req.body;
    if (!customer_name || !customer_phone || !items?.length || !total_amount) return res.status(400).json({ error: "Missing fields" });
    const tracking_code = genCode();
    const order = { customer_name: san(customer_name), customer_phone: san(customer_phone), items, total_amount: Number(total_amount), address: san(address), tracking_code, status: "Order Placed", status_history: [{ status: "Order Placed", time: new Date().toISOString() }] };
    const r = await sb("orders", { method: "POST", body: order });
    const d = await r.json();
    if (d?.[0]) res.json({ order: d[0], tracking_code });
    else res.status(500).json({ error: "Failed" });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/orders/track/:code", async (req, res) => {
  try {
    const r = await sb("orders", { params: { tracking_code: `eq.${req.params.code.toUpperCase()}`, select: "*" } });
    const d = await r.json();
    if (!d?.length) return res.status(404).json({ error: "Not found" });
    res.json(d[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/admin/login", (req, res) => {
  try {
    const { email, password } = req.body;
    if (!timingEq(email || "", ADM_EMAIL || "") || !timingEq(password || "", ADM_PASS || "")) return res.status(401).json({ error: "Invalid credentials" });
    const token = jwt.sign({ role: "admin", email }, JWT_SEC, { expiresIn: `${JWT_EXP}d` });
    res.json({ token, email });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/admin/orders", async (_, res) => {
  try { const r = await sb("orders", { params: { select: "*", order: "created_at.desc", limit: "500" } }); res.json(await r.json()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/admin/orders/:id", async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) return res.status(400).json({ error: "Status required" });
    const r = await sb("orders", { method: "PATCH", params: { id: `eq.${req.params.id}`, select: "*" }, body: { status, status_history: [{ status, time: new Date().toISOString() }] } });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/admin/orders/:id", async (req, res) => {
  try { await sb("orders", { method: "DELETE", params: { id: `eq.${req.params.id}` } }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/admin/products", async (_, res) => {
  try { const r = await sb("products", { params: { select: "*", order: "created_at.desc", limit: "1000" } }); res.json(await r.json()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/admin/products", async (req, res) => {
  try { const r = await sb("products", { method: "POST", body: req.body, params: { select: "*" } }); res.json((await r.json())?.[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put("/api/admin/products/:id", async (req, res) => {
  try { const r = await sb("products", { method: "PATCH", params: { id: `eq.${req.params.id}`, select: "*" }, body: req.body }); res.json(await r.json()); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete("/api/admin/products/:id", async (req, res) => {
  try { await sb("products", { method: "DELETE", params: { id: `eq.${req.params.id}` } }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get("/api/content", async (_, res) => {
  try {
    const [banners, popups, offers] = await Promise.all([
      sb("banners", { params: { select: "*", order: "created_at.desc" } }).then(r => r.json()),
      sb("popups", { params: { select: "*", order: "created_at.desc" } }).then(r => r.json()),
      sb("offers", { params: { select: "*", order: "created_at.desc" } }).then(r => r.json()),
    ]);
    res.json({ banners: banners || [], popups: popups || [], offers: offers || [] });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

for (const t of ["banners", "popups", "offers"]) {
  app.get(`/api/admin/${t}`, async (_, res) => { try { const r = await sb(t, { params: { select: "*", order: "created_at.desc" } }); res.json(await r.json()); } catch (e) { res.status(500).json({ error: e.message }); } });
  app.post(`/api/admin/${t}`, async (req, res) => { try { const r = await sb(t, { method: "POST", body: req.body, params: { select: "*" } }); res.json((await r.json())?.[0]); } catch (e) { res.status(500).json({ error: e.message }); } });
  app.put(`/api/admin/${t}/:id`, async (req, res) => { try { const r = await sb(t, { method: "PATCH", params: { id: `eq.${req.params.id}`, select: "*" }, body: req.body }); res.json(await r.json()); } catch (e) { res.status(500).json({ error: e.message }); } });
  app.delete(`/api/admin/${t}/:id`, async (req, res) => { try { await sb(t, { method: "DELETE", params: { id: `eq.${req.params.id}` } }); res.json({ ok: true }); } catch (e) { res.status(500).json({ error: e.message }); } });
}

app.post("/api/admin/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file" });
    const ext = req.file.originalname.split(".").pop();
    const name = `uploads/${Date.now()}-${crypto.randomBytes(4).toString("hex")}.${ext}`;
    const r = await fetch(`${SB_URL}/storage/v1/object/trend-mart-images/${name}`, { method: "POST", headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": req.file.mimetype }, body: req.file.buffer });
    if (!r.ok) return res.status(500).json({ error: "Upload failed" });
    res.json({ url: `${SB_URL}/storage/v1/object/public/trend-mart-images/${name}` });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!CHAT_URL) return res.json({ reply: "Chat not configured." });
    const r = await fetch(CHAT_URL, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(req.body) });
    res.json(await r.json());
  } catch (e) { res.status(500).json({ error: e.message }); }
});

export default app;
