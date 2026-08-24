import { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { ConfigProvider } from "./context/ConfigContext.jsx";
import { CartProvider } from "./context/CartContext.jsx";
import { AuthProvider } from "./context/AuthContext.jsx";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import RequireAuth from "./components/Guards.jsx";
import Home from "./pages/Home.jsx";
import ProductsPage from "./pages/ProductsPage.jsx";
import ProductPage from "./pages/ProductPage.jsx";
import Sections from "./pages/Sections.jsx";
import CartPage from "./pages/CartPage.jsx";
import TrackPage from "./pages/TrackPage.jsx";
import AboutPage from "./pages/AboutPage.jsx";
import AdminLogin from "./pages/admin/AdminLogin.jsx";
import Dashboard from "./pages/admin/Dashboard.jsx";

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

export default function App() {
  return (
    <ConfigProvider>
      <CartProvider>
        <AuthProvider>
          <ScrollToTop />
          <Navbar />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/product/:code" element={<ProductPage />} />
            <Route path="/category/:slug" element={<ProductsPage />} />
            <Route path="/sections" element={<Sections />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/track" element={<TrackPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route path="*" element={<Home />} />
          </Routes>
          <Footer />
        </AuthProvider>
      </CartProvider>
    </ConfigProvider>
  );
}
