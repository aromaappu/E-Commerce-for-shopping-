// ============================================================
// Trend Mart - Chat Support (SINGLE-FILE version)
// Paste into: Supabase Dashboard > Edge Functions >
//            New function > name: chat-support > Deploy
// The phrase model is embedded (mined from DSTC8).
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---- 1. PHRASE MODEL (mined from DSTC8) ----
const MODEL: any = {"meta":{"generated":"2026-08-12T09:43:58.112Z","source":"DSTC8 Schema-Guided Dialogue (train+dev), 18,667 dialogues / 189k user turns"},"requestLeadIns":["i want","i need","what is","please","are there","i'm looking for","i would like","how much","find me","i am looking for","where is","find","tell me","check","what are","i am interested in","is there any","could you","help me","where are","give me","is there a","do you have","how many","how can i","show me","i'm trying to","do you have any","do you know","is there an","look up","show","how do i","give","tell","what do you have","what was","where can i find","kindly","what can you tell me about","what were"],"greetings":["Hi there, can you help me?","Hello! Can you help me?","Hi, can you help me?","Hey, can you help me out?","Hello there, I need some help.","Hi, could you help me please?","Hello! I'd like some help.","Hi, I'm looking for some help."],"thanks":["Thanks a lot.","No, thank you.","Thanks for your help.","Thanks.","Thank you very much.","Thank you for your help.","Thank you.","Thanks so much.","No, thanks.","No, that is all. Thanks.","thanks a lot","Thank you so much.","No thank you.","Thanks for the help."],"acknowledgments":["That works for me.","Sounds good to me.","Sounds good.","Perfect.","Okay, that sounds good.","Sure, that is fine with me.","Okay.","Ok.","Okay, that works.","Okay, sounds good.","That works.","Alright."],"closers":["Anything else I can help you with?","Is there anything else you need?","Anything else?","Do you need anything else?","Anything else I can do for you?","Is there anything else I can assist you with?","Shall I help you with anything else?","Have a great day!","Have a great time!","You're welcome, have a great day.","Glad to help. Anything else?"],"slots":{"tracking_code":["Do you have a specific tracking code in mind?","Could you tell me the tracking code?","Can you share the tracking code?","What tracking code would you like?","Which tracking code are you looking for?","Please let me know the tracking code.","Do you know the tracking code?","I just need the tracking code to look that up.","Is it any of these: TM-ABC123?","Do you have a particular one in mind, such as TM-ABC123?","It helps if you tell me something like TM-ABC123."],"status":["Do you have a specific order status in mind?","Could you tell me the order status?","Can you share the order status?","What order status would you like?","Which order status are you looking for?","Please let me know the order status.","Do you know the order status?","I just need the order status to look that up.","Is it any of these: Order Placed, Shipped or Delivered?","Do you have a particular one in mind, such as Order Placed, Shipped or Delivered?","It helps if you tell me something like Order Placed, Shipped or Delivered."],"date_range":["Do you have a specific time period in mind?","Could you tell me the time period?","Can you share the time period?","What time period would you like?","Which time period are you looking for?","Please let me know the time period.","Do you know the time period?","I just need the time period to look that up.","Is it any of these: today, yesterday or the last 7 days?","Do you have a particular one in mind, such as today, yesterday or the last 7 days?","It helps if you tell me something like today, yesterday or the last 7 days."],"category":["Do you have a specific category in mind?","Could you tell me the category?","Can you share the category?","What category would you like?","Which category are you looking for?","Please let me know the category.","Do you know the category?","I just need the category to look that up.","Is it any of these: bags, shoes, watches or headphones?","Do you have a particular one in mind, such as bags, shoes, watches or headphones?","It helps if you tell me something like bags, shoes, watches or headphones."],"product_code":["Do you have a specific product code in mind?","Could you tell me the product code?","Can you share the product code?","What product code would you like?","Which product code are you looking for?","Please let me know the product code.","Do you know the product code?","I just need the product code to look that up.","Is it any of these: SC1LIK?","Do you have a particular one in mind, such as SC1LIK?","It helps if you tell me something like SC1LIK."],"customer_name":["Do you have a specific customer name or phone number in mind?","Could you tell me the customer name or phone number?","Can you share the customer name or phone number?","What customer name or phone number would you like?","Which customer name or phone number are you looking for?","Please let me know the customer name or phone number.","Do you know the customer name or phone number?","I just need the customer name or phone number to look that up.","Is it any of these: a name or mobile number?","Do you have a particular one in mind, such as a name or mobile number?","It helps if you tell me something like a name or mobile number."],"customer_phone":["Do you have a specific phone number in mind?","Could you tell me the phone number?","Can you share the phone number?","What phone number would you like?","Which phone number are you looking for?","Please let me know the phone number.","Do you know the phone number?","I just need the phone number to look that up.","Is it any of these: a 10-digit mobile number?","Do you have a particular one in mind, such as a 10-digit mobile number?","It helps if you tell me something like a 10-digit mobile number."]},"responses":{"greetingReply":["Hi there! I'm the Trend Mart assistant. I can help you with orders, products and sales.","Hello! Welcome to Trend Mart support. Ask me about orders, products or sales.","Hey! Trend Mart assistant here. Need anything on orders, stock or sales?","Hi! Good to see you. I can look up orders, products and sales for you."],"helpIntro":["I can look things up for you — just ask naturally. For example:","You can ask me things like:","I can check your orders, products and sales. Try asking:"],"count":["There are {n} orders {range}.","I found {n} orders {range}.","You've got {n} orders {range}.","{n} order(s) were placed {range}.","{n} orders {range}. Hope that helps!","Here's the number: {n} orders {range}.","It looks like {n} order(s) came in {range}."],"countZero":["No orders {range} — it's been quiet.","There are no orders {range}.","Nothing came in {range}. Looks quiet!","I checked — zero orders {range}."],"countOne":["There is 1 order {range}.","Just 1 order {range}.","I found a single order {range}."],"listIntro":["Here {what}:","Here's what I found:","I found these:","Here you go:","These are {what}:","Sure, here {what}:"],"more":["\n...and {n} more.","\n...plus {n} more.","\n...there are also {n} more."],"orderStatus":["This order is currently \"{status}\".","Right now this order shows \"{status}\".","The order status is \"{status}\".","\"{status}\" is where this order stands right now.","It's currently \"{status}\"."],"orderNotFound":["I couldn't find an order with the code {code}. Could you double-check it?","Hmm, no order matches {code}. Mind verifying the code?","Nothing came up for {code}. Let me know if it might be a different code."],"todayEmpty":["No orders have come in today yet.","It's been quiet today — no orders placed yet.","There are no orders today so far.","Today looks empty so far. Check back later!"],"todayTotal":["Total for today: {total}.","That's {total} in total today.","Today's total: {total}."],"sales":["Sales {range}: {total} across {n} order(s).","You've made {total} across {n} order(s) {range}.","The total for {range} is {total} ({n} orders).","{total} in sales {range}, from {n} order(s)."],"byStatusIntro":["Found {n} order(s) with status \"{status}\":","Here are {n} order(s) marked \"{status}\":","{n} order(s) are currently \"{status}\":"],"byStatusEmpty":["No orders are currently \"{status}\".","I didn't find any \"{status}\" orders.","Nothing shows as \"{status}\" right now."],"customerIntro":["Found {n} order(s):","Here's what I found for that customer:","These {n} order(s) match:"],"customerEmpty":["I couldn't find any orders for {who}.","No orders match {who}. Maybe the details differ slightly?","Nothing on record for {who}."],"updateDone":["Done — order {code} is now \"{status}\".","Updated. {code} has been moved to \"{status}\".","All set. {code} is now marked as \"{status}\".","Order {code} now shows \"{status}\"."],"updateSame":["Order {code} is already marked as \"{status}\".","That one already shows \"{status}\"."],"updateNotFound":["I couldn't find an order with the code {code}.","No order matches {code}, so I can't update it."],"productCount":["There are {n} products in your catalogue.","You have {n} products listed right now.","Your catalogue currently holds {n} products."],"productIntro":["Here are {n} product(s) in \"{cat}\":","Found {n} product(s) in \"{cat}\":","In the \"{cat}\" category:"],"productEmpty":["I couldn't find any products in the \"{cat}\" category.","Nothing listed under \"{cat}\" right now."],"productCodeEmpty":["I couldn't find a product with the code {code}.","No product matches {code}."],"oosIntro":["These {n} product(s) are out of stock:","Currently out of stock ({n}):","These are the ones running low:"],"oosEmpty":["Great news — nothing is out of stock right now.","No products are out of stock at the moment. Everything's available.","You're all in stock. Nothing to worry about."],"confirm":["Just to confirm — you'd like to {action}. Correct?","Can you please confirm that you want to {action}?","Please confirm: {action}. Shall I go ahead?","Before I do it: you want to {action}. Right?"],"askAgain":["I'm sorry, I didn't quite catch that. ","Sorry, that didn't come through. "],"fallback":["I'm not sure I understood that. You can ask me about orders, products, sales or stock — just phrase it naturally.","Hmm, I didn't get that. Try asking something like \"how many orders came in today\" or \"which products are out of stock\".","I didn't follow that one. Ask me about today's orders, sales, products or a tracking code."],"followUp":["Anything else I can help you with?","Is there anything else you'd like to know?","Shall I help you with anything else?","Anything else I can do for you?","What else can I check for you?"],"welcome":["You're welcome!","Anytime!","Glad to help.","Happy to help!"]}};

