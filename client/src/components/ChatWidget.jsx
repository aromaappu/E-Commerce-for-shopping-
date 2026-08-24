import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";

const SESSION_KEY = "tm_chat_session";
const QUICK = ["How to order?", "Track my order", "Today's offers", "Delivery info"];

function getSessionId() {
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() || `s-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function ChatWidget({ title = "Trend Mart Support", sessionPrefix = "" }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hi! 👋 Ask me anything about products, orders or delivery." }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  async function send(text) {
    const message = (text ?? input).trim();
    if (!message || busy) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: message }]);
    setBusy(true);
    try {
      const res = await api("/chat", {
        method: "POST",
        body: { message, session_id: sessionPrefix + getSessionId() }
      });
      setMessages((m) => [...m, { role: "bot", text: res.reply || "Sorry, I could not answer that." }]);
    } catch {
      setMessages((m) => [...m, { role: "bot", text: "Connection problem. Please try again." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button className="chat-fab" onClick={() => setOpen((v) => !v)} aria-label="Chat">
        <i className={`fab fa-whatsapp ${open ? "hidden" : ""}`} />
        <i className={`fas fa-xmark ${open ? "" : "hidden"}`} />
      </button>

      {open && (
        <div className="chat-panel">
          <div className="chat-head">
            <i className="fas fa-robot" />
            <b>{title}</b>
            <span className="online-dot" />
          </div>

          <div className="chat-list" ref={listRef}>
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>
                {m.text}
              </div>
            ))}
            {busy && (
              <div className="chat-msg bot typing">
                <span /><span /><span />
              </div>
            )}
          </div>

          <div className="chat-quick">
            {QUICK.map((q) => (
              <button key={q} onClick={() => send(q)}>
                {q}
              </button>
            ))}
          </div>

          <form
            className="chat-input"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message…"
            />
            <button type="submit" disabled={busy} aria-label="Send">
              <i className="fas fa-paper-plane" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
