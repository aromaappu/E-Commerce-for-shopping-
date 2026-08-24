import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { HttpError } from "../lib/helpers.js";

export function signAdminToken() {
  return jwt.sign({ role: "admin" }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn
  });
}

export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, "Unauthorized"));
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    if (payload.role !== "admin") throw new Error("bad role");
    req.admin = payload;
    next();
  } catch {
    next(new HttpError(401, "Session expired. Please log in again."));
  }
}
