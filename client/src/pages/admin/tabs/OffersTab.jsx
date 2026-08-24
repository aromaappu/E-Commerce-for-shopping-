import { useEffect, useState } from "react";
import { api } from "../../../lib/api.js";
import { useCart } from "../../../context/CartContext.jsx";

export default function OffersTab() {
  const [offers, setOffers] = useState([]);
  const [draft, setDraft] = useState({ title: "", description: "" });
  const { showToast } = useCart();

  async function load() {
    try {
      const d = await api("/admin/offers");
      setOffers(d.offers || []);
    } catch (e) {
      showToast(e.message);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function add(e) {
    e.preventDefault();
    if (!draft.title.trim()) return;
    try {
      const res = await api("/admin/offers", { method: "POST", body: { ...draft, active: true } });
      setOffers((l) => [res.offer, ...l]);
      setDraft({ title: "", description: "" });
      showToast("Offer added");
    } catch (err) {
      showToast(err.message);
    }
  }

  async function toggle(offer) {
    try {
      await api(`/admin/offers/${offer.id}`, {
        method: "PUT",
        body: { ...offer, active: !offer.active }
      });
      setOffers((l) => l.map((o) => (o.id === offer.id ? { ...o, active: !o.active } : o)));
    } catch (e) {
      showToast(e.message);
    }
  }

  async function remove(offer) {
    if (!confirm(`Delete offer "${offer.title}"?`)) return;
    try {
      await api(`/admin/offers/${offer.id}`, { method: "DELETE" });
      setOffers((l) => l.filter((o) => o.id !== offer.id));
    } catch (e) {
      showToast(e.message);
    }
  }

  return (
    <div>
      <h2 className="tab-title">
        Announcement Offers <span className="count-chip">{offers.length}</span>
      </h2>
      <p className="muted">Scrolling announcement bar at the top of the storefront.</p>

      <form className="toolbar" onSubmit={add}>
        <input required placeholder="Offer title e.g. Diwali Sale 50% OFF" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
        <input className="grow" placeholder="Short description (optional)" value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
        <button className="btn btn-red"><i className="fas fa-plus" /> Add</button>
      </form>

      <table className="admin-table">
        <thead>
          <tr><th>Title</th><th>Description</th><th>Active</th><th></th></tr>
        </thead>
        <tbody>
          {offers.map((o) => (
            <tr key={o.id} className={o.active ? "" : "row-inactive"}>
              <td><b>{o.title}</b></td>
              <td className="muted">{o.description}</td>
              <td>
                <label className="switch">
                  <input type="checkbox" checked={!!o.active} onChange={() => toggle(o)} />
                  <span />
                </label>
              </td>
              <td>
                <button className="icon-btn danger" onClick={() => remove(o)}>
                  <i className="fas fa-trash-can" />
                </button>
              </td>
            </tr>
          ))}
          {offers.length === 0 && (
            <tr><td colSpan={4} className="muted">No offers yet.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
