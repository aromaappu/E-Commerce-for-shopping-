import { Router } from "express";
import multer from "multer";
import crypto from "crypto";
import { supabase, STORAGE_BUCKET } from "../lib/supabase.js";
import { config } from "../config.js";
import {
  asyncHandler,
  HttpError,
  sanitize,
  rateLimit
} from "../lib/helpers.js";
import { requireAdmin, signAdminToken } from "../middleware/auth.js";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.use((req, res, next) => {
  if (req.path === "/login") return next();
  return requireAdmin(req, res, next);
});

/* ---------- POST /api/admin/login ---------- */
router.post(
  "/login",
  rateLimit({ windowMs: 60_000, max: 8 }),
  asyncHandler(async (req, res) => {
    const email = sanitize(req.body?.email, 120).toLowerCase();
    const password = String(req.body?.password || "");

    const okEmail =
      config.adminEmail &&
      email.length === config.adminEmail.length &&
      crypto.timingSafeEqual(Buffer.from(email), Buffer.from(config.adminEmail.toLowerCase()));
    const okPass =
      config.adminPassword &&
      password.length === config.adminPassword.length &&
      crypto.timingSafeEqual(Buffer.from(password), Buffer.from(config.adminPassword));

    if (!okEmail || !okPass) throw new HttpError(401, "Invalid email or password");
    res.json({ token: signAdminToken() });
  })
);

/* ================= PRODUCTS ================= */

router.get(
  "/products",
  asyncHandler(async (_req, res) => {
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw new HttpError(500, error.message);
    res.json({ products: data || [] });
  })
);

function productPayload(body) {
  return {
    name: sanitize(body.name, 200),
    price: sanitize(body.price, 30),
    mrp: sanitize(body.mrp, 30),
    description: sanitize(body.description, 2000),
    image_url: String(body.image_url || "").slice(0, 600),
    category: sanitize(body.category, 60).toLowerCase() || "misc",
    out_of_stock: !!body.out_of_stock,
    offer_percent: Number(body.offer_percent) || 0,
    sort_order: Number.isFinite(Number(body.sort_order)) ? Number(body.sort_order) : 0
  };
}

router.post(
  "/products",
  asyncHandler(async (req, res) => {
    const payload = productPayload(req.body || {});
    if (!payload.name) throw new HttpError(400, "Product name is required");
    let code = sanitize(req.body?.product_code, 40).toUpperCase();
    if (!code) {
      code = `TM${Date.now().toString(36).toUpperCase()}${crypto.randomInt(10, 99)}`;
    }
    const { data, error } = await supabase
      .from("products")
      .insert({ ...payload, product_code: code })
      .select()
      .single();
    if (error) {
      if (error.code === "23505") throw new HttpError(409, "Product code already exists");
      throw new HttpError(500, error.message);
    }
    res.status(201).json({ product: data });
  })
);

router.put(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const payload = productPayload(req.body || {});
    if (!payload.name) throw new HttpError(400, "Product name is required");
    const update = { ...payload };
    if (req.body?.product_code) {
      update.product_code = sanitize(req.body.product_code, 40).toUpperCase();
    }
    const { data, error } = await supabase
      .from("products")
      .update(update)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new HttpError(500, error.message);
    res.json({ product: data });
  })
);

router.delete(
  "/products/:id",
  asyncHandler(async (req, res) => {
    const { error } = await supabase.from("products").delete().eq("id", req.params.id);
    if (error) throw new HttpError(500, error.message);
    res.json({ ok: true });
  })
);

/* ================= ORDERS ================= */

