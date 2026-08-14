#!/usr/bin/env node
// ============================================================
// Build a single-file chat-support function for pasting into the
// Supabase Dashboard (Edge Functions > New function), for users
// who don't use the CLI.
//
//   node build-single-file.js
//   -> chat-support-dashboard.ts
// ============================================================

const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "edge");
const read = (f) => fs.readFileSync(path.join(DIR, f), "utf8");

const model = fs.readFileSync(path.join(DIR, "nlp-model.json"), "utf8").trim();
const nlu = read("nlu.ts");
const queries = read("queries.ts");
const state = read("state.ts");
const index = read("index.ts");

// Strip import/export statements, keeping the code in one scope.
// Handles single-line and multi-line import statements (including the
// `with { type: "json" }` clause) so no dangling `} from "./x"` remains.
function stripModule(src) {
  return src
    .replace(/^import\b[\s\S]*?from\s+["'][^"']+["']\s*(?:with\s*\{[^}]*\})?\s*;?\s*/gm, "")
    .split("\n")
    .filter((l) => !/^\s*export\s*\{/.test(l))
    .join("\n");
}

// nlu: drop type-only import, strip export keywords, and remove the
// MODEL declaration line entirely (MODEL is embedded once at the top).
let nluBody = stripModule(nlu)
  .replace(/\bexport\b /g, "")
  .replace(/const MODEL: PhraseModel = modelData as PhraseModel;/m, "");

// queries + state: drop type imports, relax SupabaseClient typing.
let queriesBody = stripModule(queries)
  .replace(/\bexport\b /g, "")
  .replace(/\bSupabaseClient\b/g, "any")
  .replace(/\.reduce\(\(s, o\)/g, ".reduce((s: number, o: any)")
  .replace(/\.map\(\(p\) =>/g, ".map((p: any) =>");
let stateBody = stripModule(state)
  .replace(/\bexport\b /g, "")
  .replace(/\bSupabaseClient\b/g, "any");

// index: strip ALL local imports, keep esm.sh import at the very top,
// unwrap Deno.serve, drop exports.
let indexBody = index
  .replace(/^import \{ createClient \} from "https:\/\/esm\.sh\/@supabase\/supabase-js@2";\s*/m, "")
  .replace(/^export \{ respond \};\s*/m, "");
indexBody = stripModule(indexBody);
indexBody = indexBody
  .replace(/if \(import\.meta\.main\) \{\s*(\r?\n)/, "")
  .replace(/\r?\n(\s*)\}\s*$/, "");

const out = `// ============================================================
// Trend Mart - Chat Support (SINGLE-FILE version)
// Paste into: Supabase Dashboard > Edge Functions >
//            New function > name: chat-support > Deploy
// The phrase model is embedded (mined from DSTC8).
// ============================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---- 1. PHRASE MODEL (mined from DSTC8) ----
${"const MODEL: any = " + model + ";"}

// ---- 2. NLU ENGINE ----
${nluBody}

// ---- 3. DB QUERY LAYER ----
${queriesBody}

// ---- 4. STATE TRACKER ----
${stateBody}

// ---- 5. HTTP SERVER ----
${indexBody}
`;

fs.writeFileSync(path.join(__dirname, "chat-support-dashboard.ts"), out);
console.log("wrote chat-support-dashboard.ts ->", Math.round(fs.statSync(path.join(__dirname, "chat-support-dashboard.ts")).size / 1024) + "KB");
