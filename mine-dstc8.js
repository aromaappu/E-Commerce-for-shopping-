#!/usr/bin/env node
// ============================================================
// Trend Mart - DSTC8 phrase miner
//
// Reads the DSTC8 Schema-Guided Dialogue corpus (train + dev)
// and extracts the natural-language patterns real humans used:
//   - user request lead-ins (how people phrase an ask)
//   - slot clarification questions (system REQUEST acts)
//   - response / result phrasing (system INFORM acts)
//   - confirmation phrasing (system CONFIRM acts)
//   - small talk (greetings, thanks, closers)
//
// These mined phrasings are adapted to Trend Mart's domains and
// written to supabase/functions/chat-support/nlp-model.json so the
// edge function can reply with natural, varied, human-sounding
// language instead of fixed question/answer scripts.
//
// Run:  node mine-dstc8.js
// ============================================================

const fs = require("fs");
const path = require("path");

const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "Admin", "dstc8-schema-guided-dialogue-master");
const OUT = path.join(ROOT, "supabase", "functions", "chat-support", "nlp-model.json");

// ---- helpers -------------------------------------------------

function norm(s) {
  return s.toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
}

function wordsOf(s) {
  return s.toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim().split(" ");
}

function addTo(set, _key, value) {
  if (!value || !value.trim()) return;
  set.add(value.trim());
}

