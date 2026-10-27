import { Link } from "react-router-dom";
import { useConfig } from "../context/ConfigContext.jsx";

export default function Footer() {
  const { storeName, whatsappNumber } = useConfig();
  const number = String(whatsappNumber || "").replace(/\D/g, "");
  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-col">
          <h4>{storeName || "Trend Mart"}</h4>
          <p>Fashion and lifestyle essentials, made easy to discover and order.</p>
        </div>
        <div className="footer-col">
          <h4>Explore</h4>
          <Link to="/">Home</Link>
          <Link to="/products">Shop all</Link>
          <Link to="/sections">Categories</Link>
          <Link to="/cart">Shopping cart</Link>
        </div>
        <div className="footer-col">
          <h4>Customer care</h4>
          <Link to="/track">Track an order</Link>
          <Link to="/about">Help &amp; information</Link>
          {/^\d{10,15}$/.test(number) && (
            <a href={`https://wa.me/${number}`} target="_blank" rel="noopener noreferrer">Contact on WhatsApp</a>
          )}
        </div>
      </div>
      <div className="footer-bottom">
        © {new Date().getFullYear()} {storeName || "Trend Mart"} · All rights reserved ·{" "}
        <Link to="/admin" className="admin-link">Admin</Link>
      </div>
    </footer>
  );
}