const ORDER_STATUSES = [
  "Order Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];
router.get("/statuses", (_req, res) => res.json({ statuses: ORDER_STATUSES }));

router.get(
  "/orders",
  asyncHandler(async (req, res) => {
    const { status, q } = req.query;
    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(300);
    if (status && status !== "all") query = query.eq("status", status);
    if (q) {
      const words = sanitize(q, 80)
        .replace(/["%*,()]/g, " ")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 5);
      if (words.length) {
        const conds = [];
        for (const w of words) {
          const pattern = `"*${w}*"`;
          conds.push(
            `tracking_code.ilike.${pattern}`,
            `customer_name.ilike.${pattern}`,
            `customer_phone.ilike.${pattern}`
          );
        }
        query = query.or(conds.join(","));
      }
    }
    const { data, error } = await query;
    if (error) throw new HttpError(500, error.message);
    res.json({ orders: data || [] });
  })
);

router.post(
  "/orders",
  asyncHandler(async (req, res) => {
    const body = req.body || {};
    const items = Array.isArray(body.items)
      ? body.items.map((it) => ({
          id: it.id ?? null,
          code: sanitize(it.code, 40),
          name: sanitize(it.name, 200),
          price: sanitize(it.price, 30),
          img: String(it.img || "").slice(0, 600),
          qty: Math.max(1, Math.min(Number(it.qty) || 1, 99))
        }))
      : [];
    const now = new Date().toISOString();
    const status = ORDER_STATUSES.includes(body.status) ? body.status : "Order Placed";
    const payload = {
      tracking_code: sanitize(body.tracking_code, 20).toUpperCase() || undefined,
      customer_name: sanitize(body.customer_name, 120),
      customer_phone: sanitize(body.customer_phone, 20),
      customer_address: sanitize(body.customer_address, 400),
      items,
      total: Number(body.total) || 0,
      status,
      status_history: [{ status, at: now }],
      order_time: now,
      whatsapp_redirect_time: now
    };
    const { data, error } = await supabase.from("orders").insert(payload).select().single();
    if (error) {
      if (error.code === "23505") throw new HttpError(409, "Tracking code already exists");
      throw new HttpError(500, error.message);
    }
    res.status(201).json({ order: data });
  })
);

router.put(
  "/orders/:id/status",
  asyncHandler(async (req, res) => {
    const status = sanitize(req.body?.status, 40);
    if (!ORDER_STATUSES.includes(status)) throw new HttpError(400, "Invalid order status");

    const { data: existing, error: fetchErr } = await supabase
      .from("orders")
      .select("status_history")
      .eq("id", req.params.id)
      .single();
    if (fetchErr) throw new HttpError(404, "Order not found");

    const history = Array.isArray(existing.status_history) ? existing.status_history : [];
    history.push({ status, at: new Date().toISOString() });

    const { data, error } = await supabase
      .from("orders")
      .update({ status, status_history: history })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) throw new HttpError(500, error.message);
    res.json({ order: data });
  })
);

router.delete(
  "/orders/:id",
  asyncHandler(async (req, res) => {
    const { error } = await supabase.from("orders").delete().eq("id", req.params.id);
    if (error) throw new HttpError(500, error.message);
    res.json({ ok: true });
  })
);

/* ================= BANNERS / POPUPS / OFFERS ================= */

async function contentCrud(route, table, mapper) {
  router.get(
    `/${route}`,
    asyncHandler(async (_req, res) => {
      const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: false });
      if (error) throw new HttpError(500, error.message);
      res.json({ [route]: data || [] });
    })
  );

  router.post(
    `/${route}`,
    asyncHandler(async (req, res) => {
      const payload = mapper(req.body || {});
      const { data, error } = await supabase.from(table).insert(payload).select().single();
      if (error) throw new HttpError(500, error.message);
      res.status(201).json({ [route.slice(0, -1)]: data });
    })
  );

  router.put(
    `/${route}/:id`,
    asyncHandler(async (req, res) => {
      const payload = mapper(req.body || {});
      const { data, error } = await supabase.from(table).update(payload).eq("id", req.params.id).select().single();
      if (error) throw new HttpError(500, error.message);
      res.json({ [route.slice(0, -1)]: data });
    })
  );

  router.delete(
    `/${route}/:id`,
    asyncHandler(async (req, res) => {
      const { error } = await supabase.from(table).delete().eq("id", req.params.id);
      if (error) throw new HttpError(500, error.message);
      res.json({ ok: true });
    })
  );
}

contentCrud("banners", "banners", (b) => ({
  title: sanitize(b.title, 120) || "Banner",
  image_url: String(b.image_url || "").slice(0, 600),
  sort_order: Number(b.sort_order) || 0,
  active: b.active === undefined ? true : !!b.active
}));

