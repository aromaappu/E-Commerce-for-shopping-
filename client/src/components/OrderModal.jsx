import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";
import { useConfig } from "../context/ConfigContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { buildOrderMessage, openWhatsApp, parsePrice } from "../lib/utils.js";

/**
 * Checkout modal: collects customer details, saves the order through the API,
 * then opens WhatsApp with the pre-filled order message.
 */
export default function OrderModal({ items, onClose, onSuccess }) {
  const { whatsappNumber } = useConfig();
  const { showToast } = useCart();
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Pre-open a blank tab inside the click gesture so browsers don't block it.
  const winRef = useRef(null);
  const preOpen = () => {
    try {
      winRef.current = window.open("", "_blank");
    } catch {
      /* ignore */
    }
  };

  function validate() {
    const e = {};
    if (!form.name.trim()) e.name = "Please enter your name";
    if (!/^[0-9+\-\s]{10,15}$/.test(form.phone.trim()))
      e.phone = "Enter a valid WhatsApp number";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit(e) {
    e.preventDefault();
    if (!validate() || busy) return;
    setBusy(true);
    preOpen();

    try {
      const total = items.reduce((t, it) => t + parsePrice(it.price) * it.qty, 0);
      const payloadItems = items.map((it) => ({
        id: it.id ?? null,
        code: it.code,
        name: it.name,
        price: it.price,
        img: typeof it.img === "string" && it.img.startsWith("http") ? it.img : "",
        qty: it.qty
      }));

      const res = await api("/orders", {
        method: "POST",
        body: {
          customer_name: form.name.trim(),
          customer_phone: form.phone.trim(),
          customer_address: form.address.trim(),
          items: payloadItems,
          total
        }
      });

      const code = res.order?.tracking_code || "";
      const message = buildOrderMessage({
        items: payloadItems.map((it) => ({ ...it, desc: "" })),
        customer: form,
        trackingCode: code,
        total
      });
      openWhatsApp(whatsappNumber, message, winRef.current);

      onSuccess({
        trackingCode: code,
        total,
        firstItem: items[0]
      });
    } catch (err) {
      if (winRef.current) winRef.current.close();
      setBusy(false);
      showToast(err.message || "Could not place order. Please try again.");
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <form className="modal order-modal" onSubmit={submit}>
        <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
          &times;
        </button>
        <h3>Confirm Your Order</h3>

        <div className="om-summary">
          {items.slice(0, 3).map((it) => (
            <img key={it.code} src={it.img || "/logo.png"} alt={it.name} />
          ))}
          <span>
            {items.length === 1 ? items[0].name : `${items.length} products`} ·{" "}
            <b>₹{items.reduce((t, i) => t + parsePrice(i.price) * i.qty, 0).toLocaleString("en-IN")}</b>
          </span>
        </div>

        <label>Your Name *</label>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Enter your name"
          autoFocus
        />
        {errors.name && <small className="field-error">{errors.name}</small>}

        <label>WhatsApp Number *</label>
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Enter WhatsApp number"
          inputMode="tel"
        />
        {errors.phone && <small className="field-error">{errors.phone}</small>}

        <label>Delivery Address</label>
        <textarea
          rows={2}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="House / street / city (optional)"
        />

        <button className="btn btn-whatsapp btn-lg btn-block" disabled={busy}>
          {busy ? (
            <>
              <i className="fas fa-spinner fa-spin" /> Placing order…
            </>
          ) : (
            <>
              <i className="fab fa-whatsapp" /> Confirm &amp; Send on WhatsApp
            </>
          )}
        </button>
        <p className="om-note">Your order is confirmed after you send the WhatsApp message.</p>
      </form>
    </div>
  );
}
