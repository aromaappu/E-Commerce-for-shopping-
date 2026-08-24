import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import ReportsTab from "./tabs/ReportsTab.jsx";
import OrdersTab from "./tabs/OrdersTab.jsx";
import ProductsTab from "./tabs/ProductsTab.jsx";
import BannersTab from "./tabs/BannersTab.jsx";
import PopupsTab from "./tabs/PopupsTab.jsx";
import OffersTab from "./tabs/OffersTab.jsx";
import ChatTab from "./tabs/ChatTab.jsx";

const TABS = [
  { key: "reports", label: "Reports", icon: "fa-chart-line" },
  { key: "orders", label: "Orders", icon: "fa-box" },
  { key: "products", label: "Products", icon: "fa-shirt" },
  { key: "banners", label: "Banners", icon: "fa-image" },
  { key: "popups", label: "Popups", icon: "fa-star" },
  { key: "offers", label: "Offers", icon: "fa-bullhorn" },
  { key: "chat", label: "AI Chat", icon: "fa-robot" }
];

export default function Dashboard() {
  const [tab, setTab] = useState("reports");
  const { logout } = useAuth();

  return (
    <main className="page admin-page">
      <div className="admin-shell">
        <aside className="admin-side">
          <Link to="/" className="brand small">
            <img src="/logo.png" alt="" />
            <span>Trend Mart</span>
          </Link>
          <nav>
            {TABS.map((t) => (
              <button
                key={t.key}
                className={tab === t.key ? "active" : ""}
                onClick={() => setTab(t.key)}
              >
                <i className={`fas ${t.icon}`} /> {t.label}
              </button>
            ))}
          </nav>
          <button className="logout-btn" onClick={logout}>
            <i className="fas fa-arrow-right-from-bracket" /> Logout
          </button>
        </aside>

        <section className="admin-content">
          {tab === "reports" && <ReportsTab />}
          {tab === "orders" && <OrdersTab />}
          {tab === "products" && <ProductsTab />}
          {tab === "banners" && <BannersTab />}
          {tab === "popups" && <PopupsTab />}
          {tab === "offers" && <OffersTab />}
          {tab === "chat" && <ChatTab />}
        </section>
      </div>
    </main>
  );
}
