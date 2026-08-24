import { useEffect, useState } from "react";
import { api } from "../../../lib/api.js";
import { formatINR } from "../../../lib/utils.js";

export default function ReportsTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    api("/admin/reports")
      .then((d) => alive && setData(d))
      .catch((e) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, []);

  if (error) return <p className="empty-note error">{error}</p>;
  if (!data) return <div className="skeleton-card tall" />;

  const s = data.summary;

  return (
    <div>
      <h2 className="tab-title">Reports &amp; Analytics</h2>

      <div className="stat-grid">
        <StatCard icon="fa-box" label="Total Orders" value={s.totalOrders} tone="blue" />
        <StatCard icon="fa-indian-rupee-sign" label="Revenue" value={formatINR(s.revenue)} tone="green" />
        <StatCard icon="fa-clock" label="Pending" value={s.pending} tone="amber" />
        <StatCard icon="fa-circle-check" label="Delivered" value={s.delivered} tone="green" />
        <StatCard icon="fa-calendar-day" label="Today's Orders" value={s.todayOrders} sub={formatINR(s.todayRevenue)} tone="purple" />
        <StatCard icon="fa-shirt" label="Products" value={s.productCount} sub={`${s.outOfStock} out of stock`} tone="dark" />
      </div>

      <div className="chart-row">
        <div className="panel">
          <h3>Daily Orders (last 14 days)</h3>
          <Bars series={data.dailySeries} />
        </div>
        <div className="panel">
          <h3>Status Breakdown</h3>
          <Donut data={data.statusBreakdown} />
        </div>
      </div>

      <div className="panel">
        <h3>Top Products</h3>
        <table className="admin-table slim-table">
          <thead>
            <tr><th>#</th><th>Product</th><th>Code</th><th>Qty Ordered</th></tr>
          </thead>
          <tbody>
            {(data.topProducts || []).map((p, i) => (
              <tr key={p.code}>
                <td>{i + 1}</td>
                <td>{p.name}</td>
                <td><span className="code-chip">{p.code}</span></td>
                <td><b>{p.qty}</b></td>
              </tr>
            ))}
            {(data.topProducts || []).length === 0 && (
              <tr><td colSpan={4} className="muted">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, sub, tone }) {
  return (
    <div className={`stat-card tone-${tone}`}>
      <i className={`fas ${icon}`} />
      <div>
        <span>{label}</span>
        <b>{value}</b>
        {sub && <small>{sub}</small>}
      </div>
    </div>
  );
}

function Bars({ series }) {
  if (!series?.length) return null;
  const max = Math.max(1, ...series.map((d) => d.orders));
  return (
    <div className="bars">
      {series.map((d) => (
        <div key={d.date} className="bar-col" title={`${d.date}: ${d.orders} orders · ${formatINR(d.revenue)}`}>
          <span>{d.orders || ""}</span>
          <div className="bar" style={{ height: `${Math.max(4, (d.orders / max) * 120)}px` }} />
          <small>{d.date.slice(5)}</small>
        </div>
      ))}
    </div>
  );
}

const DONUT_COLORS = ["#2563eb", "#16a34a", "#f59e0b", "#7c3aed", "#0ea5e9", "#dc2626", "#64748b"];

function Donut({ data = [] }) {
  const total = data.reduce((t, d) => t + d.count, 0);
  if (!total) return <p className="muted">No orders yet.</p>;

  let acc = 0;
  const segs = data.map((d, i) => {
    const start = (acc / total) * 100;
    acc += d.count;
    const end = (acc / total) * 100;
    return `${DONUT_COLORS[i % DONUT_COLORS.length]} ${start}% ${end}%`;
  });

  return (
    <div className="donut-wrap">
      <div className="donut" style={{ background: `conic-gradient(${segs.join(",")})` }}>
        <div className="donut-hole">
          <b>{total}</b>
          <small>orders</small>
        </div>
      </div>
      <ul className="legend">
        {data.map((d, i) => (
          <li key={d.status}>
            <span className="swatch" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            {d.status} — <b>{d.count}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
