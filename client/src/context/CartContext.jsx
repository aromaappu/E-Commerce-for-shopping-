import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

const KEY = "tm_cart_v2";
const TTL = 6 * 60 * 60 * 1000;
const CartContext = createContext(null);

function readStored() {
  try {
    const arr = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(arr)) return [];
    const now = Date.now();
    return arr.filter((i) => now - (i.addedAt || now) < TTL);
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStored);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  useEffect(() => {
    const missing = items.filter((i) => !i.img && i.code);
    if (missing.length === 0) return;
    fetch("/api/products?limit=1000")
      .then((r) => r.json())
      .then((all) => {
        const products = all.products || all || [];
        const map = {};
        products.forEach((p) => { map[p.product_code || p.code] = p; });
        setItems((prev) =>
          prev.map((i) => {
            if (i.img || !map[i.code]) return i;
            const p = map[i.code];
            return { ...i, img: p.image_url || "", image_url: p.image_url || "" };
          })
        );
      })
      .catch(() => {});
  }, []);

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const add = useCallback(
    (product, qty = 1) => {
      setItems((prev) => {
        return [
          ...prev,
          {
            id: product.id,
            code: product.code + "_" + Date.now(),
            name: product.name,
            price: product.price,
            img: product.image_url || product.img || "",
            image_url: product.image_url || product.img || "",
            desc: product.desc,
            qty,
            addedAt: Date.now()
          }
        ];
      });
      showToast(`${product.name} added to cart`);
    },
    [showToast]
  );

  const remove = useCallback((code) => {
    setItems((prev) => prev.filter((i) => i.code !== code));
  }, []);

  const setQty = useCallback((code, qty) => {
    setItems((prev) =>
      prev.map((i) =>
        i.code === code ? { ...i, qty: Math.max(1, Math.min(Number(qty) || 1, 99)) } : i
      )
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, count, showToast }}>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
