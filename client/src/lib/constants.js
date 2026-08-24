export const CATEGORY_META = {
  chappal: { label: "Chappals" },
  crocs: { label: "Crocs" },
  shoe: { label: "Shoes" },
  pant: { label: "Pants" },
  shirt: { label: "Shirts" },
  tshirt: { label: "T-Shirts" },
  combo: { label: "Combo Dresses" },
  tcombo: { label: "Printed Combo Tees" },
  school: { label: "School Bags" },
  side: { label: "Side Bags" },
  travel: { label: "Travel Bags" },
  analog: { label: "Analog Watches" },
  smart: { label: "Smart Watches" },
  smc: { label: "Smart Watch Combos" },
  airpod: { label: "Airpods" },
  headphone: { label: "Headphones" },
  misc: { label: "Others" }
};

export const HOME_TOP_CATEGORIES = [
  "chappal",
  "shoe",
  "crocs",
  "pant",
  "smart",
  "school"
];

export function categoryLabel(slug) {
  return CATEGORY_META[slug]?.label || slug.replace(/^\w/, (c) => c.toUpperCase());
}

export const STATUS_PRESETS = [
  "Order Placed",
  "Confirmed",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
  "Cancelled"
];

export const STATUS_COLORS = {
  "Order Placed": "#64748b",
  Confirmed: "#2563eb",
  Packed: "#7c3aed",
  Shipped: "#0ea5e9",
  "Out for Delivery": "#f59e0b",
  Delivered: "#16a34a",
  Cancelled: "#dc2626"
};
