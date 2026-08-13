// End-to-end conversation test using the mock Supabase client.
// Run: deno run --allow-read --allow-env --import-map=import_map.test.json test-flow.ts
import { respond } from "./index.ts";

async function chat(session: string, message: string) {
  const res = await respond({ message, session_id: session });
  const body = await res.json();
  console.log(`  >> ${body.reply.replace(/\n/g, " / ")}`);
  return body;
}

const sid = "test-session-1";

console.log("=== CONVERSATION: natural multi-turn ===");
await chat(sid, "hi");
await chat(sid, "how many orders came in today?");
await chat(sid, "show me today's orders");
await chat(sid, "where is my order TM-ABC123");
await chat(sid, "how many delivered orders?");
await chat(sid, "what's today's sales total?");
await chat(sid, "which products are out of stock?");
await chat(sid, "thanks a lot");

console.log("\n=== CONVERSATION: transactional with confirmation ===");
const sid2 = "test-session-2";
await chat(sid2, "mark order TM-ABC123 as shipped");
await chat(sid2, "yes");
await chat(sid2, "change TM-ABC123 to delivered");
await chat(sid2, "no");

console.log("\n=== CONVERSATION: slot-by-slot clarification ===");
const sid3 = "test-session-3";
await chat(sid3, "how many delivered orders were there?");
await chat(sid3, "show me the orders for rahul");

console.log("\n=== CONVERSATION: fallback + small talk ===");
const sid4 = "test-session-4";
await chat(sid4, "what is the meaning of life?");
await chat(sid4, "ok sounds good");

console.log("\nDONE");
