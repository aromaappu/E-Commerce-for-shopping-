// ============================================================
// Trend Mart - Dialogue state tracker
// Persists conversation state per session in the chat_sessions
// table so the bot remembers context between turns (active
// intent, filled slots, pending confirmations).
// ============================================================

import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import type { IntentName, Slots } from "./nlu.ts";

export interface DialogueState {
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

export function freshState(): DialogueState {
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
export function remember(state: DialogueState, userText: string, assistantText: string, max: number = 20): void {
  state.history = [...(state.history || []), { role: "user", text: userText }, { role: "assistant", text: assistantText }]
    .slice(-max);
}

export async function loadState(sb: SupabaseClient, sessionId: string): Promise<DialogueState> {
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

export async function saveState(
  sb: SupabaseClient,
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
