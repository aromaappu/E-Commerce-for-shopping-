import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { formatINR, parsePrice } from "../lib/utils.js";
import { STATUS_COLORS } from "../lib/constants.js";

export default function TrackPage() {
  const [params, setParams] = useSearchParams();
  const [code, setCode] = useState(params.get("code") || "");
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function lookup(codeValue) {
    const value = (codeValue ?? code).trim().toUpperCase();
    if (!value) return;
    setBusy(true);
    setError("");
    try {
      const res = await api(`/orders/track/${encodeURIComponent(value)}`);
      setOrder(res.order);
    } catch (e) {
      setOrder(null);
      setError(e.message || "Order not found");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const initial = params.get("code");
    if (initial) lookup(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="page">
      <div className="page-head">
        <h1>Track Order</h1>
      </div>

      <form
        className="track-form"
        onSubmit={(e) => {
          e.preventDefault();
          setParams(code.trim() ? { code: code.trim().toUpperCase() } : {});
          lookup();
        }}
      >
        <input
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          placeholder="Enter tracking code e.g. TM-ABC123"
        />
        <button className="btn btn-red" disabled={busy}>
          {busy ? <i className="fas fa-spinner fa-spin" /> : "Track"}
        </button>
      </form>

      {error && <p className="empty-note error">{error}</p>}

      {order && (
        <div className="track-result">
          <div className="track-top">
            <div>
              <span className="muted">Tracking Code</span>
              <h2>{order.tracking_code}</h2>
              <p className="muted">
                Placed on{" "}
                {new Date(order.order_time || order.created_at).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short"
                })}
              </p>
            </div>
            <span
              className="status-pill"
              style={{ background: STATUS_COLORS[order.status] || "#64748b" }}
            >
              {order.status}
            </span>
          </div>

          <Timeline history={order.status_history || []} current={order.status} />

          <div className="track-items">
            {(order.items || []).map((it, i) => (
              <div key={i} className="cart-row slim">
                <img src={it.img || "/logo.png"} alt="" />
                <div className="cart-info">
                  <b>{it.name}</b>
                  <span className="code-chip">{it.code}</span>
                </div>
                <div className="line-total">
                  ×{it.qty} · {formatINR(parsePrice(it.price) * it.qty)}
                </div>
              </div>
            ))}
            <div className="sum-row total">
              <span>Total</span>
              <b>{formatINR(order.total)}</b>
            </div>
          </div>

          <p className="om-note">Need help? Message us on WhatsApp with your tracking code.</p>
        </div>
      )}
    </main>
  );
}

function Timeline({ history, current }) {
  const steps = history.length ? history : [{ status: current, at: new Date().toISOString() }];
  return (
    <ol className="timeline">
      {steps.map((s, i) => {
        const isLast = i === steps.length - 1;
        const done = s.status !== "Cancelled";
        return (
          <li key={i} className={`${done ? "done" : "cancelled"} ${isLast ? "last" : ""}`}>
            <span className="dot" />
            <div>
              <b>{s.status}</b>
              <small>{new Date(s.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