contentCrud("popups", "popups", (p) => ({
  title: sanitize(p.title, 120) || "Poster",
  link: String(p.link || "").slice(0, 600),
  image_url: String(p.image_url || "").slice(0, 600),
  active: p.active === undefined ? true : !!p.active,
  start_date: p.start_date ? new Date(p.start_date).toISOString() : null,
  end_date: p.end_date ? new Date(p.end_date).toISOString() : null
}));

contentCrud("offers", "offers", (o) => ({
  title: sanitize(o.title, 200),
  description: sanitize(o.description, 400),
  active: o.active === undefined ? true : !!o.active
}));

/* ================= IMAGE UPLOAD ================= */

router.post(
  "/upload",
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) throw new HttpError(400, "No image file provided");
    if (!/^image\//.test(req.file.mimetype)) throw new HttpError(400, "Only image files are allowed");

    const ext = (req.file.originalname.match(/\.[a-zA-Z0-9]+$/) || [".jpg"])[0].toLowerCase();
    const folder = sanitize(req.body?.folder, 40) || "uploads";
    const path = `${folder}/${Date.now()}-${crypto.randomBytes(6).toString("hex")}${ext}`;

    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, req.file.buffer, { contentType: req.file.mimetype, upsert: false });
    if (error) throw new HttpError(500, error.message);

    res.status(201).json({
      path,
      url: `${config.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`
    });
  })
);

/* ================= REPORTS ================= */

router.get(
  "/reports",
  asyncHandler(async (_req, res) => {
    const since = new Date(Date.now() - 13 * 24 * 3600 * 1000);
    since.setHours(0, 0, 0, 0);

    const [ordersRes, productsRes] = await Promise.all([
      supabase.from("orders").select("*").gte("created_at", since.toISOString()),
      supabase.from("products").select("category,out_of_stock")
    ]);
    if (ordersRes.error) throw new HttpError(500, ordersRes.error.message);

    const orders = ordersRes.data || [];
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let revenue = 0;
    let pending = 0;
    let delivered = 0;
    let cancelled = 0;
    let todayOrders = 0;
    let todayRevenue = 0;
    const statusCounts = {};
    const dailyMap = {};
    const productCounts = {};

    for (let i = 0; i < 14; i++) {
      const d = new Date(since.getTime() + i * 24 * 3600 * 1000);
      dailyMap[d.toISOString().slice(0, 10)] = { date: d.toISOString().slice(0, 10), orders: 0, revenue: 0 };
    }

    for (const o of orders) {
      const st = o.status || "Unknown";
      statusCounts[st] = (statusCounts[st] || 0) + 1;
      if (st === "Delivered") delivered += 1;
      else if (st === "Cancelled") cancelled += 1;
      else pending += 1;

      const created = new Date(o.created_at || o.order_time);
      if (created >= todayStart) {
        todayOrders += 1;
        todayRevenue += Number(o.total) || 0;
      }
      if (st !== "Cancelled") revenue += Number(o.total) || 0;

      const key = created.toISOString().slice(0, 10);
      if (dailyMap[key]) {
        dailyMap[key].orders += 1;
        if (st !== "Cancelled") dailyMap[key].revenue += Number(o.total) || 0;
      }

      for (const it of o.items || []) {
        const k = it.code || it.name || "?";
        if (!productCounts[k]) productCounts[k] = { code: k, name: it.name || k, qty: 0 };
        productCounts[k].qty += Number(it.qty) || 1;
      }
    }

    const topProducts = Object.values(productCounts).sort((a, b) => b.qty - a.qty).slice(0, 8);
    const products = productsRes.data || [];

    res.json({
      summary: {
        totalOrders: orders.length + (await totalOlderOrders(since)),
        revenue,
        pending,
        delivered,
        cancelled,
        todayOrders,
        todayRevenue,
        productCount: products.length,
        outOfStock: products.filter((p) => p.out_of_stock).length
      },
      dailySeries: Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)),
      statusBreakdown: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      topProducts
    });

    async function totalOlderOrders(sinceDate) {
      const { count } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true })
        .lt("created_at", sinceDate.toISOString());
      return count || 0;
    }
  })
);

export default router;
