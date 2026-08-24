import { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api.js";
import { useCart } from "../../../context/CartContext.jsx";
import { formatINR, parsePrice } from "../../../lib/utils.js";
import { STATUS_PRESETS, STATUS_COLORS } from "../../../lib/constants.js";

export default function OrdersTab() {
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState(STATUS_PRESETS);
  const [status, setStatus] = useState("all");
  const [q, setQ] = useState("");
  const [viewing, setViewing] = useState(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useCart();

  async function load() {
    setLoading(true);
    try {
      const d = await api(`/admin/orders?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`);
      setOrders(d.orders || []);
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api("/admin/statuses").then((d) => setStatuses(d.statuses || STATUS_PRESETS)).catch(() => {});
  }, []);

  useEffect(() => {
    const t = setTimeout(load, q ? 350 : 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, q]);

  async function changeStatus(order, newStatus) {
    try {
      const res = await api(`/admin/orders/${order.id}/status`, {
        method: "PUT",
        body: { status: newStatus }
      });
      setOrders((list) => list.map((o) => (o.id === order.id ? res.order : o)));
      showToast(`Order ${order.tracking_code} → ${newStatus}`);
    } catch (e) {
      showToast(e.message);
    }
  }

  async function removeOrder(order) {
    if (!confirm(`Delete order ${order.tracking_code}? This cannot be undone.`)) return;
    try {
      await api(`/admin/orders/${order.id}`, { method: "DELETE" });
      setOrders((list) => list.filter((o) => o.id !== order.id));
      showToast("Order deleted");
    } catch (e) {
      showToast(e.message);
    }
  }

  const counts = useMemo(() => orders.length, [orders]);

  return (
    <div>
      <h2 className="tab-title">Orders <span className="count-chip">{counts}</span></h2>

      <div className="toolbar">
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {statuses.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <input
          className="grow"
          placeholder="Search tracking code / name / phone…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-outline" onClick={load}>
          <i className="fas fa-rotate" />
        </button>
      </div>

      {loading ? (
        <div className="skeleton-card tall" />
      ) : orders.length === 0 ? (
        <p className="empty-note">No orders match.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id}>
                <td><span className="code-chip">{o.tracking_code}</span></td>
                <td>
                  <b>{o.customer_name}</b>
                  <br />
                  <small className="muted">{o.customer_phone}</small>
                </td>
                <td>{(o.items || []).reduce((n, i) => n + i.qty, 0)}</td>
                <td>{formatINR(o.total)}</td>
                <td>
                  <select
                    className="status-select"
                    style={{ borderColor: STATUS_COLORS[o.status] || "#ccc" }}
                    value={o.status}
                    onChange={(e) => changeStatus(o, e.target.value)}
                  >
                    {[...new Set([o.status, ...statuses])].map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <small>
                    {new Date(o.created_at).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                  </small>
                </td>
                <td>
                  <button className="icon-btn" onClick={() => setViewing(o)} title="View">
                    <i className="fas fa-eye" />
                  </button>
                  <button className="icon-btn danger" onClick={() => removeOrder(o)} title="Delete">
                    <i className="fas fa-trash-can" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {viewing && <OrderDetailsModal order={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}

function OrderDetailsModal({ order, onClose }) {
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <button className="modal-close" onClick={onClose}>&times;</button>
        <h3>Order {order.tracking_code}</h3>
        <span className="status-pill" style={{ background: STATUS_COLORS[order.status] || "#64748b" }}>
          {order.status}
        </span>

        <div className="detail-grid">
          <div><span className="muted">Customer</span><b>{order.customer_name}</b></div>
          <div><span className="muted">Phone</span><b>{order.customer_phone}</b></div>
          <div className="full"><span className="muted">Address</span><b>{order.customer_address || "—"}</b></div>
        </div>

        <table className="admin-table slim-table">
          <thead>
            <tr><th>Item</th><th>Code</th><th>Price</th><th>Qty</th><th>Total</th></tr>
          </thead>
          <tbody>
            {(order.items || []).map((it, i) => (
              <tr key={i}>
                <td>{it.name}</td>
                <td>{it.code}</td>
                <td>{formatINR(parsePrice(it.price))}</td>
                <td>{it.qty}</td>
                <td>{formatINR(parsePrice(it.price) * it.qty)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="total-row">
              <td colSpan={4}>Order Total</td>
              <td><b>{formatINR(order.total)}</b></td>
            </tr>
          </tfoot>
        </table>

        <h4>Status History</h4>
        <ol className="timeline compact">
          {(order.status_history || []).map((s, i) => (
            <li key={i} className={s.status === "Cancelled" ? "cancelled" : "done last"}>
              <span className="dot" />
              <div>
                <b>{s.status}</b>
                <small>{new Date(s.at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</small>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
