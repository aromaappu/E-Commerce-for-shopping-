// In-memory mock of @supabase/supabase-js for offline testing.
// Supports the subset of the builder API used by queries.ts and state.ts.

function daysAgo(n: number, hour = 10): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

const db: Record<string, any[]> = {
  orders: [
    { id: "o1", tracking_code: "TM-ABC123", customer_name: "Rahul Sharma", customer_phone: "8592808194", customer_address: "Kochi", items: [{ name: "School Bag", qty: 1 }], total: 999, status: "Order Placed", status_history: [{ status: "Order Placed", at: daysAgo(0, 9) }], order_time: daysAgo(0, 9), created_at: daysAgo(0, 9) },
    { id: "o2", tracking_code: "TM-XYZ789", customer_name: "Anjali Menon", customer_phone: "9847000000", customer_address: "Trivandrum", items: [{ name: "Sneakers", qty: 2 }], total: 2398, status: "Shipped", status_history: [{ status: "Order Placed", at: daysAgo(0, 8) }, { status: "Shipped", at: daysAgo(0, 12) }], order_time: daysAgo(0, 8), created_at: daysAgo(0, 8) },
    { id: "o3", tracking_code: "TM-DEL123", customer_name: "Suresh Kumar", customer_phone: "9123000000", customer_address: "Palakkad", items: [{ name: "Analog Watch", qty: 1 }], total: 1500, status: "Delivered", status_history: [{ status: "Delivered", at: daysAgo(2, 11) }], order_time: daysAgo(4, 9), created_at: daysAgo(4, 9) },
    { id: "o4", tracking_code: "TM-OLD456", customer_name: "Rahul Sharma", customer_phone: "8592808194", customer_address: "Kochi", items: [{ name: "Headphones", qty: 1 }], total: 799, status: "Delivered", status_history: [{ status: "Delivered", at: daysAgo(20, 12) }], order_time: daysAgo(25, 10), created_at: daysAgo(25, 10) }
  ],
  products: [
    { id: "p1", product_code: "SC1LIK", name: "School Bag 1", price: "₹999", mrp: "₹1499", description: "", image_url: "", category: "school", out_of_stock: false, sort_order: 0 },
    { id: "p2", product_code: "SH1RUN", name: "Running Shoes", price: "₹1199", mrp: "₹1599", description: "", image_url: "", category: "shoe", out_of_stock: true, sort_order: 1 },
    { id: "p3", product_code: "HD1MAX", name: "Max Headphones", price: "₹799", mrp: "₹999", description: "", image_url: "", category: "headphone", out_of_stock: false, sort_order: 2 }
  ],
  chat_sessions: []
};

function applyFilter(row: any, f: any): boolean {
  const v = row[f.col];
  switch (f.op) {
    case "eq": return v === f.val;
    case "gte": return new Date(v).getTime() >= new Date(f.val).getTime();
    case "lte": return new Date(v).getTime() <= new Date(f.val).getTime();
    case "ilike": return String(v).toLowerCase().includes(String(f.val).toLowerCase().replace(/%/g, ""));
    default: return true;
  }
}

class Builder {
  private table = "";
  private filters: any[] = [];
  private orderCol = "";
  private orderAsc = true;
  private single = false;
  private countMode = false;
  private pendingUpdate: any = null;

  from(table: string) {
    this.table = table;
    return this;
  }
  eq(col: string, val: unknown) { this.filters.push({ op: "eq", col, val }); return this; }
  gte(col: string, val: unknown) { this.filters.push({ op: "gte", col, val }); return this; }
  lte(col: string, val: unknown) { this.filters.push({ op: "lte", col, val }); return this; }
  ilike(col: string, val: unknown) { this.filters.push({ op: "ilike", col, val }); return this; }
  order(col: string, opts?: { ascending?: boolean }) { this.orderCol = col; this.orderAsc = opts?.ascending ?? true; return this; }
  maybeSingle() { this.single = true; return this; }
  select(_cols: string, opts?: { count?: "exact" }) {
    this.countMode = !!opts?.count;
    return this;
  }
  insert(row: any) {
    db[this.table].push(row);
    return Promise.resolve({ error: null });
  }
  update(row: any) {
    this.pendingUpdate = row;
    return this;
  }

  // Thenable: allows `await sb.from(t).select(...).eq(...)`.
  then(resolve: any, reject: any) {
    try {
      const result = this.run();
      return resolve(result);
    } catch (e) {
      return reject(e);
    }
  }

  private compute() {
    let rows = (db[this.table] || []).filter((r) => this.filters.every((f) => applyFilter(r, f)));
    if (this.orderCol) {
      rows = [...rows].sort((a, b) => {
        const av = a[this.orderCol], bv = b[this.orderCol];
        if (av < bv) return this.orderAsc ? -1 : 1;
        if (av > bv) return this.orderAsc ? 1 : -1;
        return 0;
      });
    }
    if (this.single) rows = rows.slice(0, 1);
    return rows;
  }

  private run() {
    if (this.pendingUpdate) {
      const rows = this.compute();
      rows.forEach((r) => Object.assign(r, this.pendingUpdate));
      return { error: null };
    }
    const rows = this.compute();
    if (this.countMode) return { count: rows.length, error: null };
    if (this.single) return { data: rows[0] ?? null, error: null };
    return { data: rows, error: null };
  }
}

export function createClient(_url: string, _key: string) {
  const from = (table: string) => new Builder().from(table);
  return { from };
}

export function _resetDb() {
  for (const k of Object.keys(db)) db[k] = [];
}
export function _getDb() {
  return db;
}
