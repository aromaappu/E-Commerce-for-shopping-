import "dotenv/config";
import crypto from "node:crypto";

function required(name) {
  const v = process.env[name];
  if (!v) {
    console.warn(`[config] Missing env var ${name}`);
    return "";
  }
  return v;
}

export const config = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || "*",
  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceKey: required("SUPABASE_SERVICE_KEY"),
  storeName: process.env.STORE_NAME || "Trend Mart",
  whatsappNumber: process.env.WHATSAPP_NUMBER || "",
  trackingPrefix: process.env.TRACKING_PREFIX || "TM",
  adminEmail: process.env.ADMIN_EMAIL || "admin@trendmart.in",
  adminPassword: process.env.ADMIN_PASSWORD || "",
  jwtSecret: process.env.JWT_SECRET || (process.env.NODE_ENV === "production" ? "" : crypto.randomBytes(48).toString("hex")),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  chatFunctionUrl: process.env.CHAT_FUNCTION_URL || ""
};

if (process.env.NODE_ENV === "production") {
  for (const key of ["SUPABASE_URL","SUPABASE_SERVICE_KEY","ADMIN_EMAIL","ADMIN_PASSWORD","JWT_SECRET"]) {
    if (!process.env[key]) throw new Error(`Missing required production setting: ${key}`);
  }
}
