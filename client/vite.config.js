import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";

const useHttps = fs.existsSync("key.pem");

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    ...(useHttps && {
      https: {
        key: fs.readFileSync("key.pem"),
        cert: fs.readFileSync("cert.pem"),
      },
    }),
    proxy: {
      "/api": {
        target: "http://localhost:5000",
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: "dist",
    chunkSizeWarningLimit: 900
  }
});
