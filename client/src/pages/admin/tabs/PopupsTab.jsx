import { useEffect, useState } from "react";
import { api } from "../../../lib/api.js";
import { useCart } from "../../../context/CartContext.jsx";
import ImageUpload from "../../../components/ImageUpload.jsx";

function toLocalInput(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function PopupsTab() {
  const [popups, setPopups] = useState([]);
  const [adding, setAdding] = useState(null);
  const { showToast } = useCart();

  async function load() {
    try {
      const d = await api("/admin/popups");
      setPopups(d.popups || []);
    } catch (e) {
      showToast(e.message);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function save(popup, patch) {
    try {
      const res = await api(`/admin/popups/${popup.id}`, {
        method: "PUT",
        body: { ...popup, ...patch }
      });
      setPopups((l) => l.map((p) => (p.id === popup.id ? res.popup : p)));
      showToast("Popup saved");
    } catch (e) {
      showToast(e.message);
    }
  }

  async function remove(popup) {
    if (!confirm(`Delete popup "${popup.title}"?`)) return;
    try {
      await api(`/admin/popups/${popup.id}`, { method: "DELETE" });
      setPopups((l) => l.filter((p) => p.id !== popup.id));
      showToast("Popup deleted");
    } catch (e) {
      showToast(e.message);
    }
  }

  async function create(body) {
    try {
      const res = await api("/admin/popups", { method: "POST", body });
      setPopups((l) => [res.popup, ...l]);
      setAdding(null);
      showToast("Popup added");
    } catch (e) {
      showToast(e.message);
    }
  }

  return (
    <div>
      <h2 className="tab-title">
        Festival Popups <span className="count-chip">{popups.length}</span>
      </h2>
      <p className="muted">Shown once per visit during the scheduled period.</p>

      <button
        className="btn btn-red"
        onClick={() =>
          setAdding({ title: "", link: "", image_url: "", active: true, start_date: null, end_date: null })
        }
      >
        <i className="fas fa-plus" /> Add Popup
      </button>

      <div className="content-grid">
        {adding && (
          <form
            className="content-card draft"
            onSubmit={(e) => {
              e.preventDefault();
              create(adding);
            }}
          >
            <ImageUpload folder="popups" value={adding.image_url} onChange={(url) => setAdding({ ...adding, image_url: url })} />
            <input required placeholder="Title" value={adding.title} onChange={(e) => setAdding({ ...adding, title: e.target.value })} />
            <input placeholder="Link (optional)" value={adding.link} onChange={(e) => setAdding({ ...adding, link: e.target.value })} />
            <label className="date-label">Start</label>
            <input type="datetime-local" onChange={(e) => setAdding({ ...adding, start_date: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            <label className="date-label">End</label>
            <input type="datetime-local" onChange={(e) => setAdding({ ...adding, end_date: e.target.value ? new Date(e.target.value).toISOString() : null })} />
            <button className="btn btn-red btn-sm">Save</button>
            <button type="button" className="btn btn-light btn-sm" onClick={() => setAdding(null)}>
              Cancel
            </button>
          </form>
        )}

        {popups.map((p) => (
          <div key={p.id} className={`content-card ${p.active ? "" : "inactive"}`}>
            <ImageUpload folder="popups" value={p.image_url} onChange={(url) => save(p, { image_url: url })} />
            <input
              value={p.title}
              onChange={(e) => setPopups((l) => l.map((x) => (x.id === p.id ? { ...x, title: e.target.value } : x)))}
              onBlur={(e) => e.target.value !== p.title && save(p, { title: e.target.value })}
              placeholder="Title"
            />
            <input
              className="small"
              placeholder="Link (optional)"
              defaultValue={p.link}
              onBlur={(e) => e.target.value !== (p.link || "") && save(p, { link: e.target.value })}
            />
            <div className="card-row dates">
              <span>Start</span>
              <input
                type="datetime-local"
                defaultValue={toLocalInput(p.start_date)}
                onChange={(e) => save(p, { start_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
              <span>End</span>
              <input
                type="datetime-local"
                defaultValue={toLocalInput(p.end_date)}
                onChange={(e) => save(p, { end_date: e.target.value ? new Date(e.target.value).toISOString() : null })}
              />
            </div>
            <div className="card-row">
              <label className="check-row">
                <input type="checkbox" checked={!!p.active} onChange={(e) => save(p, { active: e.target.checked })} /> Active
              </label>
              <button className="icon-btn danger" onClick={() => remove(p)}>
                <i className="fas fa-trash-can" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
