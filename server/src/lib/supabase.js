import { createClient } from "@supabase/supabase-js";
import { config } from "../config.js";

export const supabase = createClient(
  config.supabaseUrl,
  config.supabaseServiceKey,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export const STORAGE_BUCKET = "product-images";

export function publicImageUrl(path) {
  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;
  return `${config.supabaseUrl}/storage/v1/object/public/${STORAGE_BUCKET}/${path}`;
}
