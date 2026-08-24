import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { useCart } from "../context/CartContext.jsx";
import ProductCard from "../components/ProductCard.jsx";
import OrderModal from "../components/OrderModal.jsx";
import OrderSuccessModal from "../components/OrderSuccessModal.jsx";
import { categoryLabel } from "../lib/constants.js";
import {
  parsePrice,
  formatINR,
  plainText,
  discountPercent
} from "../lib/utils.js";

export default function ProductPage() {
  const { code } = useParams();
  const [product, setProduct] = useState(null);
  const [similar, setSimilar] = useState([]);
  const [error, setError] = useState("");
  const [buying, setBuying] = useState(null);
  const [success, setSuccess] = useState(null);
  const [qty, setQty] = useState(1);
  const { add, showToast } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    setProduct(null);
    setSimilar([]);
    setError("");
    setQty(1);

    api(`/products/${encodeURIComponent(code)}`)
      .then(async ({ product: p }) => {
        if (!alive) return;
        setProduct(p);
        try {
          const d = await api(`/products?category=${encodeURIComponent(p.category)}`);
          if (alive) {
            setSimilar(
              (d.products || []).filter((x) => x.id !== p.id).slice(0, 8)
            );
          }
        } catch {
          /* similar products are optional */
        }
      })
      .catch((e) => alive && setError(e.message));

    return () => {
      alive = false;
    };
  }, [code]);

  if (error) {
    return (
      <main className="page">
        <div className="empty-cart">
          <i className="fas fa-box-open" />
          <h2>Product not found</h2>
          <p>{error}</p>
          <Link to="/products" className="btn btn-red">
            Browse all products
          </Link>
        </div>
      </main>
    );
  }

  if (!product) {
    return (
      <main className="page">
        <div className="skeleton-card tall" style={{ maxWidth: 780, margin: "30px auto" }} />
      </main>
    );
  }

  const desc = plainText(product.description);
  const off = discountPercent(product.price, product.mrp);
  const oos = product.out_of_stock;

  return (
    <main className="page">
      <div className="crumbs">
        <Link to="/">Home</Link> <i className="fas fa-chevron-right" />
        <Link to={`/category/${product.category}`}>{categoryLabel(product.category)}</Link>
        <i className="fas fa-chevron-right" />
        <span>{product.name}</span>
      </div>

      <section className="detail-wrap">
        <div className="pm-img detail-img">
          <img src={product.image_url || "/logo.png"} alt={product.name} />
        </div>
        <div className="pm-body">
          <span className="code-chip">{product.product_code}</span>
          <h1>{product.name}</h1>

          <div className="price-row pm-price">
            <span className="price">{formatINR(parsePrice(product.price))}</span>
            {off > 0 && <s>{formatINR(parsePrice(product.mrp))}</s>}
            {off > 0 && <em className="off-tag">{off}% OFF</em>}
          </div>

          {oos && (
            <div className="oos-note">
              <i className="fas fa-circle-exclamation" /> Currently out of stock — check back soon.
            </div>
          )}

          {!oos && (
            <>
              <div className="qty-row">
                <span><b>Quantity</b></span>
                <div className="qty-stepper">
                  <button onClick={() => setQty((v) => Math.max(1, v - 1))}>−</button>
                  <b>{qty}</b>
                  <button onClick={() => setQty((v) => Math.min(99, v + 1))}>+</button>
                </div>
                <b className="muted">= {formatINR(parsePrice(product.price) * qty)}</b>
              </div>

              <div className="pm-actions">
                <button className="btn btn-dark btn-lg" onClick={() => setBuying([{ ...product, qty }])}>
                  <i className="fab fa-whatsapp" /> Buy Now
                </button>
                <button
                  className="btn btn-outline btn-lg"
                  onClick={() => {
                    add(product, qty);
                    showToast("Added to cart");
                  }}
                >
                  <i className="fas fa-cart-plus" /> Add to Cart
                </button>
              </div>
            </>
          )}

          {desc && (
            <>
              <h3 className="desc-title">Description</h3>
              <p className="pm-desc expanded">{desc}</p>
            </>
          )}

          <div className="trust-mini">
            <span><i className="fas fa-shield-halved" /> Secure checkout</span>
            <span><i className="fas fa-truck-fast" /> All India delivery</span>
            <span><i className="fas fa-rotate-left" /> Easy support</span>
          </div>
        </div>
      </section>

      {similar.length > 0 && (
        <section className="section">
          <div className="section-head">
            <h2>Similar Products</h2>
          </div>
          <div className="product-grid">
            {similar.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                onView={(x) => navigate(`/product/${encodeURIComponent(x.product_code)}`)}
                onAdd={(x) => add(x)}
                onBuy={(x) => setBuying([{ ...x, qty: 1 }])}
              />
            ))}
          </div>
        </section>
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
