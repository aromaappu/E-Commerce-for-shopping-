import { useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import OrderModal from "../components/OrderModal.jsx";
import OrderSuccessModal from "../components/OrderSuccessModal.jsx";
import { parsePrice, formatINR } from "../lib/utils.js";

export default function CartPage() {
  const { items, setQty, remove, clear } = useCart();
  const [buying, setBuying] = useState(false);
  const [success, setSuccess] = useState(null);

  const total = items.reduce((t, i) => t + parsePrice(i.price) * i.qty, 0);

  if (items.length === 0 && !success) {
    return (
      <main className="page">
        <div className="empty-cart">
          <i className="fas fa-bag-shopping" />
          <h2>Your cart is empty</h2>
          <p>Add products and order them together on WhatsApp.</p>
          <Link to="/products" className="btn btn-red">
            Start Shopping
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="page-head">
        <h1>My Cart</h1>
        <span className="count-chip">{items.length} items</span>
      </div>

      <div className="cart-layout">
        <div className="cart-list">
          {items.map((it) => (
            <div key={it.code} className="cart-row">
              <img src={it.img || it.image_url || "/logo.png"} alt={it.name} />
              <div className="cart-info">
                <b>{it.name}</b>
                <span className="code-chip">{it.code}</span>
                <span className="price">{formatINR(parsePrice(it.price))}</span>
              </div>
              <div className="qty-stepper">
                <button onClick={() => setQty(it.code, it.qty - 1)}>−</button>
                <b>{it.qty}</b>
                <button onClick={() => setQty(it.code, it.qty + 1)}>+</button>
              </div>
              <b className="line-total">{formatINR(parsePrice(it.price) * it.qty)}</b>
              <button className="icon-btn danger" onClick={() => remove(it.code)} aria-label="Remove">
                <i className="fas fa-trash-can" />
              </button>
            </div>
          ))}
          <button className="link-btn" onClick={clear}>
            Clear cart
          </button>
        </div>

        <aside className="cart-summary">
          <h3>Order Summary</h3>
          <div className="sum-row">
            <span>Subtotal</span>
            <b>{formatINR(total)}</b>
          </div>
          <div className="sum-row">
            <span>Delivery</span>
            <span className="muted">Confirmed on WhatsApp</span>
          </div>
          <div className="sum-row total">
            <span>Total</span>
            <b>{formatINR(total)}</b>
          </div>
          <button className="btn btn-whatsapp btn-lg btn-block" onClick={() => setBuying(true)}>
            <i className="fab fa-whatsapp" /> Place Order on WhatsApp
          </button>
          <p className="om-note">You'll confirm the final details in the WhatsApp chat.</p>
        </aside>
      </div>

      {buying && (
        <OrderModal
          items={items}
          onClose={() => setBuying(false)}
          onSuccess={(r) => {
            clear();
            setBuying(false);
            setSuccess(r);
          }}
        />
      )}
      {success && <OrderSuccessModal result={success} onClose={() => setSuccess(null)} />}
    </main>
  );
}
