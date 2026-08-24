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

  const showToast = useCallback((msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const add = useCallback(
    (product, qty = 1) => {
      setItems((prev) => {
        const found = prev.find((i) => i.id === product.id || i.code === product.code);
        if (found) {
          return prev.map((i) =>
            i === found ? { ...i, qty: i.qty + qty, addedAt: Date.now() } : i
          );
        }
        return [
          ...prev,
          {
            id: product.id,
            code: product.code,
            name: product.name,
            price: product.price,
            img: product.img,
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
