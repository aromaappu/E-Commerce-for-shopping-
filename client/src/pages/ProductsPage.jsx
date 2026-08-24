import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useCart } from "../context/CartContext.jsx";
import ProductCard from "../components/ProductCard.jsx";
import ProductModal from "../components/ProductModal.jsx";
import OrderModal from "../components/OrderModal.jsx";
import OrderSuccessModal from "../components/OrderSuccessModal.jsx";
import { categoryLabel } from "../lib/constants.js";
import { parsePrice } from "../lib/utils.js";

const SORTS = {
  featured: "Featured",
  price_asc: "Price: Low to High",
  price_desc: "Price: High to Low",
  name: "Name A–Z"
};

export default function ProductsPage() {
  const { slug } = useParams();
  const [params] = useSearchParams();
  const q = params.get("q") || "";
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState("featured");
  const [shown, setShown] = useState(16);
  const [viewing, setViewing] = useState(null);
  const [buying, setBuying] = useState(null);
  const [success, setSuccess] = useState(null);
  const { add } = useCart();

  useEffect(() => {
    setLoading(true);
    setShown(16);
    const url = slug
      ? `/products?category=${encodeURIComponent(slug)}`
      : `/products?q=${encodeURIComponent(q)}`;
    api(url)
      .then((d) => setAll(d.products || []))
      .catch(() => setAll([]))
      .finally(() => setLoading(false));
  }, [slug, q]);

  const sorted = useMemo(() => {
    const arr = [...all];
    if (sort === "price_asc") arr.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    if (sort === "price_desc") arr.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    if (sort === "name") arr.sort((a, b) => String(a.name).localeCompare(String(b.name)));
    return arr;
  }, [all, sort]);

  const title = q ? `Search: “${q}”` : slug ? categoryLabel(slug) : "All Products";

  return (
    <main className="page">
      <div className="page-head">
        <h1>{title}</h1>
        <span className="count-chip">{all.length} items</span>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="sort-select">
          {Object.entries(SORTS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="product-grid">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton-card" />
          ))}
        </div>
      ) : sorted.length === 0 ? (
        <p className="empty-note">
          No products found{q && ` for “${q}”`}. Try a different search or{" "}
          <a href="/sections">browse categories</a>.
        </p>
      ) : (
        <>
          <div className="product-grid">
            {sorted.slice(0, shown).map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onView={setViewing}
                onAdd={(prod) => add(prod)}
                onBuy={(prod) => setBuying([{ ...prod, qty: 1 }])}
              />
            ))}
          </div>
          {shown < sorted.length && (
            <button className="btn btn-outline load-more" onClick={() => setShown((s) => s + 16)}>
              Load More ({sorted.length - shown} left)
            </button>
          )}
        </>
      )}

      {viewing && (
        <ProductModal
          product={viewing}
          onClose={() => setViewing(null)}
          onAdd={(p, qty) => {
            add(p, qty);
            setViewing(null);
          }}
          onBuy={(p) => {
            setViewing(null);
            setBuying([p]);
          }}
        />
      )}
      {buying && (
        <OrderModal
          items={buying}
          onClose={() => setBuying(null)}
          onSuccess={(r) => {
            setBuying(null);
            setSuccess(r);
          }}
        />
      )}
      {success && <OrderSuccessModal result={success} onClose={() => setSuccess(null)} />}
    </main>
  );
}
