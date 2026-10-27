import { HttpError, parsePrice, sanitize } from "./helpers.js";

export function parseCheckoutItems(raw) {
  if (!Array.isArray(raw) || !raw.length || raw.length > 50)
    throw new HttpError(400, "Order must contain 1–50 items");
  const quantities = new Map();
  for (const rawItem of raw) {
    const code = sanitize(rawItem?.product_code || rawItem?.code, 40).replace(/_\d{13}$/, "").toUpperCase();
    const qty = Number(rawItem?.qty);
    if (!/^[A-Z0-9_-]{2,40}$/.test(code) || !Number.isInteger(qty) || qty < 1 || qty > 99)
      throw new HttpError(400, "Invalid product or quantity");
    const combined = (quantities.get(code) || 0) + qty;
    if (combined > 99) throw new HttpError(400, "Maximum quantity is 99 per product");
    quantities.set(code, combined);
  }
  return [...quantities].map(([code, qty]) => ({ code, qty }));
}

export function priceCheckoutItems(requested, catalog) {
  const lookup = new Map((catalog || []).map((p) => [String(p.product_code).toUpperCase(), p]));
  let cents = 0;
  const items = requested.map(({ code, qty }) => {
    const product = lookup.get(code);
    if (!product) throw new HttpError(409, "A product in your cart is no longer available");
    if (product.out_of_stock) throw new HttpError(409, `${product.name} is out of stock`);
    const unitPrice = parsePrice(product.price);
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) throw new HttpError(409, `${product.name} has no valid price`);
    cents += Math.round(unitPrice * 100) * qty;
    return { id: product.id, code: product.product_code, name: product.name, price: product.price, img: product.image_url || "", qty };
  });
  return { items, total: cents / 100 };
}
