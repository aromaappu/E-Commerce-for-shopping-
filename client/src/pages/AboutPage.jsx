import { Link } from "react-router-dom";
import { useConfig } from "../context/ConfigContext.jsx";

export default function AboutPage() {
  const { whatsappNumber, storeName } = useConfig();
  const wa = `https://wa.me/${whatsappNumber}`;

  return (
    <main className="page">
      <div className="page-head">
        <h1>Help Topics</h1>
      </div>

      <div className="help-grid">
        <div className="help-card">
          <i className="fas fa-cart-shopping" />
          <h3>How to Order</h3>
          <ol>
            <li>Browse products and tap <b>Buy Now</b> (or add to cart).</li>
            <li>Enter your name &amp; WhatsApp number.</li>
            <li>The app opens WhatsApp with your order pre-filled — just press send.</li>
            <li>You'll receive a tracking code instantly.</li>
          </ol>
        </div>

        <div className="help-card">
          <i className="fas fa-truck-fast" />
          <h3>Delivery</h3>
          <p>
            We deliver across India. Delivery charges and timelines are confirmed in the
            WhatsApp chat based on your location.
          </p>
        </div>

        <div className="help-card">
          <i className="fas fa-magnifying-glass-location" />
          <h3>Track Your Order</h3>
          <p>
            Use the tracking code (e.g. TM-ABC123) on the{" "}
            <Link to="/track">Track Order</Link> page to see live status updates.
          </p>
        </div>

        <div className="help-card">
          <i className="fas fa-rotate-left" />
          <h3>Returns &amp; Support</h3>
          <p>
            Wrong or damaged item? Message us on WhatsApp within 48 hours with your
            tracking code and we'll make it right.
          </p>
        </div>

        <div className="help-card contact">
          <i className="fab fa-whatsapp" />
          <h3>Contact Us</h3>
          <p>Customer support is available on WhatsApp.</p>
          <a className="btn btn-whatsapp" href={wa} target="_blank" rel="noreferrer">
            Chat with {storeName}
          </a>
        </div>
      </div>
    </main>
  );
}