// ---- 2. NLU ENGINE ----
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
interface PhraseModel {
  meta: { generated: string; source: string };
  requestLeadIns: string[];
  greetings: string[];
  thanks: string[];
  acknowledgments: string[];
  closers: string[];
  slots: Record<string, string[]>;
  responses: Record<string, string[]>;
}


function pick(a: string | string[], ...rest: string[]): string {
  const arr = Array.isArray(a) ? a : [a, ...rest];
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickFrom(list: string[] | undefined, fallback: string): string {
  if (!list || !list.length) return fallback;
  return list[Math.floor(Math.random() * list.length)];
}

type IntentName =
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

type SlotName =
  | "tracking_code"
  | "status"
  | "customer_name"
  | "customer_phone"
  | "date_range"
  | "category"
  | "product_code";

interface Slots {
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

interface IntentMeta {
  label: string;
  required: SlotName[][];
  optional: SlotName[];
  transactional: boolean;
}

const SPEC: Record<IntentName, IntentMeta> = {
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

interface YesNo {
  isYes: boolean;
  isNo: boolean;
  text: string;
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^\w\s'-]/g, " ").replace(/\s+/g, " ").trim();
}

function hasAny(text: string, words: string[]): boolean {
  return words.some((w) => text.includes(w));
}

// ---- Typo-tolerant matching -----------------------------------
// Users type "cusotmer", "detials", "adress" etc. Use edit-distance
// so misspelled data words still hit the database and never the AI.

function editDistance(a: string, b: string): number {
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
function fuzzyHas(t: string, targets: string[], maxDist = 2): boolean {
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

function isGreeting(message: string): boolean {
  return /^(hi|hello|hey|hii+|helo|namaste|good (morning|afternoon|evening|day)|yo|howdy)\b[\s!?.,]*$/i.test(message.trim())
    || /^(hi|hello|hey|namaste)\b[\s!?.,]*(there|everyone|trend mart)?[\s!?.,]*$/i.test(message.trim());
}

function isThanks(message: string): boolean {
  return /^(thanks|thank you|thx|ty|appreciated|thankyou|tq)\b[\s!?.,]*$/i.test(message.trim())
    || /^(thanks|thank you|thx)\b[\s!?.,]*(a lot|so much|very much|for (your )?help|for everything|for that)[\s!?.,]*$/i.test(message.trim());
}

function isAcknowledgment(message: string): boolean {
  return /^(ok|okay|k|sure|alright|right|fine|got it|understood|sounds good|that works|perfect|great|nice|good|done|received|noted|yeah ok|hmm ok)[\s!?.,]*$/i.test(message.trim())
    || /^that('s| is) (fine|ok|good|perfect|works|all|everything)[\s!?.,]*$/i.test(message.trim())
    || /^(ok|okay|k|sure)[\s,]+(sounds good|got it|fine|great|nice|perfect|thanks|thank you)[\s!?.,]*$/i.test(message.trim());
}

function isHelp(message: string): boolean {
  return /^(help|what can you do|how do you work|what do you know|what can i ask|options|commands|what are you|who are you|about you)[\s!?.,]*$/i.test(message.trim())
    || /^what('s| is) (your name|up|new|the plan)[\s!?.,]*$/i.test(message.trim());
}

function parseYesNo(message: string): YesNo {
  const t = norm(message);
  const no = /(^|\s)(no|nope|not that|not correct|wrong|cancel|never mind|that's wrong|that is wrong|don't|dont|skip|stop)(\s|$|\.|!|,)/.test(t)
    || /^(no|nope)[\s!.,]*$/.test(t);
  const yes = /(^|\s)(yes|yeah|yep|correct|right|that's right|thats right|that is right|that's correct|thats correct|that is correct|ok|okay|sure|go ahead|confirm|please do|fine|sounds good|confirmed|do it)(\s|$|\.|!|,)/.test(t)
    || /^(yes|yeah|yep|ok|okay|sure|correct|right|do it)[\s!.,]*$/.test(t);
  return { isYes: yes && !no, isNo: no, text: t };
}

// ---- Slot extractors -----------------------------------------

function extractTrackingCode(text: string): string | undefined {
  const m = text.toUpperCase().match(/\b(?:TM|TRENDMART)[-\s]?([A-Z0-9]{6})\b/);
  if (m) return `TM-${m[1]}`;
  const m2 = text.toUpperCase().match(/\b([A-Z]{2})-([A-Z0-9]{6})\b/);
  return m2 ? `${m2[1]}-${m2[2]}` : undefined;
}

function extractStatus(text: string): string | undefined {
  const t = norm(text);
  if (hasAny(t, ["delivered", "delivery complete", "out for delivery", "handed over"])) return "Delivered";
  if (hasAny(t, ["shipped", "shipping", "dispatched"])) return "Shipped";
  if (hasAny(t, ["packed", "packaging"])) return "Packed";
  if (hasAny(t, ["confirmed", "confirmation", "confirmed by"])) return "Confirmed";
  if (hasAny(t, ["order placed", "orders placed", "placed order", "new order", "new orders", "pending", "active"])) return "Order Placed";
  return undefined;
}

function extractDateRange(text: string): string | undefined {
  const t = norm(text);
  if (hasAny(t, ["today", "tonight", "just now", "today's", "till now", "so far today", "todays"])) return "today";
  if (hasAny(t, ["yesterday", "last night"])) return "yesterday";
  if (hasAny(t, ["last 7 days", "last seven days", "past 7 days", "past seven days", "this week", "last week", "past week", "weekly"])) return "last7";
  if (hasAny(t, ["last 30 days", "past 30 days", "last month", "this month", "monthly"])) return "last30";
  if (hasAny(t, ["last 24 hours", "past 24 hours", "in 24 hours"])) return "last24";
  if (hasAny(t, ["all time", "total", "all", "ever", "in total", "overall"])) return undefined;
  return undefined;
}

function extractPhone(text: string): string | undefined {
  const m = text.replace(/[^\d]/g, "").match(/(?:\+?91)?[6-9]\d{9}/);
  return m ? m[0].slice(-10) : undefined;
}

function extractCategory(text: string): string | undefined {
  const t = norm(text);
  for (const [alias, cat] of Object.entries(CATEGORY_ALIASES)) {
    if (t.includes(alias)) return cat;
  }
  return undefined;
}

function extractProductCode(text: string): string | undefined {
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

function extractCustomerName(text: string): string | undefined {
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

function extractAllSlots(message: string): Slots {
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

function interpretSlotAnswer(message: string, slot: SlotName): string | undefined {
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

function detectIntent(message: string, slots: Slots): { intent: IntentName; matched: boolean } {
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

function askForSlot(slot: string): string {
  const opts = MODEL.slots[slot];
  if (opts && opts.length) return pick(opts);
  return `Could you tell me the ${slot.replace(/_/g, " ")}?`;
}

function helpExamples(): string {
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


// ---- 3. DB QUERY LAYER ----
// ============================================================
// Trend Mart - DB query layer for the chat bot
// Runs against the same Supabase tables used by the site
// (orders, products). Replies are generated from the phrase model
// mined out of the DSTC8 corpus, so answers stay natural and
// varied instead of scripted.
// ============================================================

interface BotResult {
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

async function handleIntent(
  intent: string,
  slots: Slots,
  sb: any
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
            const spent = orders.reduce((s: number, o: any) => s + o.total, 0);
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
        const total = list.reduce((s: number, o: any) => s + (Number(o.total) || 0), 0);
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
        const total = orders.reduce((s: number, o: any) => s + (Number(o.total) || 0), 0);
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
        const lines = list.slice(0, 15).map((p: any) =>
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
        const lines = list.slice(0, 15).map((p: any) =>
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
          const lines = recent.map((p: any) => `${p.product_code} · ${p.name} · ${p.price}${p.out_of_stock ? " · OUT OF STOCK" : ""}`);
          return {
            text: `No new products came in today. Here are the latest ones:\n${lines.join("\n")}`
          };
        }
        const intro = `Here ${list.length === 1 ? "is" : "are"} the product(s) that came in today (${list.length}):`;
        const lines = list.slice(0, 15).map((p: any) =>
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
        const lines = list.slice(0, 15).map((p: any) => `${p.product_code} · ${p.name} · ${p.category}`);
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

interface StoreLookupArgs {
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

async function handleStoreLookup(args: StoreLookupArgs, sb: any): Promise<BotResult> {
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
        const spent = c.orders.reduce((s: number, o: any) => s + o.total, 0);
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
      const total = list.reduce((s: number, o: any) => s + (Number(o.total) || 0), 0);
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


// ---- 4. STATE TRACKER ----
// ============================================================
// Trend Mart - Dialogue state tracker
// Persists conversation state per session in the chat_sessions
// table so the bot remembers context between turns (active
// intent, filled slots, pending confirmations).
// ============================================================

interface DialogueState {
  activeIntent: IntentName | null;
  slots: Slots;
  lastIntent: IntentName | null;
  lastSlots: Slots;
  // Awaiting a slot value after a clarifying question.
  awaitingSlot: string | null;
  // Awaiting a yes/no before a transactional action.
  pendingConfirm: { intent: IntentName; slots: Slots; summary: string } | null;
  // Tracking code of the order most recently shown in an order query
  // (used by follow-ups like "order status" / "is it delivered yet").
  lastOrderCode: string | null;
  askedSlot: string | null;
  // Recent free-conversation turns (fed to the AI).
  history: { role: string; text: string }[];
}

function freshState(): DialogueState {
  return {
    activeIntent: null,
    slots: {},
    lastIntent: null,
    lastSlots: {},
    awaitingSlot: null,
    pendingConfirm: null,
    askedSlot: null,
    lastOrderCode: null,
    history: []
  };
}

// Append one full exchange to the rolling conversation history so the AI can
// continue any topic (DB answers included), not just AI-generated replies.
function remember(state: DialogueState, userText: string, assistantText: string, max: number = 20): void {
  state.history = [...(state.history || []), { role: "user", text: userText }, { role: "assistant", text: assistantText }]
    .slice(-max);
}

async function loadState(sb: any, sessionId: string): Promise<DialogueState> {
  try {
    const { data, error } = await sb
      .from("chat_sessions")
      .select("state, last_at")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (error || !data || !data.state) return freshState();
    const parsed = typeof data.state === "string" ? JSON.parse(data.state) : data.state;
    return { ...freshState(), ...parsed };
  } catch {
    return freshState();
  }
}

async function saveState(
  sb: any,
  sessionId: string,
  state: DialogueState,
  messages?: { from: string; text: string }[]
): Promise<void> {
  try {
    const row: Record<string, unknown> = {
      state: JSON.stringify(state),
      last_at: new Date().toISOString()
    };
    if (messages && messages.length) row.messages = messages;
    const { data, error } = await sb
      .from("chat_sessions")
      .select("id")
      .eq("session_id", sessionId)
      .maybeSingle();
    if (error) return;
    if (data) {
      await sb.from("chat_sessions").update(row).eq("id", data.id);
    } else {
      await sb.from("chat_sessions").insert({ session_id: sessionId, ...row });
    }
  } catch {
    // Chat history persistence is best-effort only.
  }
}


// ---- 5. HTTP SERVER ----
// ============================================================
// Trend Mart - Chat Support Edge Function (conversational)
//
// Natural dialogue agent using dialogue state tracking (DST),
// modelled on the DSTC8 Schema-Guided Dialogue dataset and powered
// by a phrase model mined from that corpus (nlp-model.json), so
// replies are generated and varied rather than scripted Q&A:
//   - asks one clarifying question at a time for missing info
//   - confirms before any write action
//   - remembers context across turns
//   - uses live DB data (orders, products, sales) when asked
//
// Deploy:
//   supabase functions deploy chat-support
//
// Endpoint: POST .../functions/v1/chat-support
// Body: { "message": "how many orders today", "session_id": "..." }
// Response: { "reply": "...", "intent": "...", "ok": true }
// ============================================================

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

// ---- Data safety gate ---------------------------------------
// The AI must NEVER answer store-data questions (it invents fake
// numbers). Any data request that the rule engine didn't handle is
// answered with DB guidance instead of the AI.
const DATA_KEYWORDS =
  /\b(address|addresses|customer|customers|order|orders|product|products|stock|price|prices|cost|sale|sales|revenue|income|profit|delivery|tracking|track|phone|banner|category|payment|invoice|purchase|purchased|bought|amount|spent|spend|inr|rupee|rupees|₹)\b/i;
const DATA_REQUEST_WORDS =
  /\b(show|send|tell|give|list|get|need|want|what|how|where|which|who|details?|info(rmation)?|view|see)\b/i;
const ALLOW_AI_WORDS =
  /\b(recommend|suggest|suggestion|gift|opinion|think|idea|budget)\b/i;

function isDataRequest(message: string): boolean {
  const t = norm(message);
  const dataHit = DATA_KEYWORDS.test(t) || fuzzyHas(t, [
    "customer", "customers", "order", "orders", "product", "products",
    "stock", "price", "prices", "sale", "sales", "delivery", "tracking",
    "phone", "address", "addresses", "payment", "details", "purchase", "purchased",
    "bought", "amount", "spent", "spend", "rupees", "inr"
  ]);
  const requestHit = DATA_REQUEST_WORDS.test(t) || fuzzyHas(t, [
    "which", "what", "how", "show", "send", "tell", "give", "list", "need", "where"
  ], 1);
  return dataHit && requestHit && !ALLOW_AI_WORDS.test(t);
}

const AI_UNAVAILABLE_REPLY =
  "Sorry, I hit a snag pulling that from the database. Give me a second and try again — " +
  "or ask me things like \"total customer name\", \"today's orders\" or \"which products are out of stock\".";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

// ---- Slot bookkeeping helpers --------------------------------

function mergeSlots(base: Slots, add: Slots): Slots {
  const out = { ...base };
  for (const k of Object.keys(add) as SlotName[]) {
    const v = add[k];
    if (v !== undefined && v !== "") out[k] = v;
  }
  return out;
}

// Which required-slot alternatives are still unmet?
function missingRequired(intent: IntentName, slots: Slots): string[] {
  const meta = SPEC[intent];
  if (!meta) return [];
  const alternatives = meta.required;
  if (alternatives.length === 0) return [];
  const fillsOne = alternatives.some((alt) =>
    alt.every((slot) => slots[slot] !== undefined && slots[slot] !== "")
  );
  if (fillsOne) return [];
  return alternatives[0].filter((slot) => slots[slot] === undefined || slots[slot] === "");
}

// Call a hosted cloud AI (default: Groq, free tier) for questions the
// rule engine doesn't recognise. Runs entirely inside Supabase Edge.
// Env vars:
//   LLM_API_KEY    required  (Groq key from console.groq.com)
//   LLM_MODEL      optional  (default: llama-3.3-70b-versatile)
//   LLM_BASE_URL   optional  (default: Groq; any OpenAI-compatible API)
const LLM_SYSTEM_PROMPT =
  "You are the customer-support assistant for Trend Mart, an online store " +
  "selling bags, footwear, watches, clothing and electronics. " +
  "The person talking to you is the STORE OWNER/admin. " +
  "Keep answers short, natural and helpful (2-4 sentences). " +
  "You have ONE tool: lookup_store_data. Use it for ANY question about " +
  "customers, orders, order dates/status, products, prices, stock, sales or " +
  "addresses — ALWAYS call it to fetch real data from the store database, " +
  "then summarise exactly what it returns. NEVER invent or guess customer " +
  "names, numbers, counts, prices or stock from memory; if the tool returns " +
  "nothing for a name, say no orders were found under that name. " +
  "A conversation history is included — if the user asks a follow-up about " +
  "data already shown, answer directly from that conversation and only call " +
  "the tool again if new data is needed. " +
  "You are READ-ONLY: you CANNOT update, create or delete any data. Never " +
  "claim you changed an order status or any record; if the user wants to " +
  "change an order status, tell them to use the status commands. " +
  "OUTPUT RULES: (1) Always call lookup_store_data before answering any " +
  "data question, even in follow-ups where new data is needed. (2) Answer " +
  "ONLY from what the tool returned — never add names, numbers or facts it " +
  "did not return. (3) Be BRIEF: status answers in ONE short line " +
  "(e.g. \"Order TM-G9683F is Delivered.\"); do NOT paste tracking codes, " +
  "item lists, totals or timelines unless the user explicitly asks for full " +
  "details. (4) Use ₹ (INR) for money, never $.";

const LOOKUP_TOOL = {
  type: "function",
  function: {
    name: "lookup_store_data",
    description:
      "Query the Trend Mart store database for real data about customers, orders, products, prices, stock or sales. Call this for ANY store-data question.",
    parameters: {
      type: "object",
      properties: {
        area: {
          type: "string",
          description: "What kind of data is being asked about: customers, orders, products or sales."
        },
        customer_name: { type: "string", description: "Customer name filter." },
        customer_phone: { type: "string", description: "Customer phone number filter." },
        tracking_code: { type: "string", description: "Order tracking code like TM-G9683F." },
        status: { type: "string", description: "Order status: Order Placed, Shipped or Delivered." },
        category: { type: "string", description: "Product category (shoe, watch, bag, etc)." },
        product_code: { type: "string", description: "Product code like S1VIV." },
        date_range: { type: "string", description: "Time window: today, yesterday, last7 or last30." },
        full: { type: "string", description: "\"true\" for full details (addresses, per-customer totals)." },
        out_of_stock_only: { type: "string", description: "\"true\" to only show out-of-stock products." },
        sort_by_price: { type: "string", description: "\"asc\" to return the cheapest products first, \"desc\" for the most expensive. Use this for cheapest/most expensive/price range questions." }
      },
      required: ["area"]
    }
  }
};

async function askLLM(
  history: { role: string; text: string }[],
  userText: string,
  sb: SupabaseClient
): Promise<{ reply: string } | { error: string } | null> {
  const run = async (messages: unknown[]) => {
    const apiKey = (Deno.env.get("LLM_API_KEY") || "").trim();
    const baseUrl = (Deno.env.get("LLM_BASE_URL") || "https://api.groq.com/openai/v1").replace(/\/+$/, "").trim();
    const model = (Deno.env.get("LLM_MODEL") || "llama-3.3-70b-versatile").trim();
    const res = await fetch(baseUrl + "/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + apiKey
      },
      body: JSON.stringify({ model, messages, tools: [LOOKUP_TOOL], tool_choice: "auto", max_tokens: 600, temperature: 0.5 })
    });
    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      return { ok: false as const, error: "AI API HTTP " + res.status + ": " + errBody.slice(0, 200) };
    }
    return { ok: true as const, data: await res.json() };
  };

  try {
    const apiKey = (Deno.env.get("LLM_API_KEY") || "").trim();
    if (!apiKey) return null;
    const messages: unknown[] = [
      { role: "system", content: LLM_SYSTEM_PROMPT },
      ...history.map((h) => ({ role: h.role === "assistant" ? "assistant" : "user", content: h.text })),
      { role: "user", content: userText }
    ];

    // The model may need a couple of rounds: it can call the tool, then
    // reply, or make one refinement call. If it keeps re-calling the tool
    // (e.g. asking the DB to "find the cheapest"), stop and answer with the
    // real data already fetched — never loop forever.
    let toolCallRounds = 0;
    let toolFallback = "";
    for (let round = 0; round < 5; round++) {
      const res = await run(messages);
      if (!res.ok) return { error: res.error };
      const msg = res.data?.choices?.[0]?.message;
      if (!msg) return { error: "AI returned an empty answer." };

      if (msg.tool_calls && msg.tool_calls.length) {
        if (toolCallRounds >= 1) {
          if (toolFallback) return { reply: toolFallback };
          return { error: "AI kept re-calling the tool without answering." };
        }
        toolCallRounds++;
        messages.push(msg);
        for (const tc of msg.tool_calls) {
          let args: StoreLookupArgs = { area: "customers" };
          try { args = JSON.parse(tc.function?.arguments || "{}"); } catch { /* keep defaults */ }
          const result = await handleStoreLookup(args, sb);
          toolFallback = result.text;
          messages.push({ role: "tool", tool_call_id: tc.id, content: result.text });
        }
        continue;
      }

      const reply = String(msg.content || "").trim();
      if (reply) return { reply };
      // Model returned empty text after a lookup: answer with the real data
      // the tool already fetched instead of failing.
      if (toolFallback) return { reply: toolFallback };
      return { error: "AI returned an empty answer." };
    }
    return toolFallback ? { reply: toolFallback } : { error: "AI kept looping without producing an answer." };
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) };
  }
}

// ---- Conversation turn ---------------------------------------

async function respond(reqBody: { message?: string; session_id?: string }): Promise<Response> {
  const message = (reqBody.message || "").trim();
  const sessionId = reqBody.session_id || "anon";
  if (!message) return json({ ok: false, reply: "Please send a message." }, 400);

  // Small talk handled without the DB.
  if (isGreeting(message)) {
    const opener = pickFrom(MODEL.responses.greetingReply, "Hi there! I'm the Trend Mart assistant.");
    return json({ ok: true, intent: "Greeting", reply: opener + "\n\n" + helpExamples() });
  }
  if (isThanks(message)) {
    const reply = pickFrom(MODEL.responses.welcome, "You're welcome!") + " " +
      pickFrom(MODEL.responses.followUp, "Anything else I can help you with?");
    return json({ ok: true, intent: "Thanks", reply });
  }
  if (isHelp(message)) {
    return json({ ok: true, intent: "Help", reply: helpExamples() });
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || ""
  );

  const state: DialogueState = await loadState(sb, sessionId);
  let reply: string;
  let intentName: string = "Fallback";

  // ---- 1. Pending confirmation (yes/no before a write) -------
  if (state.pendingConfirm) {
    const yn = parseYesNo(message);
    if (yn.isYes) {
      const confirm = state.pendingConfirm;
      state.pendingConfirm = null;
      state.activeIntent = null;
      if (confirm.intent === "UpdateOrderStatus" && confirm.slots.tracking_code) {
        state.lastOrderCode = confirm.slots.tracking_code;
      }
      const result = await handleIntent(confirm.intent, confirm.slots, sb);
      remember(state, message, result.text);
      await saveState(sb, sessionId, state);
      return json({ ok: true, intent: confirm.intent, reply: result.text });
    }
    if (yn.isNo) {
      state.pendingConfirm = null;
      if (state.activeIntent) {
        const missing = missingRequired(state.activeIntent, state.slots);
        if (missing.length) {
          state.awaitingSlot = missing[0];
          reply = pick("No problem — let's fix that. ", "Sure, let's change that. ") + askForSlot(missing[0]);
        } else {
          reply = pick("No problem, I won't change anything. ", "Alright, nothing changed. ") +
            pickFrom(MODEL.responses.followUp, "What would you like to do next?");
        }
      } else {
        reply = "No problem, I won't change anything. " + pickFrom(MODEL.responses.followUp, "What would you like to do next?");
      }
      remember(state, message, reply);
      await saveState(sb, sessionId, state);
      return json({ ok: true, intent: "UpdateOrderStatus", reply });
    }
    // Not a yes/no: if this is a fresh data request, drop the pending
    // confirm and answer normally instead of nagging for yes/no.
    const freshProbe = detectIntent(message, extractAllSlots(message));
    if (freshProbe.matched && freshProbe.intent !== "Fallback") {
      state.pendingConfirm = null;
      state.activeIntent = null;
      state.awaitingSlot = null;
      // fall through to normal processing
    } else {
      reply = pick("Sorry, I need a yes or no to continue. ", "I just need a quick yes or no here. ") + state.pendingConfirm.summary;
      remember(state, message, reply);
      await saveState(sb, sessionId, state);
      return json({ ok: true, intent: "Confirm", reply });
    }
  }

  // ---- 2. Filling a slot asked in the previous turn ----------
  if (state.awaitingSlot && !detectIntent(message, extractAllSlots(message)).matched) {
    const slot = state.awaitingSlot as SlotName;
    const value = interpretSlotAnswer(message, slot);
    if (value) {
      state.slots = mergeSlots(state.slots, { [slot]: value } as Slots);
      state.awaitingSlot = null;
      const missing = missingRequired(state.activeIntent as IntentName, state.slots);
      if (missing.length) {
        state.awaitingSlot = missing[0];
        remember(state, message, askForSlot(missing[0]));
        await saveState(sb, sessionId, state);
        return json({ ok: true, intent: state.activeIntent, reply: askForSlot(missing[0]) });
      }
      return executeIntent(state, sessionId, message);
    }
    reply = pickFrom(MODEL.responses.askAgain, "Sorry, I didn't quite catch that. ") + askForSlot(slot);
    remember(state, message, reply);
    await saveState(sb, sessionId, state);
    return json({ ok: true, intent: state.activeIntent, reply });
  }

  // ---- 2b. Plain acknowledgment of the previous answer -------
  if (isAcknowledgment(message) && !state.activeIntent && !state.awaitingSlot) {
    reply = pick(
      pickFrom(MODEL.responses.welcome, "You're welcome!") + " " + pickFrom(MODEL.responses.followUp, "Anything else?"),
      "Got it. " + pickFrom(MODEL.responses.followUp, "Anything else I can help you with?"),
      pickFrom(MODEL.acknowledgments, "Sounds good.") + " " + pickFrom(MODEL.responses.followUp, "What else can I check for you?")
    );
    remember(state, message, reply);
    await saveState(sb, sessionId, state);
    return json({ ok: true, intent: "Acknowledgment", reply });
  }

  // ---- 3. Fresh intent detection ------------------------------
  const freshSlots = extractAllSlots(message);

  // ---- 2c. Follow-up on the order already discussed ----------
  // "order status ?" right after we showed an order should reuse its
  // tracking code instead of asking for a new one. This only applies to
  // short, order-focused follow-ups — it must NEVER hijack a fresh request
  // about a different data area (customers, products, addresses, sales).
  const followUpCode = freshSlots.tracking_code || state.lastOrderCode ||
    state.lastSlots?.tracking_code ||
    (state.history || []).filter((h) => h.role === "user")
      .flatMap((h) => h.text.match(/TM-[A-Za-z0-9]+/gi) || []).pop();
  const tNorm = norm(message);
  const otherDataWord = /\b(customer|customers|product|products|address|addresses|sale|sales|stock|price|category|phone|banner|invoice|bought|purchased|spent|purchase)\b/.test(tNorm);
  if (followUpCode && !freshSlots.tracking_code && !otherDataWord && !/\b(all|every|each|list)\b/.test(tNorm)) {
    // "delivered" / "shipping" right after an order = change its status.
    // (But "is it delivered?" is a question, not a change command.)
    if (freshSlots.status &&
        !/(^|\s)(is|did|has|was|are|were|will|do|does|when|can|could)\b/.test(tNorm) &&
        !/\b(how|what|which|show|list|count|many)\b/.test(tNorm)) {
      state.activeIntent = "UpdateOrderStatus";
      state.slots = { tracking_code: followUpCode, status: freshSlots.status };
      state.awaitingSlot = null;
      state.pendingConfirm = null;
      return executeIntent(state, sessionId, message);
    }
    // Status/info questions about that same order. Skip when this is clearly
    // a fresh count/list request ("how many delivered orders?") — the count
    // guard mirrors the one on the status-change branch above.
    if (!/\b(update|change|mark|set|move)\b/.test(tNorm) &&
        !/(\bhow many\b|\bcount\b|\bnumber of\b|\bshow\b|\blist\b)/.test(tNorm) &&
        /\b(status|tracking|details?|info|where|when|delivery|date|placed|shipped|delivered|packed|came|arrived|yet)\b/.test(tNorm)) {
      state.activeIntent = "GetOrderByCode";
      state.slots = { tracking_code: followUpCode };
      state.awaitingSlot = null;
      state.pendingConfirm = null;
      return executeIntent(state, sessionId, message);
    }
  }

  const detected = detectIntent(message, freshSlots);

  if (detected.matched && detected.intent !== "Fallback") {
    state.activeIntent = detected.intent;
    state.slots = mergeSlots({}, freshSlots);
    if (detected.intent === "GetCustomers" &&
        (/\b(detail|details|full|complete|entire|all info|whole|address|addresses)\b/.test(norm(message)) ||
         fuzzyHas(norm(message), ["details", "detail", "address", "addresses"]))) {
      state.slots.detail_level = "full";
    }
    state.awaitingSlot = null;
    state.pendingConfirm = null;
    return executeIntent(state, sessionId, message);
  }

  // ---- 4. Nothing matched -> AI with real DB tool access.
  const ai = await askLLM((state.history || []).slice(-16), message, sb);
  if (ai && "reply" in ai) {
    remember(state, message, ai.reply);
    await saveState(sb, sessionId, state);
    return json({ ok: true, intent: "Chat", reply: ai.reply });
  }
  // AI hiccup (rate limit, network, empty): retry once before giving up.
  const retry = await askLLM((state.history || []).slice(-16), message, sb);
  if (retry && "reply" in retry) {
    remember(state, message, retry.reply);
    await saveState(sb, sessionId, state);
    return json({ ok: true, intent: "Chat", reply: retry.reply });
  }
  reply = AI_UNAVAILABLE_REPLY;
  remember(state, message, reply);
  await saveState(sb, sessionId, state);
  return json({ ok: true, intent: "Fallback", reply });

  // ---- 5. Nothing matched -------------------------------------
  reply = pickFrom(MODEL.responses.fallback, "Sorry, I didn't understand that.") +
    "\n\n" + helpExamples();
  remember(state, message, reply);
  await saveState(sb, sessionId, state);
  return json({ ok: true, intent: "Fallback", reply });
}

// ---- Execute an intent once all required slots are filled -----
async function executeIntent(state: DialogueState, sessionId: string, userText: string): Promise<Response> {
  const sb = createClient(
    Deno.env.get("SUPABASE_URL") || "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || Deno.env.get("SUPABASE_ANON_KEY") || ""
  );
  const intent = state.activeIntent as IntentName;
  const slots = state.slots;

  // Ask for missing required info before running the query
  // (e.g. "order status" without a tracking code yet).
  const missing = missingRequired(intent, slots);
  if (missing.length) {
    state.awaitingSlot = missing[0];
    await saveState(sb, sessionId, state);
    return json({ ok: true, intent, reply: askForSlot(missing[0]) });
  }

  // Transactional intent: confirm first.
  if (SPEC[intent].transactional) {
    const action = intent === "UpdateOrderStatus"
      ? `mark order ${slots.tracking_code} as ${slots.status}`
      : `${SPEC[intent].label}: ${slots.tracking_code} → ${slots.status}`;
    const summary = pickFrom(MODEL.responses.confirm, "Just to confirm — you'd like to {action}. Correct?")
      .replace("{action}", action);
    state.pendingConfirm = { intent, slots: { ...slots }, summary };
    remember(state, userText, summary);
    await saveState(sb, sessionId, state);
    return json({ ok: true, intent, reply: summary });
  }

  // Non-transactional: run the DB query and reply naturally.
  const result = await handleIntent(intent, slots, sb);

  // Remember the order code from any query that actually showed an order,
  // so bare follow-ups ("order status", "is it delivered yet") reuse it.
  const orderIntents = ["GetOrderByCode", "GetOrdersByCustomer", "GetTodayOrders", "GetOrdersByStatus"];
  const shownCode = orderIntents.includes(intent)
    ? (result.text.match(/TM-[A-Za-z0-9]+/i) || [])[0]
    : undefined;
  if (shownCode) state.lastOrderCode = shownCode;

  state.lastIntent = intent;
  state.lastSlots = { ...slots };
  state.activeIntent = null;
  state.awaitingSlot = null;
  await saveState(sb, sessionId, state);

  // Occasionally round off with a natural follow-up, like a human agent.
  let replyText = result.text;
  const listy = ["GetTodayOrders", "GetOrdersByStatus", "GetOrdersByCustomer", "GetCustomers", "GetProductsByCategory", "GetTodayProducts", "GetOutOfStock", "GetOrderByCode", "GetProductByCode", "GetAllProducts", "GetSoldProducts"];
  if (!listy.includes(intent) && Math.random() < 0.3) {
    replyText += "\n\n" + pickFrom(MODEL.responses.followUp, "Anything else I can help you with?");
  }
  remember(state, userText, replyText);
  await saveState(sb, sessionId, state);
  return json({ ok: true, intent, reply: replyText });
}

  Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") {
      return json({ ok: false, reply: "Send a POST request with a message." }, 405);
    }
    let body: { message?: string; session_id?: string } = {};
    try {
      body = await req.json();
    } catch {
      return json({ ok: false, reply: "Invalid JSON body." }, 400);
    }
    try {
      return await respond(body);
    } catch (e) {
      return json({ ok: false, reply: "Sorry, something went wrong. " + (e instanceof Error ? e.message : "") }, 500);
    }
  });
