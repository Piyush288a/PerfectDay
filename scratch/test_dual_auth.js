import assert from "node:assert";
import http from "node:http";
import app from "../server/src/app.js";

async function run() {
  console.log("=== Testing Dual Auth (Bearer Header + Cookie) ===");

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(3099, resolve));
  const baseUrl = "http://localhost:3099";

  try {
    // 1. Register a user
    const email = `dual_auth_${Date.now()}@example.com`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "Password123!" }),
    });

    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201, "Register status 201");
    assert.ok(regData.data.token, "Register response returns JWT token");
    console.log("✅ 1. Register returns user and token");

    const token = regData.data.token;

    // 2. Access /api/auth/me using ONLY Authorization: Bearer <token> (NO cookies)
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const meData = await meRes.json();
    assert.strictEqual(meRes.status, 200, "GET /api/auth/me with Bearer token returns 200");
    assert.strictEqual(meData.data.email, email, "Identity matches registered user");
    console.log("✅ 2. GET /api/auth/me succeeds with Bearer token alone (zero cookies)");

    // 3. Create task using ONLY Authorization: Bearer <token> (NO cookies)
    const taskRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ title: "Cross-site Task Test" }),
    });

    const taskData = await taskRes.json();
    assert.strictEqual(taskRes.status, 201, "POST /api/tasks with Bearer token returns 201");
    assert.strictEqual(taskData.data.title, "Cross-site Task Test", "Task created successfully");
    console.log("✅ 3. POST /api/tasks succeeds with Bearer token alone (zero cookies)");

    // 4. Request without token or cookie fails with 401
    const unauthRes = await fetch(`${baseUrl}/api/tasks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Unauth Task" }),
    });
    assert.strictEqual(unauthRes.status, 401, "Request without token fails with 401");
    console.log("✅ 4. Unauthenticated request without token correctly rejected (401)");

    console.log("🎉 ALL DUAL AUTH TESTS PASSED!");
  } finally {
    server.close();
  }
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
