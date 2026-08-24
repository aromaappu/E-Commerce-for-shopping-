import { parsePrice, formatINR, discountPercent } from "../lib/utils.js";

export default function ProductCard({ product, onView, onAdd, onBuy }) {
  const off = discountPercent(product.price, product.mrp);
  return (
    <div className={`product-card ${product.out_of_stock ? "oos" : ""}`} onClick={() => onView(product)}>
      <div className="product-img-wrap">
        <img src={product.image_url || "/logo.png"} alt={product.name} loading="lazy" />
        {product.out_of_stock && <span className="oos-badge">Out of Stock</span>}
        {off > 0 && <span className="off-badge">-{off}%</span>}
      </div>
      <div className="product-info">
        <h3 title={product.name}>{product.name}</h3>
        <div className="price-row">
          <span className="price">{formatINR(parsePrice(product.price))}</span>
          {off > 0 && product.mrp && <s className="mrp">{formatINR(parsePrice(product.mrp))}</s>}
        </div>
        <div className="card-actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-dark btn-sm" disabled={product.out_of_stock} onClick={() => onBuy(product)}>
            Buy Now
          </button>
          <button
            className="btn btn-outline btn-sm"
            disabled={product.out_of_stock}
            onClick={() => onAdd(product)}
          >
            <i className="fas fa-cart-plus" /> Add
          </button>
        </div>
      </div>
    </div>
  );
}
