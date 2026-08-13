# Trend Mart Chat Bot

All chatbot code lives in this folder.

## Folder structure

```
chatbot/
├── chat-support-dashboard.ts   ← THE deploy file (paste into Supabase Edge Functions)
├── build-single-file.js        ← builds the deploy file (run: node build-single-file.js)
├── edge/                       ← bot source code (reference copy)
│   ├── index.ts                ← HTTP server / conversation logic
│   ├── nlu.ts                  ← brain: understands questions (intents + slots)
│   ├── queries.ts              ← talks to the database (orders, products)
│   ├── state.ts                ← remembers conversation context
│   └── nlp-model.json          ← phrase model (mined from DSTC8) — the bot's training data
├── widget/
│   └── chat-widget.js          ← the chat bubble code shown on the website
├── database/
│   └── trend-mart-database.sql ← database tables (orders, products, chat_sessions)
├── models/                     ← PUT YOUR DOWNLOADED LLM FILE HERE (see models/README.txt)
└── server/                     ← your own model server (see server/README.txt)
```

## How the bot works now

Customer types a message in the chat bubble
  → chat-widget.js sends it to the Supabase Edge Function
  → nlu.ts figures out the question (orders / products / sales / status)
  → queries.ts reads the answer from the Supabase database
  → bot replies naturally

All of this runs on Supabase Edge + your database. No external AI.

Questions the bot can answer (all from YOUR database):
orders, today's orders, today's products / new arrivals, order tracking,
order status, sales totals, product counts, products by category, product
by code, out-of-stock products, orders by customer phone.

## Optional: AI answers for everything else

Set a secret `LLM_API_KEY` on the chat-support edge function (e.g. a free
Groq key from console.groq.com). Then any question the rules don't cover
("name of the customer", "send customer details", small talk, anything)
gets a natural answer from the AI instead of the fallback message.
Optional: `LLM_MODEL` (default `llama-3.3-70b-versatile`) and
`LLM_BASE_URL` (default Groq; any OpenAI-compatible API works).

## Deploy steps (when code changes)

1. Edit code in `edge/`
2. Run: `node build-single-file.js`  → updates `chat-support-dashboard.ts`
3. Open Supabase Dashboard → Edge Functions → swift-api → Deploy
4. Paste the content of `chat-support-dashboard.ts`, click Deploy