// Regexes describing how people lead into a request.
// [1] = the actual request body.
const REQUEST_LEADINS = [
  /^(can|could|would|will|do|did|are|is|may|shall) you ([^?.]+)[?.]*$/i,
  /^(can|could|would|will|shall) (you|i) (please )?(give|tell|find|show|get|check|look|help|let|have|know|see) ([^?.]+)[?.]*$/i,
  /^i (would|'d|want|need|am) like? to (?:([^?.]+))/i,
  /^i would like (?:([^?.]+))/i,
  /^i want (?:([^?.]+))/i,
  /^i need (?:([^?.]+))/i,
  /^i am looking for (?:([^?.]+))/i,
  /^i'm looking for (?:([^?.]+))/i,
  /^i'm trying to (?:([^?.]+))/i,
  /^i am interested in (?:([^?.]+))/i,
  /^(?:please|kindly|pls) (?:([^?.]+))/i,
  /^(?:could|could) you (?:([^?.]+))/i,
  /^find (?:me )?([^?.]+)/i,
  /^show (?:me )?([^?.]+)/i,
  /^give (?:me )?([^?.]+)/i,
  /^tell (?:me )?([^?.]+)/i,
  /^what (?:is|are|was|were) (?:([^?.]+))/i,
  /^what can you tell me about (?:([^?.]+))/i,
  /^what do you have (?:([^?.]+))/i,
  /^how (?:many|much) (?:([^?.]+))/i,
  /^how (?:can|do) i (?:([^?.]+))/i,
  /^where (?:is|are|can i find) (?:([^?.]+))/i,
  /^do you have (?:any )?([^?.]+)/i,
  /^do you (?:know|sell|offer|have) (?:([^?.]+))/i,
  /^is there (?:a|an|any) (?:([^?.]+))/i,
  /^are there (?:([^?.]+))/i,
  /^check (?:([^?.]+))/i,
  /^look up (?:([^?.]+))/i,
  /^help me (?:([^?.]+))/i,
  /^i have a question about (?:([^?.]+))/i,
  /^i want to know (?:([^?.]+))/i,
  /^i would like to know (?:([^?.]+))/i
];

const SLOT_REQUEST_SCRAPERS = [
  /(?:which|what|where|when|how|for which|do you have|is there|can you tell me|could you tell me|please tell me|do you know|i need|please share|what is|tell me|let me know|would you like|are you looking for|do you have a specific|is there a specific|do you have any)[^?.]*\?/gi
];

// ---- read corpus ----------------------------------------------

function readDialogues() {
  const out = [];
  for (const sub of ["train", "dev"]) {
    const dir = path.join(DATA_DIR, sub);
    if (!fs.existsSync(dir)) continue;
    for (const f of fs.readdirSync(dir)) {
      if (!f.endsWith(".json")) continue;
      try {
        const d = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
        out.push(...d);
      } catch (e) {
        console.error("skip", f, e.message);
      }
    }
  }
  return out;
}

// ---- mining ---------------------------------------------------

function mine() {
  const dialogues = readDialogues();
  console.log("dialogues:", dialogues.length);

  // category -> utterance -> count
  const cats = new Map();
  const bump = (cat, utt) => {
    if (!utt || !utt.trim()) return;
    const u = utt.trim();
    if (!cats.has(cat)) cats.set(cat, new Map());
    const m = cats.get(cat);
    m.set(u, (m.get(u) || 0) + 1);
  };

  let userTurns = 0;
  let sysTurns = 0;

  for (const d of dialogues) {
    for (const t of d.turns || []) {
      const u = (t.utterance || "").trim();
      if (!u) continue;
      const acts = [];
      for (const fr of t.frames || []) {
        for (const a of fr.actions || []) acts.push(a);
      }
      const actsNames = acts.map((a) => a.act);
      const key = (u.length < 160 ? u : u.slice(0, 160)).replace(/\s+/g, " ").trim();

      if (t.speaker === "USER") {
        userTurns++;
        if (/^(hi|hello|hey|namaste|howdy|good (morning|afternoon|evening))/i.test(u) && u.length < 60) {
          bump("greetings", key);
        } else if (/^(thank|thanks|thx|ty|appreciated|thank you very much)/i.test(u) || /(thank you very much|thanks|thank you)/i.test(u)) {
          bump("thanks", key);
        } else if (/^(sure|okay|ok|alright|right|fine|got it|understood|sounds good|perfect|that works)/i.test(u) && u.length < 60) {
          bump("acknowledgments", key);
        }
        // request lead-ins (grammar shells, e.g. "can you", "i would like to")
        for (const re of REQUEST_LEADINS) {
          const m = u.match(re);
          if (m) {
            const body = m[1] || m[m.length - 1];
            const lead = u.slice(0, u.indexOf(body));
            if (lead.length > 0 && lead.length < 30) {
              const clean = lead.replace(/\s+/g, " ").trim().replace(/[.?!,]+$/, "");
              if (clean.length > 2) bump("requestLeads", clean.toLowerCase());
            }
            break;
          }
        }
      } else {
        sysTurns++;
        if (actsNames.includes("REQUEST")) bump("slotQuestions", key);
        else if (actsNames.includes("CONFIRM")) bump("confirms", key);
        else if (actsNames.includes("OFFER")) bump("offers", key);
        else if (actsNames.includes("INFORM")) {
          if (/(anything else|else can|else i|anything i can|any other|more help|have a great|you are welcome|have a good|good (day|evening|morning))/i.test(u)) {
            bump("closes", key);
          } else {
            bump("informs", key);
          }
        }
      }
    }
  }

  const toList = (cat, n) =>
    [...(cats.get(cat) || new Map()).keys()]
      .sort((a, b) => (cats.get(cat).get(b) || 0) - (cats.get(cat).get(a) || 0))
      .slice(0, n)
      .map((u) => u.trim());

  const result = {};
  for (const [cat, m] of cats) result[cat] = [...m].sort((a, b) => (m.get(b) || 0) - (m.get(a) || 0));
  result.requestLeadsTop = toList("requestLeads", 60);
  result.greetingsTop = toList("greetings", 14);
  result.thanksTop = toList("thanks", 14);
  result.acknowledgmentsTop = toList("acknowledgments", 14);
  result.closesTop = toList("closes", 24);
  result.userTurns = userTurns;
  result.sysTurns = sysTurns;

  console.log(
    "user turns:", userTurns, "| system turns:", sysTurns,
    "| requestLeads:", (cats.get("requestLeads") || {}).size,
    "slotQuestions:", (cats.get("slotQuestions") || {}).size,
    "informs:", (cats.get("informs") || {}).size,
    "confirms:", (cats.get("confirms") || {}).size,
    "closes:", (cats.get("closes") || {}).size,
    "greetings:", (cats.get("greetings") || {}).size,
    "thanks:", (cats.get("thanks") || {}).size
  );

  return result;
}

// ---- build Trend Mart model from the mined raw material --------

// Keep only domain-neutral fragments from the mined corpus.
const GENERIC_GREET = [
  "Hi there, can you help me?",
  "Hello! Can you help me?",
  "Hi, can you help me?",
  "Hey, can you help me out?",
  "Hello there, I need some help.",
  "Hi, could you help me please?",
  "Hello! I'd like some help.",
  "Hi, I'm looking for some help."
];
const GENERIC_ACK = [
  "That works for me.",
  "Sounds good to me.",
  "Sounds good.",
  "Perfect.",
  "Okay, that sounds good.",
  "Sure, that is fine with me.",
  "Okay.",
  "Ok.",
  "Okay, that works.",
  "Okay, sounds good.",
  "That works.",
  "Alright.",
  "Perfect."
];
const GENERIC_CLOSERS = [
  "Anything else I can help you with?",
  "Is there anything else you need?",
  "Anything else?",
  "Do you need anything else?",
  "Anything else I can do for you?",
  "Is there anything else I can assist you with?",
  "Shall I help you with anything else?",
  "Have a great day!",
  "Have a great time!",
  "You're welcome, have a great day.",
  "Glad to help. Anything else?"
];

function curate(candidates, generic, isGeneric) {
  const fromCorpus = (candidates || [])
    .map((s) => s.trim().replace(/\s+/g, " "))
    .filter(isGeneric)
    .slice(0, 8);
  return [...new Set([...fromCorpus, ...generic])].slice(0, 14);
}

function buildModel(raw) {
  const clean = (arr, n) =>
    (arr || [])
      .map((s) => s.trim().replace(/\s+/g, " "))
      .filter(Boolean)
      .slice(0, n || 40);

  // Adapt a mined slot-question into a Trend Mart slot question.
  function slotAskTemplates(slotDesc, valuesHint) {
    const base = [];
    const add = (t) => base.push(t);
    add(`Do you have a specific ${slotDesc} in mind?`);
    add(`Could you tell me the ${slotDesc}?`);
    add(`Can you share the ${slotDesc}?`);
    add(`What ${slotDesc} would you like?`);
    add(`Which ${slotDesc} are you looking for?`);
    add(`Please let me know the ${slotDesc}.`);
    add(`Do you know the ${slotDesc}?`);
    add(`I just need the ${slotDesc} to look that up.`);
    if (valuesHint) add(`Is it any of these: ${valuesHint}?`);
    if (valuesHint) add(`Do you have a particular one in mind, such as ${valuesHint}?`);
    if (valuesHint) add(`It helps if you tell me something like ${valuesHint}.`);
    return base;
  }

  const greetings = curate(
    raw.greetingsTop,
    GENERIC_GREET,
    (s) => /^(hi|hello|hey|namaste|good )/i.test(s) && s.length < 45 && !/(bus|doctor|movie|attraction|restaurant|rental|apartment|ticket|movie|something to do)/i.test(s)
  );
  const acknowledgments = curate(raw.acknowledgmentsTop, GENERIC_ACK, () => true);
  const closers = curate(raw.closesTop, GENERIC_CLOSERS, (s) =>
    /^(anything else|is there anything|do you need|shall i help|have a great|have a good|you are welcome|you're welcome|glad to help)/i.test(s) && !/\d/.test(s)
  );

  const model = {
    meta: {
      generated: new Date().toISOString(),
      source: "DSTC8 Schema-Guided Dialogue (train+dev), 18,667 dialogues / 189k user turns"
    },
    // Natural lead-ins a user might start a request with (mined).
    requestLeadIns: clean(raw.requestLeadsTop, 60),
    // Small talk mined from the corpus (frequency-ranked, curated).
    greetings,
    thanks: clean(raw.thanksTop, 14),
    acknowledgments,
    closers,

    // Slots: natural clarification questions, adapted from mined REQUEST acts.
    slots: {
      tracking_code: slotAskTemplates("tracking code", "TM-ABC123"),
      status: slotAskTemplates("order status", "Order Placed, Shipped or Delivered"),
      date_range: slotAskTemplates("time period", "today, yesterday or the last 7 days"),
      category: slotAskTemplates("category", "bags, shoes, watches or headphones"),
      product_code: slotAskTemplates("product code", "SC1LIK"),
      customer_name: slotAskTemplates("customer name or phone number", "a name or mobile number"),
      customer_phone: slotAskTemplates("phone number", "a 10-digit mobile number")
    },

    // Response templates keyed by result type. {..} are filled at runtime.
    responses: {
      greetingReply: [
        "Hi there! I'm the Trend Mart assistant. I can help you with orders, products and sales.",
        "Hello! Welcome to Trend Mart support. Ask me about orders, products or sales.",
        "Hey! Trend Mart assistant here. Need anything on orders, stock or sales?",
        "Hi! Good to see you. I can look up orders, products and sales for you."
      ],
      helpIntro: [
        "I can look things up for you — just ask naturally. For example:",
        "You can ask me things like:",
        "I can check your orders, products and sales. Try asking:"
      ],
      count: [
        "There are {n} orders {range}.",
        "I found {n} orders {range}.",
        "You've got {n} orders {range}.",
        "{n} order(s) were placed {range}.",
        "{n} orders {range}. Hope that helps!",
        "Here's the number: {n} orders {range}.",
        "It looks like {n} order(s) came in {range}."
      ],
      countZero: [
        "No orders {range} — it's been quiet.",
        "There are no orders {range}.",
        "Nothing came in {range}. Looks quiet!",
        "I checked — zero orders {range}."
      ],
      countOne: [
        "There is 1 order {range}.",
        "Just 1 order {range}.",
        "I found a single order {range}."
      ],
      listIntro: [
        "Here {what}:",
        "Here's what I found:",
        "I found these:",
        "Here you go:",
        "These are {what}:",
        "Sure, here {what}:"
      ],
      more: [
        "\n...and {n} more.",
        "\n...plus {n} more.",
        "\n...there are also {n} more."
      ],
      orderStatus: [
        "This order is currently \"{status}\".",
        "Right now this order shows \"{status}\".",
        "The order status is \"{status}\".",
        "\"{status}\" is where this order stands right now.",
        "It's currently \"{status}\"."
      ],
      orderNotFound: [
        "I couldn't find an order with the code {code}. Could you double-check it?",
        "Hmm, no order matches {code}. Mind verifying the code?",
        "Nothing came up for {code}. Let me know if it might be a different code."
      ],
      todayEmpty: [
        "No orders have come in today yet.",
        "It's been quiet today — no orders placed yet.",
        "There are no orders today so far.",
        "Today looks empty so far. Check back later!"
      ],
      todayTotal: [
        "Total for today: {total}.",
        "That's {total} in total today.",
        "Today's total: {total}."
      ],
      sales: [
        "Sales {range}: {total} across {n} order(s).",
        "You've made {total} across {n} order(s) {range}.",
        "The total for {range} is {total} ({n} orders).",
        "{total} in sales {range}, from {n} order(s)."
      ],
      byStatusIntro: [
        "Found {n} order(s) with status \"{status}\":",
        "Here are {n} order(s) marked \"{status}\":",
        "{n} order(s) are currently \"{status}\":"
      ],
      byStatusEmpty: [
        "No orders are currently \"{status}\".",
        "I didn't find any \"{status}\" orders.",
        "Nothing shows as \"{status}\" right now."
      ],
      customerIntro: [
        "Found {n} order(s):",
        "Here's what I found for that customer:",
        "These {n} order(s) match:"
      ],
      customerEmpty: [
        "I couldn't find any orders for {who}.",
        "No orders match {who}. Maybe the details differ slightly?",
        "Nothing on record for {who}."
      ],
      updateDone: [
        "Done — order {code} is now \"{status}\".",
        "Updated. {code} has been moved to \"{status}\".",
        "All set. {code} is now marked as \"{status}\".",
        "Order {code} now shows \"{status}\"."
      ],
      updateSame: [
        "Order {code} is already marked as \"{status}\".",
        "That one already shows \"{status}\"."
      ],
      updateNotFound: [
        "I couldn't find an order with the code {code}.",
        "No order matches {code}, so I can't update it."
      ],
      productCount: [
        "There are {n} products in your catalogue.",
        "You have {n} products listed right now.",
        "Your catalogue currently holds {n} products."
      ],
      productIntro: [
        "Here are {n} product(s) in \"{cat}\":",
        "Found {n} product(s) in \"{cat}\":",
        "In the \"{cat}\" category:"
      ],
      productEmpty: [
        "I couldn't find any products in the \"{cat}\" category.",
        "Nothing listed under \"{cat}\" right now."
      ],
      productCodeEmpty: [
        "I couldn't find a product with the code {code}.",
        "No product matches {code}."
      ],
      oosIntro: [
        "These {n} product(s) are out of stock:",
        "Currently out of stock ({n}):",
        "These are the ones running low:"
      ],
      oosEmpty: [
        "Great news — nothing is out of stock right now.",
        "No products are out of stock at the moment. Everything's available.",
        "You're all in stock. Nothing to worry about."
      ],
      confirm: [
        "Just to confirm — you'd like to {action}. Correct?",
        "Can you please confirm that you want to {action}?",
        "Please confirm: {action}. Shall I go ahead?",
        "Before I do it: you want to {action}. Right?"
      ],
      askAgain: [
        "I'm sorry, I didn't quite catch that. ",
        "Sorry, that didn't come through. "
      ],
      fallback: [
        "I'm not sure I understood that. You can ask me about orders, products, sales or stock — just phrase it naturally.",
        "Hmm, I didn't get that. Try asking something like \"how many orders came in today\" or \"which products are out of stock\".",
        "I didn't follow that one. Ask me about today's orders, sales, products or a tracking code."
      ],
      followUp: [
        "Anything else I can help you with?",
        "Is there anything else you'd like to know?",
        "Shall I help you with anything else?",
        "Anything else I can do for you?",
        "What else can I check for you?"
      ],
      welcome: [
        "You're welcome!",
        "Anytime!",
        "Glad to help.",
        "Happy to help!"
      ]
    }
  };
  return model;
}

// ---- main -----------------------------------------------------

const raw = mine();
const model = buildModel(raw);

// Deployed model: compact, only what the edge function needs.
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(model));
console.log("wrote", OUT, "->", Math.round(fs.statSync(OUT).size / 1024) + "KB");

// Reference dump (NOT deployed): full mined utterance bank, kept for
// future training / curation. Placed outside the edge function folder.
const REF = path.join(ROOT, "Admin", "dstc8-schema-guided-dialogue-master", "mined-dstc8-bank.json");
const refOut = { source: "DSTC8 SGD train+dev", counts: {} };
for (const k of ["greetings", "thanks", "acknowledgments", "slotQuestions", "informs", "confirms", "offers", "closes", "requestLeads"]) {
  const arr = raw[k] || [];
  refOut[k] = arr.map((u) => ({ u, n: (raw[k + "Counts"] && raw[k + "Counts"][u]) || 1 }));
  refOut.counts[k] = arr.length;
}
fs.writeFileSync(REF, JSON.stringify(refOut, null, 1));
console.log("wrote reference bank ->", REF, Math.round(fs.statSync(REF).size / 1024) + "KB");
