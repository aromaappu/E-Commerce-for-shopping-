// ============================================================
// Trend Mart - DB query layer for the chat bot
// Runs against the same Supabase tables used by the site
// (orders, products). Replies are generated from the phrase model
// mined out of the DSTC8 corpus, so answers stay natural and
// varied instead of scripted.
// ============================================================

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { MODEL, pick } from "./nlu.ts";
import type { Slots } from "./nlu.ts";

export interface BotResult {
  text: string;
  data?: unknown;
}

function fmtINR(n: number): string {
  return "₹" + Number(n || 0).toLocaleString("en-IN");
}

function fmtWhen(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function parseItems(items: unknown): { name: string; qty: number }[] {
  let v = items;
  if (typeof v === "string") {
    try { v = JSON.parse(v); } catch { return []; }
  }
  if (!Array.isArray(v)) return [];
  return v.map((it: Record<string, unknown>) => ({
    name: String(it.name || it.code || "Item"),
    qty: Number(it.qty) || 1
  }));
}

function itemsSummary(items: unknown): string {
  return parseItems(items).map((it) => it.name + " x" + it.qty).join(", ");
}

function dayStart(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function rangeFrom(slot: string | undefined): { from?: Date; to?: Date } {
  const now = new Date();
  switch (slot) {
    case "today":
      return { from: dayStart(now) };
    case "yesterday": {
      const from = new Date(now);
      from.setDate(from.getDate() - 1);
      const to = dayStart(now);
      return { from: dayStart(from), to };
    }
    case "last24": {
      const from = new Date(now);
      from.setHours(now.getHours() - 24);
      return { from };
    }
    case "last7": {
      const from = new Date(now);
      from.setDate(now.getDate() - 7);
      return { from: dayStart(from) };
    }
    case "last30": {
      const from = new Date(now);
      from.setDate(now.getDate() - 30);
      return { from: dayStart(from) };
    }
    default:
      return {};
  }
}

function prettyRange(slot: string | undefined): string {
  switch (slot) {
    case "today": return "today";
    case "yesterday": return "yesterday";
    case "last24": return "in the last 24 hours";
    case "last7": return "in the last 7 days";
    case "last30": return "in the last 30 days";
    default: return "in total";
  }
}

function orderSummary(o: Record<string, unknown>): string {
  const code = o.tracking_code || "-";
  const name = o.customer_name || "";
  const phone = o.customer_phone || "";
  const status = o.status || "Order Placed";
  const total = fmtINR(Number(o.total) || 0);
  const when = fmtWhen(o.order_time as string);
  return `${code} · ${name}${phone ? " (" + phone + ")" : ""} · ${status} · ${total}${when ? " · " + when : ""}`;
}

// Fill {placeholders} in a picked template.
function render(key: string, vars: Record<string, string | number>): string {
  const list = MODEL.responses[key] || [];
  const tpl = list.length ? pick(list) : "";
  return tpl.replace(/\{(\w+)\}/g, (_, k: string) =>
    vars[k] !== undefined ? String(vars[k]) : `{${k}}`
  );
}

export async function handleIntent(
  intent: string,
  slots: Slots,
  sb: SupabaseClient
): Promise<BotResult> {
  try {
    switch (intent) {
      case "GetOrderCount": {
        const { from } = rangeFrom(slots.date_range);
        let q = sb.from("orders").select("id", { count: "exact" });
        if (from) q = q.gte("created_at", from.toISOString());
        const { count, error } = await q;
        if (error) throw new Error(error.message);
        const n = count || 0;
        const range = slots.date_range ? prettyRange(slots.date_range) : "in total";
        const key = n === 0 ? "countZero" : n === 1 ? "countOne" : "count";
        return { text: render(key, { n, range }) };
      }

      case "GetCustomers": {
        const { data, error } = await sb.from("orders").select(
          "customer_name, customer_phone, customer_address, tracking_code, total, created_at, status"
        );
        if (error) throw new Error(error.message);
        const seen = new Map<string, {
          name: string; phone: string; address: string; orders: { code: string; total: number; date: Date; status: string }[];
        }>();
        for (const o of data || []) {
          const name = String(o.customer_name || "").trim();
          const phone = String(o.customer_phone || "").trim();
          if (!name && !phone) continue;
          const key = name || phone;
          if (!seen.has(key)) {
            seen.set(key, { name, phone, address: String(o.customer_address || "").trim(), orders: [] });
          }
          const c = seen.get(key)!;
          c.orders.push({
            code: String(o.tracking_code || "").trim(),
            total: Number(o.total) || 0,
            date: o.created_at ? new Date(o.created_at) : new Date(0),
            status: String(o.status || "").trim()
          });
        }
        const customers = [...seen.values()];
        if (!customers.length) return { text: "No customers found yet." };
        if (slots.detail_level === "full") {
          const intro = `Full customer details (${customers.length} customer(s)):`;
          const lines = customers.slice(0, 15).map((c) => {
            const orders = c.orders.sort((a, b) => b.date.getTime() - a.date.getTime());
            const spent = orders.reduce((s, o) => s + o.total, 0);
            const parts = [`• ${c.name || c.phone}`];
            if (c.phone) parts.push(`  Phone: ${c.phone}`);
            if (c.address) parts.push(`  Address: ${c.address}`);
            parts.push(`  Orders: ${orders.length} · Spent: ₹${spent.toLocaleString("en-IN")}`);
            const latest = orders[0];
            if (latest) {
              parts.push(`  Latest: ${latest.code} · ${latest.status} · ${latest.date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`);
            }
            return parts.join("\n");
          });
          const more = customers.length > 15 ? `\n... and ${customers.length - 15} more (ask me for a list).` : "";
          return { text: `${intro}\n${lines.join("\n")}${more}`, data: customers };
        }
        const intro = `You have ${customers.length} customer(s):`;
        const lines = customers.slice(0, 30).map((c) =>
          c.name ? `${c.name}${c.phone ? " (" + c.phone + ")" : ""}` : c.phone
        );
        const more = customers.length > 30 ? `\n... and ${customers.length - 30} more.` : "";
        return { text: `${intro}\n${lines.join("\n")}${more}`, data: customers };
      }

      case "GetPurchaseSummary": {
        const { data, error } = await sb.from("orders").select(
          "customer_name, customer_phone, items, total"
        );
        if (error) throw new Error(error.message);
        const seen = new Map<string, { name: string; phone: string; orders: number; items: number; spent: number }>();
        for (const o of data || []) {
          const name = String(o.customer_name || "").trim();
          const phone = String(o.customer_phone || "").trim();
          if (!name && !phone) continue;
          const key = name || phone;
          if (!seen.has(key)) seen.set(key, { name, phone, orders: 0, items: 0, spent: 0 });
          const c = seen.get(key)!;
          c.orders += 1;
          const items = Array.isArray(o.items) ? o.items : [];
          c.items += items.reduce((s: number, it: { qty?: number }) => s + (Number(it?.qty) || 1), 0);
          c.spent += Number(o.total) || 0;
        }
        const rows = [...seen.values()];
        if (!rows.length) return { text: "No purchases found yet." };
        const intro = `Purchase summary (${rows.length} customer(s)):`;
        const lines = rows.slice(0, 15).map((c) =>
          `${c.name || c.phone}: ${c.items} product(s) across ${c.orders} order(s) — ${fmtINR(c.spent)}`
        );
        return { text: `${intro}\n${lines.join("\n")}`, data: rows };
      }

      case "GetTodayOrders": {
        const { from } = rangeFrom("today");
        const { data, error } = await sb.from("orders")
          .select("*")
          .gte("created_at", from!.toISOString())
          .order("created_at", { ascending: false });
        if (error) throw new Error(error.message);
        const list = data || [];
        if (!list.length) {
          return { text: render("todayEmpty", {}) };
        }
        const total = list.reduce((s, o) => s + (Number(o.total) || 0), 0);
        const intro = pick(
          `Here are today's orders (${list.length}):`,
          `You got ${list.length} order(s) today:`,
          `Today's orders:`,
          `Here's what came in today:`
        );
        const lines = list.slice(0, 10).map(orderSummary);
        const more = list.length > 10 ? render("more", { n: list.length - 10 }) : "";
        const totalLine = render("todayTotal", { total: fmtINR(total) });
        return { text: `${intro}\n${lines.join("\n")}${more}\n${totalLine}`, data: list };
      }

      case "GetOrderByCode": {
        const code = slots.tracking_code!;
        const { data, error } = await sb.from("orders").select("*").eq("tracking_code", code).maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) {
          return { text: render("orderNotFound", { code }) };
        }
        const items = itemsSummary(data.items);
        const status = data.status;
        const lines = [
          render("orderStatus", { status }),
          `Tracking: ${data.tracking_code}`,
          `Customer: ${data.customer_name || "-"} (${data.customer_phone || "-"})`,
          `Items: ${items || "-"} · Total: ${fmtINR(Number(data.total) || 0)} · Placed: ${fmtWhen(data.order_time)}`
        ];
        return { text: lines.join("\n"), data };
      }

      case "GetOrdersByStatus": {
        const status = slots.status ? slots.status.trim() : "";
        let q = sb.from("orders").select("*").order("created_at", { ascending: false });
        if (status) q = q.eq("status", status);
        const { from } = rangeFrom(slots.date_range);
        if (from) q = q.gte("created_at", from.toISOString());
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        const list = data || [];
        if (!list.length) {
          const base = render("byStatusEmpty", { status: status || "any" });
          return { text: slots.date_range ? `${base} (${prettyRange(slots.date_range)})` : base };
        }
        const intro = status
          ? render("byStatusIntro", { n: list.length, status })
          : `Here are all ${list.length} order(s) with customer details:`;
        const lines = list.slice(0, 20).map(orderSummary);
        const more = list.length > 20 ? render("more", { n: list.length - 20 }) : "";
        return { text: `${intro}\n${lines.join("\n")}${more}`, data: list };
      }

      case "GetOrdersByCustomer": {
        let q = sb.from("orders").select("*").order("created_at", { ascending: false });
        if (slots.customer_phone) q = q.eq("customer_phone", slots.customer_phone);
        else if (slots.customer_name) q = q.ilike("customer_name", `%${slots.customer_name}%`);
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        const list = data || [];
        if (!list.length) {
          const who = slots.customer_phone ? `phone ${slots.customer_phone}` : `name "${slots.customer_name}"`;
          return { text: render("customerEmpty", { who }) + "\n\nTry giving the phone number instead — it's more reliable." };
        }
        const intro = render("customerIntro", { n: list.length });
        const lines = list.slice(0, 15).map(orderSummary);
        const more = list.length > 15 ? render("more", { n: list.length - 15 }) : "";
        return { text: `${intro}\n${lines.join("\n")}${more}`, data: list };
      }

      case "GetSalesTotal": {
        const { from } = rangeFrom(slots.date_range);
        let q = sb.from("orders").select("total");
        if (from) q = q.gte("created_at", from.toISOString());
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        const orders = data || [];
        const total = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
        const range = slots.date_range ? prettyRange(slots.date_range) : "in total";
        return { text: render("sales", { total: fmtINR(total), n: orders.length, range }) };
      }

      case "UpdateOrderStatus": {
        const code = slots.tracking_code!;
        const status = slots.status!;
        const { data: existing, error: findErr } = await sb.from("orders").select("*").eq("tracking_code", code).maybeSingle();
        if (findErr) throw new Error(findErr.message);
        if (!existing) return { text: render("updateNotFound", { code }) };
        if (existing.status === status) {
          return { text: render("updateSame", { code, status }) };
        }
        const history = Array.isArray(existing.status_history) ? existing.status_history : [];
        const already = history.find((h: Record<string, string>) => h.status === status);
        if (!already) history.push({ status, at: new Date().toISOString() });
        const { error } = await sb.from("orders").update({ status, status_history: history }).eq("id", existing.id);
        if (error) throw new Error(error.message);
        return { text: render("updateDone", { code, status }) };
      }

      case "GetProductCount": {
        let q = sb.from("products").select("id", { count: "exact" });
        if (slots.category) q = q.eq("category", slots.category);
        const { count, error } = await q;
        if (error) throw new Error(error.message);
        const cat = slots.category ? ` in "${slots.category}"` : "";
        return { text: render("productCount", { n: count || 0 }) + cat };
      }

      case "GetProductsByCategory": {
        const cat = slots.category!;
        const { data, error } = await sb.from("products").select("*").eq("category", cat).order("sort_order", { ascending: true });
        if (error) throw new Error(error.message);
        const list = data || [];
        if (!list.length) return { text: render("productEmpty", { cat }) };
        const intro = render("productIntro", { n: list.length, cat });
        const lines = list.slice(0, 15).map((p) =>
          `${p.product_code} · ${p.name} · ${p.price}${p.out_of_stock ? " · OUT OF STOCK" : ""}`
        );
        const more = list.length > 15 ? render("more", { n: list.length - 15 }) : "";
        return { text: `${intro}\n${lines.join("\n")}${more}`, data: list };
      }

      case "GetProductByCode": {
        const code = slots.product_code!;
        const { data, error } = await sb.from("products").select("*").eq("product_code", code).maybeSingle();
        if (error) throw new Error(error.message);
        if (!data) return { text: render("productCodeEmpty", { code }) };
        return {
          text: `${data.name}\nCode: ${data.product_code}\nCategory: ${data.category}\nPrice: ${data.price}${data.mrp ? "\nMRP: " + data.mrp : ""}\nStatus: ${data.out_of_stock ? "OUT OF STOCK" : "In stock"}`
        };
      }

      case "GetAllProducts": {
        const { data, error } = await sb.from("products")
          .select("product_code, name, price, out_of_stock, category")
          .order("sort_order", { ascending: true });
        if (error) throw new Error(error.message);
        const list = data || [];
        if (!list.length) return { text: "No products in the catalogue yet." };
        const lines = list.slice(0, 15).map((p) =>
          `${p.product_code} · ${p.name}${p.out_of_stock ? " · OUT OF STOCK" : ""}`
        );
        const more = list.length > 15 ? render("more", { n: list.length - 15 }) : "";
        return { text: `Here are the products (${list.length}):\n${lines.join("\n")}${more}`, data: list };
      }

      case "GetSoldProducts": {
        const { data, error } = await sb.from("orders").select("items");
        if (error) throw new Error(error.message);
        const counts = new Map<string, number>();
        for (const o of data || []) {
          for (const it of parseItems(o.items)) {
            const n = String(it.name || "Item").trim();
            if (!n || n === "Item") continue;
            counts.set(n, (counts.get(n) || 0) + it.qty);
          }
        }
        if (!counts.size) return { text: "No products have been sold yet." };
        const entries = [...counts.entries()].sort((a, b) => b[1] - a[1]);
        const lines = entries.slice(0, 30).map(([name, qty]) => `${name} ×${qty}`);
        const more = entries.length > 30 ? render("more", { n: entries.length - 30 }) : "";
        return { text: `Products sold so far (${entries.length} product(s)):\n${lines.join("\n")}${more}`, data: entries };
      }

      case "GetTodayProducts": {
        const from = dayStart(new Date());
        let q = sb.from("products")
          .select("*")
          .gte("created_at", from.toISOString())
          .order("created_at", { ascending: false });
        const { data, error } = await q;
        if (error) throw new Error(error.message);
        const list = data || [];
        if (!list.length) {
          const latest = await sb.from("products")
            .select("*")
            .order("sort_order", { ascending: true })
            .order("created_at", { ascending: false });
          const recent = (latest.data || []).slice(0, 5);
          if (!recent.length) return { text: "No products have been added yet." };
          const lines = recent.map((p) => `${p.product_code} · ${p.name} · ${p.price}${p.out_of_stock ? " · OUT OF STOCK" : ""}`);
          return {
            text: `No new products came in today. Here are the latest ones:\n${lines.join("\n")}`
          };
        }
        const intro = `Here ${list.length === 1 ? "is" : "are"} the product(s) that came in today (${list.length}):`;
        const lines = list.slice(0, 15).map((p) =>
          `${p.product_code} · ${p.name} · ${p.price}${p.out_of_stock ? " · OUT OF STOCK" : ""}`
        );
        const more = list.length > 15 ? render("more", { n: list.length - 15 }) : "";
        return { text: `${intro}\n${lines.join("\n")}${more}`, data: list };
      }

      case "GetOutOfStock": {
        const { data, error } = await sb.from("products").select("*").eq("out_of_stock", true).order("sort_order", { ascending: true });
        if (error) throw new Error(error.message);
        const list = data || [];
        if (!list.length) return { text: render("oosEmpty", {}) };
        const intro = render("oosIntro", { n: list.length });
        const lines = list.slice(0, 15).map((p) => `${p.product_code} · ${p.name} · ${p.category}`);
        const more = list.length > 15 ? render("more", { n: list.length - 15 }) : "";
        return { text: `${intro}\n${lines.join("\n")}${more}`, data: list };
      }

      default:
        return { text: "Sorry, I didn't quite catch that." };
    }
  } catch (e) {
    return {
      text: "Sorry, something went wrong while looking that up. " + (e instanceof Error ? e.message : String(e))
    };
  }
}

// ---- AI tool-calling backend ----------------------------------
// The AI model calls lookup_store_data() for ANY store-data question.
// This function runs a real DB query and returns compact facts so the
// AI can never invent data — it can only summarise what is returned.

export interface StoreLookupArgs {
  area: "customers" | "orders" | "products" | "sales";
  customer_name?: string;
  customer_phone?: string;
  tracking_code?: string;
  status?: string;
  category?: string;
  product_code?: string;
  date_range?: string;
  full?: boolean | string;
  out_of_stock_only?: boolean | string;
  sort_by_price?: string;
}

function toBool(v: unknown): boolean {
  return v === true || v === "true" || v === "yes" || v === "1";
}

export async function handleStoreLookup(args: StoreLookupArgs, sb: SupabaseClient): Promise<BotResult> {
  try {
    const area = args.area;
    if (area === "customers") {
      const { data, error } = await sb.from("orders").select(
        "customer_name, customer_phone, customer_address, tracking_code, total, created_at, status"
      );
      if (error) throw new Error(error.message);
      const seen = new Map<string, { name: string; phone: string; address: string; orders: { code: string; total: number; date: string; status: string }[] }>();
      for (const o of data || []) {
        const name = String(o.customer_name || "").trim();
        const phone = String(o.customer_phone || "").trim();
        if (!name && !phone) continue;
        const key = name || phone;
        if (!seen.has(key)) seen.set(key, { name, phone, address: String(o.customer_address || "").trim(), orders: [] });
        const c = seen.get(key)!;
        c.orders.push({
          code: String(o.tracking_code || ""),
          total: Number(o.total) || 0,
          date: o.created_at ? new Date(o.created_at).toISOString() : "",
          status: String(o.status || "")
        });
      }
      const rows = [...seen.values()];
      if (!rows.length) return { text: "No customers found yet." };
      const lines = rows.slice(0, 20).map((c) => {
        const spent = c.orders.reduce((s, o) => s + o.total, 0);
        const latest = c.orders.sort((a, b) => b.date.localeCompare(a.date))[0];
        let line = `${c.name || "Unknown"}${c.phone ? " · " + c.phone : ""}`;
        if (toBool(args.full) && c.address) line += ` · addr: ${c.address}`;
        line += ` · ${c.orders.length} order(s) · ₹${spent}`;
        if (latest) line += ` · latest ${latest.code} (${latest.status}, ${latest.date.slice(0, 10)})`;
        return line;
      });
      return { text: `${rows.length} customer(s):\n${lines.join("\n")}`, data: rows };
    }

    if (area === "orders") {
      let q = sb.from("orders").select("*");
      if (args.tracking_code) q = q.eq("tracking_code", args.tracking_code.toUpperCase());
      if (args.status) q = q.eq("status", args.status);
      if (args.customer_phone) q = q.eq("customer_phone", args.customer_phone);
      if (args.customer_name) q = q.ilike("customer_name", `%${args.customer_name}%`);
      const { from } = rangeFrom(args.date_range);
      if (from) q = q.gte("created_at", from.toISOString());
      q = q.order("created_at", { ascending: false }).limit(25);
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      const list = data || [];
      if (!list.length) return { text: "No orders found for those criteria." };
      const lines = list.slice(0, 20).map(orderSummary);
      return { text: `${list.length} order(s):\n${lines.join("\n")}`, data: list };
    }

    if (area === "products") {
      const num = (p: Record<string, unknown>): number => Number(String(p.price || "").replace(/[^\d]/g, "")) || 0;
      const line = (p: Record<string, unknown>): string =>
        `${p.product_code} · ${p.name} · ${p.price}${p.out_of_stock ? " · OUT OF STOCK" : ""}`;
      let q = sb.from("products").select("*");
      if (args.product_code) q = q.eq("product_code", args.product_code.toUpperCase());
      if (args.category) q = q.eq("category", args.category);
      if (toBool(args.out_of_stock_only)) q = q.eq("out_of_stock", true);
      const sp = String(args.sort_by_price || "").toLowerCase();
      const wantPriceSort = ["asc", "true", "low", "cheap", "desc", "high", "expens", "most", "min", "max"].some((p) => sp.startsWith(p));
      let list: Record<string, unknown>[];
      if (wantPriceSort) {
        const { data, error } = await q.limit(500);
        if (error) throw new Error(error.message);
        const sorted = (data || []).sort((a, b) => num(a) - num(b));
        const desc = sp.startsWith("desc") || sp.startsWith("high") || sp.startsWith("expens") || sp.startsWith("max");
        list = desc ? sorted.slice(-10).reverse() : sorted.slice(0, 10);
      } else {
        const { data, error } = await q.order("sort_order", { ascending: true }).limit(40);
        if (error) throw new Error(error.message);
        list = data || [];
      }
      if (!list.length) return { text: "No products found." };
      if (args.product_code && list.length === 1) {
        const p = list[0];
        return { text: `${p.name} · code ${p.product_code} · category ${p.category} · price ${p.price}${p.mrp ? " · MRP " + p.mrp : ""} · ${p.out_of_stock ? "OUT OF STOCK" : "in stock"}`, data: p };
      }
      const prefix = wantPriceSort
        ? (sp.startsWith("desc") || sp.startsWith("high") || sp.startsWith("expens") || sp.startsWith("max") ? "Most expensive" : "Cheapest")
        : `${list.length} product(s)`;
      return { text: `${prefix}:\n${list.map(line).join("\n")}`, data: list };
    }

    if (area === "sales") {
      let q = sb.from("orders").select("total");
      const { from } = rangeFrom(args.date_range);
      if (from) q = q.gte("created_at", from.toISOString());
      const { data, error } = await q;
      if (error) throw new Error(error.message);
      const list = data || [];
      const total = list.reduce((s, o) => s + (Number(o.total) || 0), 0);
      const n = list.length;
      return { text: `Sales: ₹${total.toLocaleString("en-IN")} across ${n} order(s)${args.date_range ? " (" + prettyRange(args.date_range) + ")" : ""}.`, data: { total, count: n } };
    }

    return { text: "Unknown lookup area." };
  } catch (e) {
    return {
      text: "DB error: " + (e instanceof Error ? e.message : String(e))
    };
  }
}
