import test from "node:test";
import assert from "node:assert/strict";

process.env.SUPABASE_URL = "https://example.supabase.co";
process.env.SUPABASE_SERVICE_KEY = "test-service-key";
process.env.ADMIN_EMAIL = "admin@example.com";
process.env.ADMIN_PASSWORD = "test-admin-password";
process.env.JWT_SECRET = "test-secret-for-automated-tests-only";

const { app } = await import("../src/index.js");

test("admin API rejects anonymous requests and invalid logins", async () => {
  const server = await new Promise((resolve, reject) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
    instance.once("error", reject);
  });
  try {
    const base = `http://127.0.0.1:${server.address().port}`;
    for (const [method, url] of [
      ["GET", "/api/admin/products"],
      ["GET", "/api/admin/orders"],
      ["DELETE", "/api/admin/orders/invalid"],
      ["POST", "/api/admin/upload"]
    ]) {
      const response = await fetch(base + url, { method });
      assert.equal(response.status, 401, `${method} ${url} must require login`);
    }
    const login = await fetch(base + "/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@example.com", password: "wrong" })
    });
    assert.equal(login.status, 401);
    const health = await fetch(base + "/api/health");
    assert.equal(health.status, 200);
  } finally {
    if (server.listening) await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});
