import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useCart } from "../context/CartContext.jsx";
import SearchBox from "./SearchBox.jsx";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const { count } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className={`navbar ${scrolled ? "navbar-scrolled" : ""}`}>
        <Link to="/" className="brand" aria-label="Trend Mart home">
          <img src="/logo.png" alt="" />
          <span>Trend&nbsp;Mart</span>
        </Link>
        <nav className="nav-main" aria-label="Shop navigation">
          <NavLink to="/products">Shop</NavLink>
          <NavLink to="/sections">Categories</NavLink>
        </nav>
        <SearchBox />
        <nav className="nav-icons" aria-label="Order tools">
          <Link to="/track" aria-label="Track an order" title="Track order">
            <i className="fas fa-truck-fast" aria-hidden="true" />
          </Link>
          <Link to="/cart" aria-label={`Shopping cart, ${count} items`} title="Shopping cart" className="cart-link">
            <i className="fas fa-bag-shopping" aria-hidden="true" />
            {count > 0 && <span className="badge">{count > 99 ? "99+" : count}</span>}
          </Link>
        </nav>
      </header>
      <div className="mobile-search">
        <SearchBox />
      </div>
      {!pathname.startsWith("/admin") && (
        <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
          <NavLink to="/" end><i className="fas fa-house" aria-hidden="true" /><span>Home</span></NavLink>
          <NavLink to="/products"><i className="fas fa-store" aria-hidden="true" /><span>Shop</span></NavLink>
          <NavLink to="/track"><i className="fas fa-box" aria-hidden="true" /><span>Track</span></NavLink>
          <NavLink to="/cart" className="mobile-cart-nav">
            <i className="fas fa-bag-shopping" aria-hidden="true" />
            {count > 0 && <span className="mobile-cart-count">{count > 99 ? "99+" : count}</span>}
            <span>Cart</span>
          </NavLink>
        </nav>
      )}
    </>
  );
}
