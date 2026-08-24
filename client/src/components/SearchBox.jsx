import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { formatINR, parsePrice } from "../lib/utils.js";
import { categoryLabel } from "../lib/constants.js";

export default function SearchBox({ autoFocus = false }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [idx, setIdx] = useState(-1);
  const boxRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  /* clear when route changes */
  useEffect(() => {
    setQ("");
    setOpen(false);
    setItems([]);
  }, [location.pathname, location.search]);

  /* close on outside click */
  useEffect(() => {
    const onDown = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  /* debounced suggestions */
  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setItems([]);
      setOpen(false);
      return;
    }
    let alive = true;
    setLoading(true);
    const t = setTimeout(() => {
      api(`/products?q=${encodeURIComponent(term)}&limit=6`)
        .then((d) => {
          if (!alive) return;
          setItems(d.products || []);
          setIdx(-1);
          setOpen(true);
        })
        .catch(() => {})
        .finally(() => alive && setLoading(false));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [q]);

  function goSearch() {
    const term = q.trim();
    setOpen(false);
    navigate(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
  }

  function pick(p) {
    setOpen(false);
    navigate(`/product/${encodeURIComponent(p.product_code)}`);
  }

  function onKeyDown(e) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIdx((i) => (i + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIdx((i) => (i - 1 + items.length) % items.length);
    }
  }

  function onSubmit(e) {
    e.preventDefault();
    if (open && idx >= 0 && items[idx]) pick(items[idx]);
    else goSearch();
  }

  const showSug = open && q.trim().length >= 2;

  return (
    <div className="nav-search-wrap" ref={boxRef}>
      <form className="nav-search" onSubmit={onSubmit}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => items.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Search products…"
          aria-label="Search"
          autoComplete="off"
          autoFocus={autoFocus}
        />
        <button type="submit" aria-label="Search">
          {loading ? (
            <i className="fas fa-spinner fa-spin" />
          ) : (
            <i className="fas fa-magnifying-glass" />
          )}
        </button>
      </form>

      {showSug && (
        <div className="suggestions">
          {items.map((p, i) => (
            <div
              key={p.id}
              className={`sug-item ${i === idx ? "active" : ""}`}
              onMouseEnter={() => setIdx(i)}
              onClick={() => pick(p)}
            >
              <img src={p.image_url || "/logo.png"} alt="" loading="lazy" />
              <span className="sug-name">{p.name}</span>
              <span className="sug-cat">{categoryLabel(p.category)}</span>
              <span className="sug-price">{formatINR(parsePrice(p.price))}</span>
            </div>
          ))}
          {items.length === 0 && !loading && (
            <div className="sug-empty">No matches found</div>
          )}
          <div className="sug-footer" onClick={goSearch}>
            See all results for “{q.trim()}”
            <i className="fas fa-arrow-right" />
          </div>
        </div>
      )}
    </div>
  );
}
