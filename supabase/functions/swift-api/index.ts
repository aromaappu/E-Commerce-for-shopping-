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

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  SPEC, MODEL, pick, pickFrom, extractAllSlots, detectIntent, interpretSlotAnswer,
  isGreeting, isThanks, isAcknowledgment, isHelp, parseYesNo, askForSlot, helpExamples, norm, fuzzyHas
} from "./nlu.ts";
import type { IntentName, Slots, SlotName } from "./nlu.ts";
import { handleIntent, handleStoreLookup } from "./queries.ts";
import type { StoreLookupArgs } from "./queries.ts";
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { freshState, loadState, remember, saveState } from "./state.ts";
import type { DialogueState } from "./state.ts";

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
    // Status/info questions about that same order.
    if (!/\b(update|change|mark|set|move)\b/.test(tNorm) &&
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

if (import.meta.main) {
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
}

export { respond };
