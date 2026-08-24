import crypto from "crypto";
import { config } from "../config.js";

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

export function sanitize(value, max = 500) {
  return String(value ?? "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, max);
}

export function parsePrice(price) {
  const n = parseFloat(String(price || "").replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

const CODE_CHARS = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateTrackingCode() {
  let s = "";
  for (let i = 0; i < 6; i++) {
    s += CODE_CHARS[crypto.randomInt(CODE_CHARS.length)];
  }
  return `${config.trackingPrefix}-${s}`;
}

/**
 * Simple in-memory rate limiter (per IP + route bucket).
 */
export function rateLimit({ windowMs = 60_000, max = 30 } = {}) {
  const hits = new Map();
  setInterval(() => hits.clear(), windowMs).unref();
  return (req, res, next) => {
    const key = `${req.ip || "unknown"}`;
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now - entry.start > windowMs) {
      hits.set(key, { start: now, count: 1 });
      return next();
    }
    entry.count += 1;
    if (entry.count > max) {
      return res.status(429).json({ error: "Too many requests. Try again shortly." });
    }
    next();
  };
}
