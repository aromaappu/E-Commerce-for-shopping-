import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import SearchBox from "./SearchBox.jsx";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const { count } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
        <Link to="/" className="brand">
          <img src="/logo.png" alt="Trend Mart" />
          <span>Trend&nbsp;Mart</span>
        </Link>

        <SearchBox />

        <nav className="nav-icons">
          <Link to="/track" title="Track order">
            <i className="fas fa-truck-fast" />
          </Link>
          <Link to="/cart" title="Cart" className="cart-link">
            <i className="fas fa-bag-shopping" />
            {count > 0 && <span className="badge">{count > 99 ? "99+" : count}</span>}
          </Link>
        </nav>
      </header>

      <div className="mobile-search">
        <SearchBox />
      </div>
    </>
  );
}
