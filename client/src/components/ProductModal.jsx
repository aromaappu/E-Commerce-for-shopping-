import { useEffect, useState } from "react";
import { parsePrice, formatINR, plainText, discountPercent } from "../lib/utils.js";

export default function ProductModal({ product, onClose, onAdd, onBuy }) {
  const [qty, setQty] = useState(1);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  if (!product) return null;
  const desc = plainText(product.description);
  const off = discountPercent(product.price, product.mrp);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal product-modal">
        <button className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <div className="pm-grid">
          <div className="pm-img">
            <img src={product.image_url || "/logo.png"} alt={product.name} />
          </div>
          <div className="pm-body">
            <h2>{product.name}</h2>
            <span className="code-chip">{product.product_code}</span>
            <div className="price-row pm-price">
              <span className="price">{formatINR(parsePrice(product.price))}</span>
              {off > 0 && <s>{formatINR(parsePrice(product.mrp))}</s>}
              {off > 0 && <em className="off-tag">{off}% OFF</em>}
            </div>

            {desc && (
              <p className={`pm-desc ${expanded ? "expanded" : ""}`}>
                {desc}
              </p>
            )}
            {desc.length > 120 && (
              <button className="link-btn" onClick={() => setExpanded((v) => !v)}>
                {expanded ? "Read less" : "Read more"}
              </button>
            )}

            {!product.out_of_stock && (
              <>
                <div className="qty-row">
                  <span>Quantity</span>
                  <div className="qty-stepper">
                    <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                    <b>{qty}</b>
                    <button onClick={() => setQty((q) => Math.min(99, q + 1))}>+</button>
                  </div>
                </div>

                <div className="pm-actions">
                  <button
                    className="btn btn-dark btn-lg"
                    onClick={() => onBuy({ ...product, qty })}
                  >
                    <i className="fab fa-whatsapp" /> Buy Now
                  </button>
                  <button className="btn btn-outline btn-lg" onClick={() => onAdd(product, qty)}>
                    <i className="fas fa-cart-plus" /> Add to Cart
                  </button>
                </div>
              </>
            )}

            <div className="trust-mini">
              <span><i className="fas fa-shield-halved" /> Secure checkout</span>
              <span><i className="fas fa-truck-fast" /> Fast delivery</span>
              <span><i className="fas fa-rotate-left" /> Easy support</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
