import { parsePrice, formatINR, discountPercent } from "../lib/utils.js";

export default function ProductCard({ product, onView, onAdd, onBuy }) {
  const off = discountPercent(product.price, product.mrp);
  const disabled = Boolean(product.out_of_stock);
  return (
    <article className={`product-card ${disabled ? "oos" : ""}`}>
      <button type="button" className="product-quick-view" onClick={() => onView(product)}
        aria-label={`View details for ${product.name}`}>
        <div className="product-img-wrap">
          <img src={product.image_url || "/logo.png"} alt={product.name} loading="lazy" decoding="async" />
          {disabled && <span className="oos-badge">Out of stock</span>}
          {off > 0 && <span className="off-badge">{off}% OFF</span>}
        </div>
        <div className="product-info">
          <h3 title={product.name}>{product.name}</h3>
          <div className="price-row">
            <span className="price">{formatINR(parsePrice(product.price))}</span>
            {off > 0 && product.mrp && <s className="mrp">{formatINR(parsePrice(product.mrp))}</s>}
          </div>
          <span className="product-view-hint">View details <i className="fas fa-arrow-right" aria-hidden="true" /></span>
        </div>
      </button>
      <div className="card-actions">
        <button type="button" className="btn btn-dark btn-sm" disabled={disabled}
          onClick={() => onBuy(product)} aria-label={`Buy ${product.name}`}>Buy Now</button>
        <button type="button" className="btn btn-outline btn-sm" disabled={disabled}
          onClick={() => onAdd(product)} aria-label={`Add ${product.name} to cart`}>
          <i className="fas fa-cart-plus" aria-hidden="true" /> Add
        </button>
      </div>
    </article>
  );
}
