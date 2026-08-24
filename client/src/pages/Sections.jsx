import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { categoryLabel } from "../lib/constants.js";

export default function Sections() {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    api("/categories")
      .then((d) =>
        setCategories([...(d.categories || [])].sort((a, b) => b.count - a.count))
      )
      .catch(() => {});
  }, []);

  return (
    <main className="page">
      <div className="page-head">
        <h1>All Categories</h1>
      </div>
      <div className="sections-grid">
        {categories.map((c) => (
          <Link key={c.slug} to={`/category/${c.slug}`} className="section-card">
            {c.image ? (
              <img src={c.image} alt={c.slug} loading="lazy" />
            ) : (
              <div className="cat-img-fallback tall">{categoryLabel(c.slug)}</div>
            )}
            <div>
              <h3>{categoryLabel(c.slug)}</h3>
              <span>{c.count} products</span>
            </div>
            <i className="fas fa-chevron-right" />
          </Link>
        ))}
        {categories.length === 0 && <p className="empty-note">Loading categories…</p>}
      </div>
    </main>
  );
}
