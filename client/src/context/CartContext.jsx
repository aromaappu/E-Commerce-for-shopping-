import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const KEY = "tm_cart_v2";
const TTL = 6 * 60 * 60 * 1000;
const CartContext = createContext(null);

function readStored() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(arr)) return [];
    const now = Date.now();
    return arr.filter((item) => now - (item.addedAt || now) < TTL)
      .map((item) => ({
        ...item,
        code: String(item.product_code || item.code || "").replace(/_\d{13}$/, ""),
        qty: Math.max(1, Math.min(Number(item.qty) || 1, 99))
      }))
      .filter((item) => item.code);
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStored);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)); } catch { /* private mode */ }
  }, [items]);

  // Reconcile saved carts with current products, including older temporary cart IDs.
  useEffect(() => {
    if (!items.length) return;
    let active = true;
    fetch("/api/products?limit=1000")
      .then((response) => {
        if (!response.ok) throw new Error("Cannot load catalogue");
        return response.json();
      })
      .then((data) => {
        if (!active) return;
        const products = data.products || [];
        const byId = new Map(products.map((p) => [String(p.id), p]));
        const byCode = new Map(products.map((p) => [p.product_code, p]));
        setItems((prev) => {
          const merged = new Map();
          for (const item of prev) {
            const product = byId.get(String(item.id)) || byCode.get(item.code);
            const code = product?.product_code || item.code;
            const updated = product ? {
              ...item, code, name: product.name, price: product.price,
              img: product.image_url || "", image_url: product.image_url || ""
            } : item;
            const existing = merged.get(code);
            merged.set(code, existing ? { ...existing, qty: Math.min(existing.qty + updated.qty, 99) } : updated);
          }
          return [...merged.values()];
        });
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const add = useCallback((product, qty = 1) => {
    const code = product.product_code || product.code;
    if (!code) {
      showToast("This product is currently unavailable");
      return;
    }
    const quantity = Math.max(1, Math.min(Number(qty) || 1, 99));
    setItems((prev) => {
      const matching = prev.find((item) => item.code === code || (product.id && item.id === product.id));
      if (matching) return prev.map((item) => item === matching
        ? { ...item, code, qty: Math.min(item.qty + quantity, 99) }
        : item
      );
      return [...prev, {
        id: product.id, code, name: product.name, price: product.price,
        img: product.image_url || product.img || "",
        image_url: product.image_url || product.img || "",
        desc: product.description || product.desc || "",
        qty: quantity, addedAt: Date.now()
      }];
    });
    showToast(`${product.name} added to cart`);
  }, [showToast]);

  const remove = useCallback((code) => setItems((prev) => prev.filter((i) => i.code !== code)), []);
  const setQty = useCallback((code, qty) => setItems((prev) => prev.map((item) =>
    item.code === code ? { ...item, qty: Math.max(1, Math.min(Number(qty) || 1, 99)) } : item
  )), []);
  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((n, item) => n + item.qty, 0);
  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, count, showToast }}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
