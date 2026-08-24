import express from "express";
import multer from "multer";
import cors from "cors";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { config } from "./config.js";
import publicRoutes from "./routes/public.js";
import adminRoutes from "./routes/admin.js";
import { HttpError } from "./lib/helpers.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.set("trust proxy", 1);
app.use(express.json({ limit: "1mb" }));

const origins = String(config.clientOrigin)
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);
app.use(
  cors({
    origin: origins.includes("*") ? true : (origin, cb) => {
      if (!origin || origins.includes(origin) || /localhost:\d+$/.test(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    }
  })
);

/* API routes */
app.use("/api", publicRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (_req, res) => res.json({ ok: true, name: config.storeName }));

/* Serve the built React client in production */
const distDir = path.join(__dirname, "..", "..", "client", "dist");
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(distDir, "index.html"));
  });
}

/* 404 + error handler */
app.use((req, res, next) => {
  if (req.path.startsWith("/api")) return next(new HttpError(404, "Endpoint not found"));
  next();
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  const status = err.status || 500;
  if (status >= 500) console.error("[error]", err);
  res.status(status).json({ error: err.message || "Server error" });
});

export { app };

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  app.listen(config.port, () => {
    console.log(`✔ ${config.storeName} API running on http://localhost:${config.port}`);
  });
}
