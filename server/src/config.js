import "dotenv/config";

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
  jwtSecret: process.env.JWT_SECRET || "dev-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  chatFunctionUrl: process.env.CHAT_FUNCTION_URL || ""
};
