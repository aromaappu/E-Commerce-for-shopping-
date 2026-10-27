<div align="center">

# 🛍️ Trend Mart

**Full-stack e-commerce store with WhatsApp-powered ordering and real-time order tracking**

[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://expressjs.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vite](https://img.shields.io/badge/Vite-Build-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

*Storefront · Admin Dashboard · REST API · JWT Auth · AI Chat Assistant*

</div>

---

## 📖 About The Project

Trend Mart is a production-style e-commerce platform for a fashion & lifestyle store.
Customers browse products, place orders that are saved to a database **and** handed off to
WhatsApp with a pre-filled message, then track delivery through a live status timeline.
Store owners manage everything from a secure admin dashboard with sales analytics.

> **Architecture note:** MERN-style stack where Supabase PostgreSQL replaces MongoDB.

### 🎯 Key Highlights

- 🔐 **Security-first design** — service-role key lives only on the server; browsers get read-only public APIs; admin routes are protected by JWT
- ⚡ **Single API layer** — every feature (products → analytics) flows through one validated Express REST API
- 📱 **Mobile-first storefront** — responsive React SPA with search-as-you-type suggestions and relevance ranking
- 🤖 **AI assistant** — natural-language questions over live store data, proxied server-side
- 💬 **Zero-friction checkout** — order saved + WhatsApp deep-link opened in one tap, tracking code generated instantly

---

## ✨ Features

### Customer Storefront

| | |
|---|---|
| 🏠 **Home** | Banner carousel, category strip, offer marquee, scheduled festival popups |
| 🔎 **Search** | Live autocomplete dropdown, multi-word & synonym matching (`watch` → analog + smart), relevance-ranked results |
| 🛒 **Cart & Buy Now** | localStorage cart (6h TTL), quantity stepper, single-item or bulk WhatsApp ordering |
| 📦 **Order Tracking** | Tracking-code lookup with full status-history timeline |
| 📄 **Product Pages** | Deep-linkable detail pages (`/product/:code`) with similar-product recommendations |

### Admin Dashboard (`/admin`)

| | |
|---|---|
| 📊 **Reports** | Revenue, orders today, pending/delivered, 14-day bar chart, status donut, top products |
| 📦 **Orders** | Search/filter, detail view, status updates with automatic history, delete |
| 🏷️ **Products** | Full CRUD, image upload to Supabase Storage, stock toggle, categories |
| 🖼️ **Content** | Banners & festival popups with image upload + start/end scheduling, announcement offers |
| 🤖 **AI Chat** | Ask *"Which orders were placed today?"*, *"top selling products?"* against live data |

---

## 🏗️ Architecture

```
┌─────────────────────────┐        ┌──────────────────────────┐
│   React SPA (Vite)      │  HTTP  │   Express REST API       │
│  storefront + /admin    │ ─────► │  JWT auth · validation   │
└─────────────────────────┘ /api/* │  uploads · rate-limiting │
                                   └───────────┬──────────────┘
                                               │ service key (server-only)
                                   ┌───────────▼──────────────┐
                                   │      Supabase            │
                                   │  PostgreSQL · Storage    │
                                   │  Auth-free RLS lockdown  │
                                   └──────────────────────────┘
```

**Project structure**

```
├── client/                 # React 18 + Vite + React Router
│   └── src/
│       ├── pages/          # Home · Shop · Product · Cart · Track · admin/*
│       ├── components/     # Navbar, modals, search box, chat widget
│       ├── context/        # Cart · Auth · Config providers
│       └── lib/            # API client & helpers
├── server/
│   └── src/
│       ├── routes/public.js   # products · search · orders · track · content
│       ├── routes/admin.js    # login · CRUD · upload · reports
│       ├── middleware/auth.js # JWT verification
│       └── sql/harden-rls.sql # locks tables to service_role only
└── Index/, Admin/          # legacy v1 static site (kept for reference)
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router 6 |
| Backend | Node.js, Express 4 |
| Database | Supabase PostgreSQL (818+ products live) |
| Storage | Supabase Storage (product/banner images) |
| Auth | JSON Web Tokens (admin) + timing-safe credential check |
| Security | Rate limiting, input sanitization, CORS allow-list, RLS hardening script |
| AI | Supabase Edge Function (LLM tool-calling) proxied via `/api/chat` |

---

## 🚀 Getting Started

```bash
# 1. Install all dependencies
npm run install-all

# 2. Configure the server
cp server/.env.example server/.env    # fill in your values

# 3. Run API (:5000) + client (:5173) together
npm run dev
```

| URL | What |
|---|---|
| http://localhost:5173 | Storefront |
| http://localhost:5173/admin | Admin dashboard |

**Production**

```bash
npm run build && npm start   # Express serves the built SPA on one port
```

---

## 🔒 Security Model

1. Browsers never see the Supabase service key — it exists only in `server/.env`
2. Public endpoints are strictly read-only; writes go through validated routes
3. Admin login issues a signed JWT; passwords compared with `timingSafeEqual`
4. `sql/harden-rls.sql` removes anonymous table access so only the server can read/write
5. Sensitive endpoints are rate-limited (login: 8/min, orders: 10/min, chat: 25/min)

---

## 📸 Screenshots

> Add screenshots here before sharing: home page, product page, track page, admin reports.

---

## 👤 Author

**Appu Aromal** — [GitHub](https://github.com/aromaappu)

---

<div align="center">
<sub>Built as a real-world full-stack project · Active development</sub>
</div>
