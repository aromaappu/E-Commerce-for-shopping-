import { useEffect, useState } from "react";
import { api } from "../../../lib/api.js";
import { useCart } from "../../../context/CartContext.jsx";
import ImageUpload from "../../../components/ImageUpload.jsx";

export default function BannersTab() {
  const [banners, setBanners] = useState([]);
  const [adding, setAdding] = useState(null);
  const { showToast } = useCart();

  async function load() {
    try {
      const d = await api("/admin/banners");
      setBanners(d.banners || []);
    } catch (e) {
      showToast(e.message);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(banner, patch) {
    try {
      const res = await api(`/admin/banners/${banner.id}`, {
        method: "PUT",
        body: { ...banner, ...patch }
      });
      setBanners((list) => list.map((b) => (b.id === banner.id ? res.banner : b)));
      showToast("Banner saved");
    } catch (e) {
      showToast(e.message);
    }
  }

  async function remove(banner) {
    if (!confirm(`Delete banner "${banner.title}"?`)) return;
    try {
      await api(`/admin/banners/${banner.id}`, { method: "DELETE" });
      setBanners((list) => list.filter((b) => b.id !== banner.id));
      showToast("Banner deleted");
    } catch (e) {
      showToast(e.message);
    }
  }

  async function create(body) {
    try {
      const res = await api("/admin/banners", { method: "POST", body });
      setBanners((l) => [res.banner, ...l]);
      setAdding(null);
      showToast("Banner added");
    } catch (e) {
      showToast(e.message);
    }
  }

  return (
    <div>
      <h2 className="tab-title">
        Banners <span className="count-chip">{banners.length}</span>
      </h2>
      <p className="muted">Shown in the home carousel. Order by sort order.</p>

      <button className="btn btn-red" onClick={() => setAdding({ title: "", image_url: "", sort_order: (banners.at(-1)?.sort_order || 0) + 1, active: true })}>
        <i className="fas fa-plus" /> Add Banner
      </button>

      <div className="content-grid">
        {adding && (
          <ContentCardDraft
            draft={adding}
            onChange={setAdding}
            onSubmit={() => create(adding)}
            onCancel={() => setAdding(null)}
          />
        )}

        {banners.map((b) => (
          <div key={b.id} className={`content-card ${b.active ? "" : "inactive"}`}>
            <ImageUpload folder="banners" value={b.image_url} onChange={(url) => save(b, { image_url: url })} />
            <input value={b.title} onChange={(e) => setBanners((l) => l.map((x) => x.id === b.id ? { ...x, title: e.target.value } : x))} placeholder="Title" onBlur={(e) => e.target.value !== b.title && save(b, { title: e.target.value })} />
            <div className="card-row">
              <label className="check-row">
                <input type="checkbox" checked={!!b.active} onChange={(e) => save(b, { active: e.target.checked })} /> Active
              </label>
              <label className="sort-label">
                Sort
                <input type="number" defaultValue={b.sort_order} onBlur={(e) => Number(e.target.value) !== b.sort_order && save(b, { sort_order: Number(e.target.value) })} />
              </label>
              <button className="icon-btn danger" onClick={() => remove(b)}><i className="fas fa-trash-can" /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContentCardDraft({ draft, onChange, onSubmit, onCancel }) {
  return (
    <form
      className="content-card draft"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <ImageUpload folder="banners" value={draft.image_url} onChange={(url) => onChange({ ...draft, image_url: url })} />
      <input required placeholder="Title" value={draft.title} onChange={(e) => onChange({ ...draft, title: e.target.value })} />
      <button className="btn btn-red btn-sm">Save</button>
      <button type="button" className="btn btn-light btn-sm" onClick={onCancel}>
        Cancel
      </button>
    </form>
  );
}
