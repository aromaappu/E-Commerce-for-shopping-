// Smoke test for the Trend Mart chat NLU + query layer (no network).
// Run: deno run --allow-read test-chat.ts
import {
  MODEL, extractAllSlots, detectIntent, askForSlot, parseYesNo,
  isGreeting, isThanks, isAcknowledgment, isHelp, helpExamples,
  interpretSlotAnswer, pick
} from "./nlu.ts";

function log(label: string, msg: string) {
  console.log(`\n[${label}]`);
  console.log("  user   : " + msg);
  const slots = extractAllSlots(msg);
  const det = detectIntent(msg, slots);
  console.log("  slots  : " + JSON.stringify(slots));
  console.log("  intent : " + det.intent + (det.matched ? "" : " (no match)"));
}

console.log("=== INTENT + SLOT DETECTION ===");
log("1", "how many orders came in today?");
log("2", "show me today's orders");
log("3", "where is my order TM-ABC123");
log("4", "track order tm abc123");
log("5", "how many delivered orders");
log("6", "how many orders were placed yesterday");
log("7", "what's today's sales total?");
log("8", "how much did we earn in the last 7 days");
log("9", "which products are out of stock?");
log("10", "how many products in shoes?");
log("11", "list all the smart watches");
log("12", "orders for phone 8592808194");
log("13", "show me orders for rahul sharma");
log("14", "mark order TM-ABC123 as shipped");
log("15", "change TM-ABC123 to delivered");
log("16", "I want to know how many orders came in this week");
log("17", "please find product code SC1LIK");
log("18", "whats the sale for last month");

console.log("\n=== SLOT ANSWER INTERPRETATION ===");
console.log("status from 'make it shipped'  ->", interpretSlotAnswer("make it shipped", "status"));
console.log("range from 'the last 7 days'   ->", interpretSlotAnswer("the last 7 days", "date_range"));
console.log("category from 'sneakers'?       ->", interpretSlotAnswer("shoe category", "category"));
console.log("tracking from 'TM-12ab34'       ->", interpretSlotAnswer("TM-12ab34", "tracking_code"));

console.log("\n=== SMALL TALK ===");
for (const m of ["hi", "hello there", "thanks a lot", "thank you", "ok sounds good", "help", "what can you do", "got it"]) {
  console.log(`  ${m.padEnd(18)} greet=${isGreeting(m)} thanks=${isThanks(m)} ack=${isAcknowledgment(m)} help=${isHelp(m)}`);
}

console.log("\n=== YES/NO ===");
for (const m of ["yes", "no", "yep please", "nope", "correct", "that's wrong", "go ahead", "cancel"]) {
  const y = parseYesNo(m);
  console.log(`  ${m.padEnd(14)} yes=${y.isYes} no=${y.isNo}`);
}

console.log("\n=== GENERATED PHRASING (variation sample) ===");
const set = new Set<string>();
for (let i = 0; i < 6; i++) set.add(askForSlot("status"));
console.log("status asks :", [...set].join(" | "));
console.log("count reply :", MODEL.responses.count.map((t) => t.replace("{n}", "5").replace("{range}", "today")).join(" | "));
console.log("\nhelpExamples:\n" + helpExamples());
