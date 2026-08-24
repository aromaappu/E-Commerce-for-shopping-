import { useEffect, useMemo, useState } from "react";
import { api } from "../../../lib/api.js";
import { useCart } from "../../../context/CartContext.jsx";
import ImageUpload from "../../../components/ImageUpload.jsx";
import { CATEGORY_META, categoryLabel } from "../../../lib/constants.js";

const EMPTY = {
  name: "",
  product_code: "",
  price: "",
  mrp: "",
  category: "misc",
  description: "",
  image_url: "",
  offer_percent: 0,
  sort_order: 0,
  out_of_stock: false
};

export default function ProductsTab() {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [editing, setEditing] = useState(null); // null | EMPTY | product
  const [loading, setLoading] = useState(true);
  const { showToast } = useCart();

  async function load() {
    setLoading(true);
    try {
      const d = await api("/admin/products");
      setProducts(d.products || []);
    } catch (e) {
      showToast(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products]
  );

  const filtered = products.filter(
    (p) =>
      (cat === "all" || p.category === cat) &&
      (!q ||
        p.name.toLowerCase().includes(q.toLowerCase()) ||
        p.product_code.toLowerCase().includes(q.toLowerCase()))
  );

  async function toggleStock(p) {
    try {
      await api(`/admin/products/${p.id}`, {
        method: "PUT",
        body: { ...p, out_of_stock: !p.out_of_stock }
      });
      setProducts((list) =>
        list.map((x) => (x.id === p.id ? { ...x, out_of_stock: !x.out_of_stock } : x))
      );
    } catch (e) {
      showToast(e.message);
    }
  }

  async function removeProduct(p) {
    if (!confirm(`Delete "${p.name}" (${p.product_code})?`)) return;
    try {
      await api(`/admin/products/${p.id}`, { method: "DELETE" });
      setProducts((list) => list.filter((x) => x.id !== p.id));
      showToast("Product deleted");
    } catch (e) {
      showToast(e.message);
    }
  }

  function saved(product, isNew) {
    setProducts((list) =>
      isNew ? [...list, product] : list.map((x) => (x.id === product.id ? product : x))
    );
    setEditing(null);
  }

  return (
    <div>
      <h2 className="tab-title">
        Products <span className="count-chip">{products.length}</span>
      </h2>

      <div className="toolbar">
        <input
          className="grow"
          placeholder="Search name or code…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {categoryLabel(c)} ({c})
            </option>
          ))}
        </select>
        <button className="btn btn-red" onClick={() => setEditing({ ...EMPTY })}>
          <i className="fas fa-plus" /> Add Product
        </button>
      </div>

      {loading ? (
        <div className="skeleton-card tall" />
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Image</th><th>Name</th><th>Code</th><th>Category</th>
              <th>Price</th><th>Stock</th><th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  <img className="thumb" src={p.image_url || "/logo.png"} alt="" />
                </td>
                <td><b>{p.name}</b></td>
                <td><span className="code-chip">{p.product_code}</span></td>
                <td>{categoryLabel(p.category)}</td>
                <td>
                  ₹{String(p.price).replace(/[^0-9.]/g, "")}
                  {p.mrp && <s className="muted"> / {String(p.mrp).replace(/[^0-9.]/g, "")}</s>}
                </td>
                <td>
                  <button
                    className={`stock-toggle ${p.out_of_stock ? "off" : ""}`}
                    onClick={() => toggleStock(p)}
                    title="Toggle stock"
                  >
                    {p.out_of_stock ? "Out" : "In"}
                  </button>
                </td>
                <td>
                  <button className="icon-btn" onClick={() => setEditing(p)} title="Edit">
                    <i className="fas fa-pen" />
                  </button>
                  <button className="icon-btn danger" onClick={() => removeProduct(p)} title="Delete">
                    <i className="fas fa-trash-can" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editing && (
        <ProductForm
          initial={editing}
          categories={[...new Set([...Object.keys(CATEGORY_META), ...categories])]}
          onClose={() => setEditing(null)}
          onSaved={saved}
        />
      )}
    </div>
  );
}

function ProductForm({ initial, categories, onClose, onSaved }) {
  const isNew = !initial.id;
  const [form, setForm] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const { showToast } = useCart();

  const set = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value
    }));

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required");
    if (!String(form.price).trim()) return setError("Price is required");
    setBusy(true);
    try {
      const res = isNew
        ? await api("/admin/products", { method: "POST", body: form })
        : await api(`/admin/products/${initial.id}`, { method: "PUT", body: form });
      showToast(isNew ? "Product added" : "Product updated");
      onSaved(res.product, isNew);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal form-modal" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={onClose}>&times;</button>
        <h3>{isNew ? "Add Product" : `Edit ${initial.name}`}</h3>

        <ImageUpload
          folder="products"
          value={form.image_url}
          onChange={(url) => setForm((f) => ({ ...f, image_url: url }))}
        />

        <label>Product Name *</label>
        <input value={form.name} onChange={set("name")} placeholder="e.g. CLASSIC DENIM SHIRT" />

        <div className="form-2col">
          <div>
            <label>Product Code {isNew && <small className="muted">(auto if empty)</small>}</label>
            <input value={form.product_code} onChange={set("product_code")} placeholder="TM123X" />
          </div>
          <div>
            <label>Category</label>
            <select value={form.category} onChange={set("category")}>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {categoryLabel(c)} ({c})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label>Price * (₹)</label>
            <input value={form.price} onChange={set("price")} placeholder="₹799/- or 799" />
          </div>
          <div>
            <label>MRP (₹)</label>
            <input value={form.mrp} onChange={set("mrp")} placeholder="₹999/-" />
          </div>
          <div>
            <label>Offer %</label>
            <input type="number" min="0" max="99" value={form.offer_percent} onChange={set("offer_percent")} />
          </div>
          <div>
            <label>Sort Order</label>
            <input type="number" value={form.sort_order} onChange={set("sort_order")} />
          </div>
        </div>

        <label>Description</label>
        <textarea rows={3} value={form.description} onChange={set("description")} />

        <label className="check-row">
          <input type="checkbox" checked={!!form.out_of_stock} onChange={set("out_of_stock")} />
          Out of stock (hide Buy buttons)
        </label>

        {error && <div className="login-error">{error}</div>}

        <button className="btn btn-red btn-lg btn-block" disabled={busy}>
          {busy ? <i className="fas fa-spinner fa-spin" /> : isNew ? "Add Product" : "Save Changes"}
        </button>
      </form>
    </div>
  );
}
