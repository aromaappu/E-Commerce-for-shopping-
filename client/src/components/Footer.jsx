import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col">
          <h4>Trend Mart</h4>
          <p>Modern fashion &amp; lifestyle store.<br />Order easily through WhatsApp.</p>
        </div>
        <div className="footer-col">
          <h4>Quick Links</h4>
          <Link to="/">Home</Link>
          <Link to="/products">Shop All</Link>
          <Link to="/sections">Categories</Link>
          <Link to="/cart">My Cart</Link>
        </div>
        <div className="footer-col">
          <h4>Support</h4>
          <Link to="/track">Track Order</Link>
          <Link to="/about">Help Topics</Link>
          <a
            href="https://wa.me/9188384350"
            target="_blank"
            rel="noreferrer"
          >
            Chat on WhatsApp
          </a>
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} Trend Mart · All rights reserved ·{" "}
        <Link to="/admin" className="admin-link">
          Admin
        </Link>
      </div>
    </footer>
  );
}
