// ============================================================
// Trend Mart - NLU engine (self-built, no external LLM)
//
// Schema-guided dialogue tracking modelled on the DSTC8 SGD
// dataset, using nlp-model.json mined from the DSTC8 corpus for
// natural, varied phrasing (intents + slots + slot-by-slot
// clarification + confirmation for transactional intents).
// Responses are generated, not scripted Q&A.
// ============================================================

// Load the phrase model mined from DSTC8 (bundled inline by esbuild
// on deploy, so no runtime file-read is needed).
import modelData from "./nlp-model.json" with { type: "json" };
export interface PhraseModel {
  meta: { generated: string; source: string };
  requestLeadIns: string[];
  greetings: string[];
  thanks: string[];
  acknowledgments: string[];
  closers: string[];
  slots: Record<string, string[]>;
  responses: Record<string, string[]>;
}
export const MODEL: PhraseModel = modelData as PhraseModel;

export function pick(a: string | string[], ...rest: string[]): string {
  const arr = Array.isArray(a) ? a : [a, ...rest];
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickFrom(list: string[] | undefined, fallback: string): string {
  if (!list || !list.length) return fallback;
  return list[Math.floor(Math.random() * list.length)];
}

export type IntentName =
  | "GetOrderCount"
  | "GetOrderByCode"
  | "GetOrdersByStatus"
  | "GetOrdersByCustomer"
  | "GetCustomers"
  | "GetTodayOrders"
  | "GetSalesTotal"
  | "UpdateOrderStatus"
  | "GetProductCount"
  | "GetProductsByCategory"
  | "GetProductByCode"
  | "GetAllProducts"
  | "GetSoldProducts"
  | "GetTodayProducts"
  | "GetOutOfStock"
  | "GetPurchaseSummary"
  | "Fallback";

export type SlotName =
  | "tracking_code"
  | "status"
  | "customer_name"
  | "customer_phone"
  | "date_range"
  | "category"
  | "product_code";

export interface Slots {
  tracking_code?: string;
  status?: string;
  customer_name?: string;
  customer_phone?: string;
  date_range?: string;
  category?: string;
  product_code?: string;
  // "full" requests complete customer details (address + order summary).
  detail_level?: "full";
}

export interface IntentMeta {
  label: string;
  required: SlotName[][];
  optional: SlotName[];
  transactional: boolean;
}

export const SPEC: Record<IntentName, IntentMeta> = {
  GetOrderCount: {
    label: "count orders",
    required: [],
    optional: ["date_range"],
    transactional: false
  },
  GetOrderByCode: {
    label: "find an order by tracking code",
    required: [["tracking_code"]],
    optional: [],
    transactional: false
  },
  GetOrdersByStatus: {
    label: "list orders by status",
    required: [],
    optional: ["status", "date_range"],
    transactional: false
  },
  GetOrdersByCustomer: {
    label: "find orders for a customer",
    required: [["customer_phone"], ["customer_name"]],
    optional: [],
    transactional: false
  },
  GetCustomers: {
    label: "list all customers",
    required: [],
    optional: [],
    transactional: false
  },
  GetTodayOrders: {
    label: "list today's orders",
    required: [],
    optional: [],
    transactional: false
  },
  GetSalesTotal: {
    label: "check sales total",
    required: [],
    optional: ["date_range"],
    transactional: false
  },
  UpdateOrderStatus: {
    label: "update an order status",
    required: [["tracking_code", "status"]],
    optional: [],
    transactional: true
  },
  GetProductCount: {
    label: "count products",
    required: [],
    optional: ["category"],
    transactional: false
  },
  GetProductsByCategory: {
    label: "list products by category",
    required: [["category"]],
    optional: [],
    transactional: false
  },
  GetProductByCode: {
    label: "find a product by code",
    required: [["product_code"]],
    optional: [],
    transactional: false
  },
  GetAllProducts: {
    label: "list all products",
    required: [],
    optional: [],
    transactional: false
  },
  GetSoldProducts: {
    label: "list products that have been sold",
    required: [],
    optional: [],
    transactional: false
  },
  GetTodayProducts: {
    label: "list today's products",
    required: [],
    optional: [],
    transactional: false
  },
  GetOutOfStock: {
    label: "list out-of-stock products",
    required: [],
    optional: [],
    transactional: false
  },
  GetPurchaseSummary: {
    label: "per-customer purchase summary",
    required: [],
    optional: [],
    transactional: false
  },
  Fallback: {
    label: "help",
    required: [],
    optional: [],
    transactional: false
  }
};

const STATUS_LIST = ["Order Placed", "Confirmed", "Packed", "Shipped", "Delivered"];

const CATEGORY_ALIASES: Record<string, string> = {
  school: "school", "school bag": "school", "school bags": "school", "schoolbag": "school",
  side: "side", "side bag": "side", "side bags": "side",
  travel: "travel", "travel bag": "travel", "travel bags": "travel", "luggage": "travel",
  chappal: "chappal", "chappals": "chappal", "sandal": "chappal", "sandals": "chappal", "slipper": "chappal", "slippers": "chappal",
  crocs: "crocs", "croc": "crocs",
  combo: "combo", "combos": "combo",
  tcombo: "tcombo", "tshirt combo": "tcombo", "t-shirt combo": "tcombo",
  pant: "pant", "pants": "pant",
  shirt: "shirt", "shirts": "shirt",
  tshirt: "tshirt", "t-shirt": "tshirt", "t shirts": "tshirt", "t-shirts": "tshirt", "tee": "tshirt",
  airpod: "airpod", "airpods": "airpod", "air pod": "airpod",
  headphone: "headphone", "headphones": "headphone", "earphone": "headphone", "earphones": "headphone", "ear bud": "headphone", "earbuds": "headphone",
  shoe: "shoe", "shoes": "shoe", "footwear": "shoe",
  analog: "analog", "analogue": "analog", "analog watch": "analog", "analog watches": "analog",
  smart: "smart", "smart watch": "smart", "smartwatch": "smart", "smart watches": "smart", "watch": "smart", "watches": "smart",
  smc: "smc", "smc watch": "smc", "smc watches": "smc"
};

export interface YesNo {
  isYes: boolean;
  isNo: boolean;
  text: string;
}

export function norm(s: string): string {
  return s.toLowerCase().replace(/[^\w\s'-]/g, " ").replace(/\s+/g, " ").trim();
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

// ---- Typo-tolerant matching -----------------------------------
// Users type "cusotmer", "detials", "adress" etc. Use edit-distance
// so misspelled data words still hit the database and never the AI.

export function editDistance(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (!m) return n;
  if (!n) return m;
  const dp: number[] = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[n];
}

// True if any word of `t` is within `maxDist` edits of a target word.
export function fuzzyHas(t: string, targets: string[], maxDist = 2): boolean {
  const words = t.split(/[^a-z]+/).filter((w) => w.length >= 4);
  for (const w of words) {
    for (const tg of targets) {
      if (Math.abs(w.length - tg.length) > maxDist) continue;
      if (editDistance(w, tg) <= maxDist) return true;
    }
  }
  return false;
}

// ---- Small talk ----------------------------------------------

export function isGreeting(message: string): boolean {
  return /^(hi|hello|hey|hii+|helo|namaste|good (morning|afternoon|evening|day)|yo|howdy)\b[\s!?.,]*$/i.test(message.trim())
    || /^(hi|hello|hey|namaste)\b[\s!?.,]*(there|everyone|trend mart)?[\s!?.,]*$/i.test(message.trim());
}

export function isThanks(message: string): boolean {
  return /^(thanks|thank you|thx|ty|appreciated|thankyou|tq)\b[\s!?.,]*$/i.test(message.trim())
    || /^(thanks|thank you|thx)\b[\s!?.,]*(a lot|so much|very much|for (your )?help|for everything|for that)[\s!?.,]*$/i.test(message.trim());
}

export function isAcknowledgment(message: string): boolean {
  return /^(ok|okay|k|sure|alright|right|fine|got it|understood|sounds good|that works|perfect|great|nice|good|done|received|noted|yeah ok|hmm ok)[\s!?.,]*$/i.test(message.trim())
    || /^that('s| is) (fine|ok|good|perfect|works|all|everything)[\s!?.,]*$/i.test(message.trim())
    || /^(ok|okay|k|sure)[\s,]+(sounds good|got it|fine|great|nice|perfect|thanks|thank you)[\s!?.,]*$/i.test(message.trim());
}

export function isHelp(message: string): boolean {
  return /^(help|what can you do|how do you work|what do you know|what can i ask|options|commands|what are you|who are you|about you)[\s!?.,]*$/i.test(message.trim())
    || /^what('s| is) (your name|up|new|the plan)[\s!?.,]*$/i.test(message.trim());
}

export function parseYesNo(message: string): YesNo {
  const t = norm(message);
  const no = /(^|\s)(no|nope|not that|not correct|wrong|cancel|never mind|that's wrong|that is wrong|don't|dont|skip|stop)(\s|$|\.|!|,)/.test(t)
    || /^(no|nope)[\s!.,]*$/.test(t);
  const yes = /(^|\s)(yes|yeah|yep|correct|right|that's right|thats right|that is right|that's correct|thats correct|that is correct|ok|okay|sure|go ahead|confirm|please do|fine|sounds good|confirmed|do it)(\s|$|\.|!|,)/.test(t)
    || /^(yes|yeah|yep|ok|okay|sure|correct|right|do it)[\s!.,]*$/.test(t);
  return { isYes: yes && !no, isNo: no, text: t };
}

// ---- Slot extractors -----------------------------------------

export function extractTrackingCode(text: string): string | undefined {
  const m = text.toUpperCase().match(/\b(?:TM|TRENDMART)[-\s]?([A-Z0-9]{6})\b/);
  if (m) return `TM-${m[1]}`;
  const m2 = text.toUpperCase().match(/\b([A-Z]{2})-([A-Z0-9]{6})\b/);
  return m2 ? `${m2[1]}-${m2[2]}` : undefined;
}

export function extractStatus(text: string): string | undefined {
  const t = norm(text);
  if (hasAny(t, ["delivered", "delivery complete", "out for delivery", "handed over"])) return "Delivered";
  if (hasAny(t, ["shipped", "shipping", "dispatched"])) return "Shipped";
  if (hasAny(t, ["packed", "packaging"])) return "Packed";
  if (hasAny(t, ["confirmed", "confirmation", "confirmed by"])) return "Confirmed";
  if (hasAny(t, ["order placed", "orders placed", "placed order", "new order", "new orders", "pending", "active"])) return "Order Placed";
  return undefined;
}

export function extractDateRange(text: string): string | undefined {
  const t = norm(text);
  if (hasAny(t, ["today", "tonight", "just now", "today's", "till now", "so far today", "todays"])) return "today";
  if (hasAny(t, ["yesterday", "last night"])) return "yesterday";
  if (hasAny(t, ["last 7 days", "last seven days", "past 7 days", "past seven days", "this week", "last week", "past week", "weekly"])) return "last7";
  if (hasAny(t, ["last 30 days", "past 30 days", "last month", "this month", "monthly"])) return "last30";
  if (hasAny(t, ["last 24 hours", "past 24 hours", "in 24 hours"])) return "last24";
  if (hasAny(t, ["all time", "total", "all", "ever", "in total", "overall"])) return undefined;
  return undefined;
}

export function extractPhone(text: string): string | undefined {
  const m = text.replace(/[^\d]/g, "").match(/(?:\+?91)?[6-9]\d{9}/);
  return m ? m[0].slice(-10) : undefined;
}

export function extractCategory(text: string): string | undefined {
  const t = norm(text);
  for (const [alias, cat] of Object.entries(CATEGORY_ALIASES)) {
    if (t.includes(alias)) return cat;
  }
  return undefined;
}

export function extractProductCode(text: string): string | undefined {
  const m = text.toUpperCase().match(/\b([A-Z]{2,5}\d[A-Z0-9]*)\b/);
  if (!m) return undefined;
  const v = m[1];
  if (/^\d+$/.test(v)) return undefined;
  // Skip if this code is actually the suffix of a TM- tracking code.
  const before = text.toUpperCase().slice(0, m.index).trim();
  if (/\b(?:TM|TRENDMART)\s*[-–—]?\s*$/.test(before)) return undefined;
  return v;
}

const NAME_SKIP = new Set([
  "today", "yesterday", "this", "last", "week", "month", "the", "delivered",
  "shipped", "packed", "pending", "stock", "products", "product", "orders",
  "order", "phone", "number", "tracking", "code", "total", "sales", "revenue",
  "status", "customer", "customers", "all", "new", "them", "it", "that", "please",
  "for", "of", "to", "with", "from", "name", "named", "placed", "how", "many",
  "much", "what", "which", "where", "who", "know", "want", "came", "came in", "in",
  "so", "tell", "show", "list", "sale", "life", "meaning", "things", "something",
  "everything", "yours", "mine", "about", "my", "your", "our", "his", "her",
  "a", "an", "is", "was", "buyer", "client", "clients", "person", "people",
  "address", "details", "info", "information", "contact", "send", "give", "get",
  "me", "us", "are", "do", "have", "has", "any", "the customer", "customer",
  "this customer", "that customer", "a customer", "my customer", "your customer",
  "spent", "spend", "bought", "purchased", "purchase", "ordered", "made",
  "did", "does", "didn't", "doesn't", "can", "will", "would", "should", "could",
  "sent", "placed", "called", "spends", "spending", "bought most", "bought"
]);

export function extractCustomerName(text: string): string | undefined {
  // "arun's orders" style.
  const poss = text.match(/([A-Za-z]{2,})['’]s\s+(?:orders?|purchases|deliveries|shipments|items|buys)/i);
  if (poss) {
    const name = poss[1];
    const lower = name.toLowerCase();
    // "today's orders" / "yesterday's orders" are time phrases, not names.
    if (!NAME_SKIP.has(lower) && !NAME_SKIP.has(lower.split(/\s+/)[0])) return name;
  }
  const patterns = [
    /^([A-Za-z][A-Za-z'-]{1,20})\s+(?:current\s+)?(?:status|stauts|statis|statuz)\b/i,
    /^([A-Za-z][A-Za-z'-]{1,20})\s+customer\b/i,
    /(?:for|of|by|from)\s+([A-Za-z][A-Za-z\s'-]{2,25})/i,
    /customer\s+(?:(?:named|name|is|called)\s+|:)\s*([A-Za-z][A-Za-z\s'-]{2,25})/i,
    /(?:orders?|order)\s+(?:of|for|from)\s+([A-Za-z][A-Za-z\s'-]{2,25})/i,
    /(?:named|name)\s+(?:is|of|for|to|:)\s*([A-Za-z][A-Za-z\s'-]{2,25})/i
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      const name = m[1].trim();
      if (/\d/.test(name)) continue;
      const lower = name.toLowerCase();
      const first = lower.split(/\s+/)[0];
      if (NAME_SKIP.has(lower) || NAME_SKIP.has(first)) continue;
      return name;
    }
  }
  return undefined;
}

export function extractAllSlots(message: string): Slots {
  return {
    tracking_code: extractTrackingCode(message),
    status: extractStatus(message),
    customer_phone: extractPhone(message),
    category: extractCategory(message),
    product_code: extractProductCode(message),
    date_range: extractDateRange(message),
    customer_name: extractCustomerName(message)
  };
}

// ---- Interpretation of a bare answer to a clarifying question

export function interpretSlotAnswer(message: string, slot: SlotName): string | undefined {
  switch (slot) {
    case "tracking_code":
      return extractTrackingCode(message);
    case "status": {
      const s = extractStatus(message);
      if (s) return s;
      const t = norm(message);
      for (const st of STATUS_LIST) {
        if (t.includes(st.toLowerCase()) || t.includes(st.toLowerCase().replace(" ", ""))) return st;
      }
      return undefined;
    }
    case "date_range":
      return extractDateRange(message);
    case "category":
      return extractCategory(message);
    case "product_code":
      return extractProductCode(message);
    case "customer_name":
      return extractCustomerName(message);
    case "customer_phone":
      return extractPhone(message);
    default:
      return undefined;
  }
}

// ---- Intent detection (fresh, from this message only) --------

export function detectIntent(message: string, slots: Slots): { intent: IntentName; matched: boolean } {
  const t = norm(message);
  const hasCode = !!slots.tracking_code;
  const hasStatus = !!slots.status;
  const hasPhone = !!slots.customer_phone;
  const hasName = !!slots.customer_name;
  const hasCategory = !!slots.category;
  const hasProductCode = !!slots.product_code;
  const hasRange = !!slots.date_range;

  const wantsUpdate = hasAny(t, ["update", "update status", "change status", "mark as", "set status", "move to", "make it", "change", "status to", "status as", "status update", "change the status", "update the status", "mark it as", "set it to", "move it to"])
    || /\b(mark|set|make|change|move)\b[\s\S]{0,40}\bas\b/.test(t)
    || /\b(mark|set|make|change|move)\b[\s\S]{0,40}\bto\b/.test(t);

  // Order with a tracking code present.
  if (hasCode) {
    if (wantsUpdate) return { intent: "UpdateOrderStatus", matched: true };
    if (hasStatus && /\b(mark|set|make|change|update|move|status)\b/.test(t)) {
      return { intent: "UpdateOrderStatus", matched: true };
    }
    return { intent: "GetOrderByCode", matched: true };
  }

  // "change status" without a code yet -> start the update flow.
  if (wantsUpdate) return { intent: "UpdateOrderStatus", matched: true };

  // Out of stock.
  if (hasAny(t, ["out of stock", "out-of-stock", "oos", "not available in stock", "stock not available", "unavailable", "sold out", "not in stock", "no stock", "which are not available", "running low"])) {
    return { intent: "GetOutOfStock", matched: true };
  }

  // Today's products / new arrivals.
  if (hasAny(t, [
    "today's product", "todays product", "today product", "today's products", "todays products",
    "today products", "products today", "product today", "new products today", "new product today",
    "new arrivals today", "arrivals today", "which product came today", "which products came today",
    "products added today", "product added today", "today's new", "todays new", "today new",
    "deals today", "deal today", "offers today", "offer today", "product of the day", "products of the day"
  ])) {
    return { intent: "GetTodayProducts", matched: true };
  }
  if (hasAny(t, ["today", "tonight", "today's", "todays", "new arrival", "new arrivals", "just added", "newly added", "came in"]) &&
      hasAny(t, ["product", "products", "item", "items", "arrival", "arrivals", "deal", "deals", "offer", "offers"])) {
    return { intent: "GetTodayProducts", matched: true };
  }

  // Product lookups.
  if (hasProductCode && hasAny(t, ["product", "code", "details", "price", "stock", "availability", "cost", "info", "information"])) {
    return { intent: "GetProductByCode", matched: true };
  }
  if (hasCategory) {
    if (hasAny(t, ["how many", "count", "number of", "total", "how much"])) return { intent: "GetProductCount", matched: true };
    return { intent: "GetProductsByCategory", matched: true };
  }
  if (hasAny(t, ["how many products", "number of products", "product count", "total products", "how many product", "count of products", "how many items", "total items", "how many products", "how much products"])) {
    return { intent: "GetProductCount", matched: true };
  }

  // Products that have actually been SOLD — distinct product names from
  // the order items ("currently selled product name", "sold products").
  const soldWord = hasAny(t, ["sold", "selled", "currently sold", "been sold", "sold so far", "sold today", "products on sale"]);
  const productWord = hasAny(t, ["product", "products", "item", "items", "name", "names"]);
  if (soldWord && productWord && !hasAny(t, ["out of stock", "sold out"])) {
    return { intent: "GetSoldProducts", matched: true };
  }

  // Product name / catalogue listing ("product name", "list products",
  // "show all products" etc) — answered from the DB, never the AI.
  if (hasAny(t, [
    "product name", "product names", "name of product", "name of products", "names of products",
    "product list", "products list", "list products", "list product", "list all products",
    "list every product", "all products", "all product", "show products", "show all products",
    "catalogue", "catalog", "products available", "available products", "product names list",
    "name list", "what products do", "which products do", "which product", "what product"
  ]) && !hasAny(t, ["today", "new", "out of stock", "sold out", "in stock"])) {
    return { intent: "GetAllProducts", matched: true };
  }

  // Sales / revenue.
  if (hasAny(t, ["revenue", "sales", "sale", "earned", "earn", "earning", "earnings", "income", "collected", "total sales", "sales total", "sale total", "sold", "made today", "how much sale", "how much did", "how much we", "how much money", "how much did we", "turnover", "profit", "business done"])) {
    return { intent: "GetSalesTotal", matched: true };
  }

  // Orders by status.
  if (hasStatus && hasAny(t, ["how many", "count", "total", "number of"])) return { intent: "GetOrdersByStatus", matched: true };
  if (hasStatus) return { intent: "GetOrdersByStatus", matched: true };

  // All orders (with customer details).
  if (hasAny(t, ["all orders", "all the orders", "all order", "all customer order", "all customer orders",
    "all orders details", "all order details", "all customers orders", "customer order details",
    "customer orders details", "orders of all customers", "every order", "each order", "all my orders",
    "list all orders", "list every order", "orders details", "complete order list", "full order list"]) ||
    (hasAny(t, ["orders", "order"]) && hasAny(t, ["all", "every", "each"]) && hasAny(t, ["details", "detail", "list", "show", "send", "give"]))) {
    return { intent: "GetOrdersByStatus", matched: true };
  }

  // Orders by customer. Phone is the most reliable; a real customer
  // name (e.g. "aromal customer ...", "aromal current status") also
  // works via a DB ILIKE match.
  if (hasPhone || (hasName && /\b(customer|orders?|order|bought|purchase|purchased|buy|status|stauts|current)\b/.test(t))) {
    return { intent: "GetOrdersByCustomer", matched: true };
  }

  // Per-customer purchase summary ("which amount product purchased",
  // "how much did each customer buy", "products purchased", etc.).
  const talksPurchase = hasAny(t, ["purchased", "purchase", "bought", "buying", "buy", "amount product", "product purchased", "products purchased", "amount purchased", "how much product", "spent", "spend", "total bought"])
    && !hasAny(t, ["recommend", "suggest", "gift", "opinion", "idea", "hello", "hi "]);
  if (talksPurchase) {
    return { intent: "GetPurchaseSummary", matched: true };
  }

  // Customer list (total customer names etc).
  // Any wording mentioning "customer" + detail/info/list/name/count counts as
  // a customer-list request, so it can never fall through to the AI.
  const wantsCustomerList = hasAny(t, [
    "total customer", "total customers", "customer names", "customers names", "customer name",
    "list of customers", "list all customers", "list customers", "customers list",
    "how many customers", "number of customers", "customer list", "all customers",
    "names of customers", "who are my customers", "who are the customers",
    "all customer names", "customer name list", "customer names list", "customers details",
    "customer details list", "customer info list", "customer details", "customer detail",
    "full customer details", "all customer details", "full customers details", "all customers details",
    "send customer details", "send customers details", "send me customer details", "send all customer details",
    "full details of customers", "details of customers", "details of all customers"
  ]) || (/\bcustomers?\b/.test(t) && /\b(details?|info(rmation)?|list|names?|count|who|total|all|every)\b/.test(t))
    || (fuzzyHas(t, ["customer", "customers"]) && fuzzyHas(t, ["details", "detail", "info", "list", "name", "names", "address", "addresses", "count"]))
    || (/\b(address|addresses)\b/.test(t) || fuzzyHas(t, ["address", "addresses"]));
  if (wantsCustomerList && !hasAny(t, ["order", "orders"]) && !fuzzyHas(t, ["order", "orders"])) {
    return { intent: "GetCustomers", matched: true };
  }

  // Order count.
  if (hasAny(t, ["how many orders", "number of orders", "total orders", "orders count", "count of orders", "how many order", "order count", "total order", "orders in total", "orders total"])) {
    return { intent: "GetOrderCount", matched: true };
  }
  if (hasAny(t, ["how many", "count", "total", "number of"]) && hasAny(t, ["order", "orders"])) {
    return { intent: "GetOrderCount", matched: true };
  }
  // A bare "orders + date range" that asks to SEE the list ("show me today's
  // orders") must fall through to GetTodayOrders, not return a count.
  if (hasAny(t, ["order", "orders"]) && hasRange && !hasAny(t, ["show", "list", "give me", "send", "display", "see", "what"])) {
    return { intent: "GetOrderCount", matched: true };
  }

  // Today's orders.
  if (hasAny(t, ["today's orders", "todays orders", "orders today", "orders came today", "orders received today", "what came in today", "list today", "today's order", "orders list today"])) {
    return { intent: "GetTodayOrders", matched: true };
  }
  if (hasAny(t, ["today", "tonight"]) && hasAny(t, ["order", "orders", "placed", "came", "received", "list", "show"])) {
    return { intent: "GetTodayOrders", matched: true };
  }

  // Order tracking / details by code (code will be asked if missing).
  if (hasAny(t, ["where is my order", "where's my order", "track my order", "track order", "order status", "my order", "order tracking", "status of my", "check my order", "order details", "order info", "what is my order status", "how is my order", "order status check", "status of order"])) {
    return { intent: "GetOrderByCode", matched: true };
  }

  return { intent: "Fallback", matched: false };
}

// ---- Natural response helpers ---------------------------------

export function askForSlot(slot: string): string {
  const opts = MODEL.slots[slot];
  if (opts && opts.length) return pick(opts);
  return `Could you tell me the ${slot.replace(/_/g, " ")}?`;
}

export function helpExamples(): string {
  return pickFrom(MODEL.responses.helpIntro, "I can check your orders, products and sales. Try asking:") +
    "\n• \"How many orders came in today?\"\n" +
    "• \"Show me today's orders\"\n" +
    "• \"Where is my order?\"\n" +
    "• \"How many delivered orders?\"\n" +
    "• \"Orders for phone 8592808194\"\n" +
    "• \"How many products in shoes?\"\n" +
    "• \"What are today's products?\"\n" +
    "• \"Which products are out of stock?\"\n" +
    "• \"What's today's sales total?\"";
}
