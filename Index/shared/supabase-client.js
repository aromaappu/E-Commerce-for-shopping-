(function () {
    const cfg = window.TM_CONFIG || {};

    let supabaseClient = null;

    function init() {
        if (!cfg.ENABLE_DB || !cfg.SUPABASE_URL || !cfg.SUPABASE_ANON_KEY) return null;
        if (cfg.SUPABASE_URL.indexOf("YOUR_") === 0) return null;
        if (!window.supabase) return null;
        try {
            supabaseClient = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
        } catch (e) {
            console.warn("[supabase-client] init failed", e);
            supabaseClient = null;
        }
        return supabaseClient;
    }

    function db() {
        if (supabaseClient) return supabaseClient;
        return init();
    }

    function isConfigured() {
        return !!db();
    }

    function generateTrackingCode() {
        const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
        let s = "";
        for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
        return cfg.TRACKING_PREFIX + "-" + s;
    }

    async function placeOrder(order) {
        if (!isConfigured()) return { ok: false, code: null, error: "DB_NOT_CONFIGURED" };
        const payload = {
            customer_name: order.customer_name || "",
            customer_phone: order.customer_phone || "",
            customer_address: order.customer_address || "",
            items: order.items || [],
            total: order.total || 0,
            status: "Order Placed",
            status_history: [{ status: "Order Placed", at: new Date().toISOString() }],
            order_time: order.order_time || new Date().toISOString(),
            whatsapp_redirect_time: order.whatsapp_redirect_time || new Date().toISOString()
        };
        let lastErr = null;
        for (let attempt = 0; attempt < 5; attempt++) {
            const code = generateTrackingCode();
            payload.tracking_code = code;
            try {
                const { data, error } = await db().from("orders").insert(payload).select().single();
                if (!error) return { ok: true, code, data };
                lastErr = error;
                if (error.code === "23505") continue;
                return { ok: false, code: null, error };
            } catch (e) {
                lastErr = e;
                return { ok: false, code: null, error: e };
            }
        }
        return { ok: false, code: null, error: lastErr };
    }

    async function getOrderByCode(code) {
        if (!isConfigured()) return { ok: false, data: null, error: "DB_NOT_CONFIGURED" };
        try {
            const { data, error } = await db().rpc("get_order_by_code", { code });
            if (error) {
                const fallback = await db().from("orders").select().eq("tracking_code", code).maybeSingle();
                if (fallback.error) return { ok: false, data: null, error: fallback.error };
                return { ok: true, data: fallback.data };
            }
            return { ok: true, data: data || null };
        } catch (e) {
            return { ok: false, data: null, error: e };
        }
    }

    async function fetchProductOverrides() {
        if (!isConfigured()) return [];
        try {
            const { data, error } = await db().from("products").select("*");
            if (error) return [];
            return data || [];
        } catch (e) {
            return [];
        }
    }

    async function fetchAllProducts() {
        if (!isConfigured()) return [];
        try {
            const { data, error } = await db()
                .from("products")
                .select("*")
                .order("sort_order", { ascending: true });
            if (error) return [];
            return data || [];
        } catch (e) {
            return [];
        }
    }

    async function fetchProductsByCategory(category) {
        if (!isConfigured()) return [];
        try {
            const { data, error } = await db()
                .from("products")
                .select("*")
                .eq("category", category)
                .order("sort_order", { ascending: true });
            if (error) return [];
            return data || [];
        } catch (e) {
            return [];
        }
    }

    function dbProductToSite(p) {
        return {
            id: p.id,
            name: p.name,
            price: p.price,
            mrp: p.mrp || '',
            img: p.image_url,
            code: p.product_code,
            desc: p.description,
            description: p.description,
            categoryId: p.category,
            out_of_stock: !!p.out_of_stock,
            offer_percent: Number(p.offer_percent) || 0
        };
    }

    async function fetchBanners() {
        if (!isConfigured()) return [];
        try {
            const { data, error } = await db().from("banners").select("*").order("sort_order", { ascending: true });
            if (error) return [];
            return data || [];
        } catch (e) {
            return [];
        }
    }

    async function fetchOffers() {
        if (!isConfigured()) return [];
        try {
            const { data, error } = await db().from("offers").select("*").order("created_at", { ascending: false });
            if (error) return [];
            return data || [];
        } catch (e) {
            return [];
        }
    }

    async function fetchPopups() {
        if (!isConfigured()) return [];
        try {
            const { data, error } = await db().from("popups").select("*").order("created_at", { ascending: false });
            if (error) return [];
            return data || [];
        } catch (e) {
            return [];
        }
    }

    async function cleanupExpiredPopups() {
        if (!isConfigured()) return;
        try {
            await db().from("popups").delete().lt("end_date", new Date().toISOString());
        } catch (e) {}
    }

    window.TMSupabase = {
        init,
        isConfigured,
        placeOrder,
        getOrderByCode,
        generateTrackingCode,
        fetchProductOverrides,
        fetchAllProducts,
        fetchProductsByCategory,
        dbProductToSite,
        fetchBanners,
        fetchOffers,
        fetchPopups,
        cleanupExpiredPopups
    };
})();
