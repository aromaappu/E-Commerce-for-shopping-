export function parsePrice(price) {
  const n = parseFloat(String(price || "").replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

export function formatINR(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

export function plainText(html) {
  return String(html || "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

export function discountPercent(price, mrp) {
  const p = parsePrice(price);
  const m = parsePrice(mrp);
  if (!m || m <= p) return 0;
  return Math.round(((m - p) / m) * 100);
}

function itemLines(items) {
  return items
    .map(
      (it, i) =>
        `${i + 1}) ${it.name}\n   Code: ${it.code} | Price: ${it.price} | Qty: ${it.qty}`
    )
    .join("\n");
}

/**
 * Builds the pre-filled WhatsApp order message.
 * Single-item orders keep the legacy format; cart orders list all items.
 */
export function buildOrderMessage({ items, customer, trackingCode, total }) {
  const lines = [];
  const single = items.length === 1 ? items[0] : null;

  if (single) {
    lines.push("Hey I'm interested to buy this product", "");
    lines.push(`Product: ${single.name}`);
    lines.push(`Code: ${single.code}`);
    lines.push(`Price: ${single.price}`);
    const desc = plainText(single.desc);
    if (desc) lines.push(`Description: ${desc.replace(/\n/g, " | ")}`);
    if (single.img) lines.push(`Image: ${single.img}`);
  } else {
    lines.push("Hey I'm interested to buy these products", "");
    lines.push(itemLines(items));
    if (total) lines.push("", `Total: ₹${Number(total).toLocaleString("en-IN")}`);
  }

  if (trackingCode) {
    lines.push("", `*Tracking Code: ${trackingCode}*`);
  }
  lines.push("", `Customer: ${customer.name}`);
  lines.push(`Phone: ${customer.phone}`);
  if (customer.address) lines.push(`Address: ${customer.address}`);
  lines.push("", "Please confirm my order.");
  return lines.join("\n");
}

export function openWhatsApp(number, message, win) {
  const url = `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
  try {
    if (win && !win.closed) {
      win.location.href = url;
      return;
    }
  } catch {
    /* fall through */
  }
  window.open(url, "_blank");
}
