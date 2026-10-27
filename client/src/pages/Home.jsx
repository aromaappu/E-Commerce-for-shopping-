import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { useCart } from "../context/CartContext.jsx";
import { useConfig } from "../context/ConfigContext.jsx";
import OfferBar from "../components/OfferBar.jsx";
import ProductCard from "../components/ProductCard.jsx";
import ProductModal from "../components/ProductModal.jsx";
import PopupModal from "../components/PopupModal.jsx";
import { HOME_TOP_CATEGORIES, categoryLabel } from "../lib/constants.js";
import { buyNowWhatsApp } from "../lib/utils.js";

const PAGE = 16;

export default function Home() {
  const [content, setContent] = useState({ offers: [], banners: [], popups: [] });
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [viewing, setViewing] = useState(null);
  const navigate = useNavigate();
  const { add } = useCart();
  const { whatsappNumber } = useConfig();

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      api("/content"),
      api("/categories"),
      api("/products?limit=" + PAGE)
    ]).then(([contentResult, categoryResult, productResult]) => {
      if (!active) return;
      if (contentResult.status === "fulfilled") setContent(contentResult.value);
      if (categoryResult.status === "fulfilled") {
        const value = categoryResult.value;
        setCategories(Array.isArray(value.categories) ? value.categories : []);
      }
      if (productResult.status === "fulfilled") {
        const value = productResult.value;
        setProducts(Array.isArray(value.products) ? value.products : []);
        setTotal(Number(value.total) || 0);
        setLoadError("");
      } else {
        setLoadError("Products could not load. Please refresh and try again.");
      }
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const loadMore = useCallback(async () => {
    setLoading(true);
    try {
      const more = await api(`/products?limit=${PAGE}&offset=${products.length}`);
      setProducts((p) => [...p, ...(more.products || [])]);
      setLoadError("");
    } catch {
      setLoadError("Could not load more products. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [products.length]);

  // first unseen popup this session
  const popup = (content.popups || []).find((p) => {
    try {
      return !sessionStorage.getItem(`tm_popup_${p.id}`);
    } catch {
      return true;
    }
  });

  const catImage = (slug) => categories.find((c) => c.slug === slug)?.image;
  const topCats = HOME_TOP_CATEGORIES.map((slug) => ({
    slug,
    image: catImage(slug),
    count: categories.find((c) => c.slug === slug)?.count
  }));

  return (
    <main className="page">
      <OfferBar offers={content.offers} />
      <BannerCarousel banners={content.banners} />

      <section className="section">
        <div className="section-head">
          <h2>Top Categories</h2>
          <Link to="/sections" className="see-all">
            See all <i className="fas fa-chevron-right" />
          </Link>
        </div>
        <div className="cat-strip">
          {topCats.map((c) => (
            <Link key={c.slug} to={`/category/${c.slug}`} className="cat-tile">
              {c.image ? (
                <img src={c.image} alt={c.slug} loading="lazy" />
              ) : (
                <div className="cat-img-fallback">{categoryLabel(c.slug)}</div>
              )}
              <span>{categoryLabel(c.slug)}</span>
            </Link>
          ))}
        </div>
      </section>

      <div className="trust-row">
        <div><i className="fas fa-bolt" /> Fast Delivery</div>
        <div><i className="fas fa-tags" /> Affordable Price</div>
        <div><i className="fas fa-earth-asia" /> All India Delivery</div>
      </div>

      <section className="section">
        <div className="section-head">
          <h2>What are you looking for?</h2>
        </div>

        {loadError && <p className="empty-note error" role="alert">{loadError}</p>}
        {loading && products.length === 0 ? (
          <GridSkeleton count={8} />
        ) : products.length === 0 ? (
          <p className="empty-note">No products yet. Admin can add products from the dashboard.</p>
        ) : (
          <>
            <div className="product-grid">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onView={setViewing}
                  onAdd={(prod) => add(prod)}
                  onBuy={(prod) => buyNowWhatsApp(prod, whatsappNumber)}
                />
              ))}
            </div>
            {products.length < total && (
              <button className="btn btn-outline load-more" onClick={loadMore} disabled={loading}>
                {loading ? <i className="fas fa-spinner fa-spin" /> : "Load More"}
              </button>
            )}
          </>
        )}
      </section>

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
            buyNowWhatsApp(p, whatsappNumber);
          }}
        />
      )}

      {!loading && popup && <PopupModal popup={popup} onClose={() => setContent((c) => ({ ...c, popups: [] }))} />}

      <button className="cart-fab" onClick={() => navigate("/cart")} aria-label="Open cart">
        <i className="fas fa-bag-shopping" />
      </button>
    </main>
  );
}

function BannerCarousel({ banners }) {
  const [idx, setIdx] = useState(0);
  const list = (banners || []).filter((b) => b.image_url);

  useEffect(() => {
    if (list.length < 2) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % list.length), 4000);
    return () => clearInterval(t);
  }, [list.length]);

  if (list.length === 0) {
    return (
      <div className="hero-fallback">
        <h1>New Season. New Styles.</h1>
        <p>Bags · Shoes · Watches · Fashion — order in seconds via WhatsApp</p>
        <a href="#shop" className="btn btn-red">Start Shopping</a>
      </div>
    );
  }

  return (
    <div className="carousel">
      {list.map((b, i) => (
        <img
          key={b.id}
          src={b.image_url}
          alt={b.title}
          className={i === idx ? "active" : ""}
          loading={i === 0 ? "eager" : "lazy"}
        />
      ))}
      {list.length > 1 && (
        <div className="carousel-dots">
          {list.map((_, i) => (
            <button key={i} className={i === idx ? "on" : ""} onClick={() => setIdx(i)} aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
      )}
    </div>
  );
}

export function GridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton-card" />
      ))}
    </div>
  );
}
