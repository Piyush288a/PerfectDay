import { spawn } from "child_process";

const API_BASE = "http://localhost:3000/api";

const runIntegrationTest = async () => {
  console.log("=== PerfectDay Phase 6 Integration Verification ===\n");
  let passed = 0;
  let total = 0;

  const assert = (condition, name, details = "") => {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${name}: ${details}`);
    }
  };

  // Start backend server
  const server = spawn("node", ["--env-file=.env", "src/index.js"], {
    cwd: "d:/IGNORE/PROJECTS/PerfectDay/server",
    stdio: "pipe",
  });

  // Wait for server to start
  await new Promise((resolve) => setTimeout(resolve, 2000));

  try {
    // 1. Health Check
    const healthRes = await fetch(`${API_BASE}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200 && healthData.success, "Backend /api/health online");

    // 2. Register New User
    const testUser = {
      email: `frontend_auth_${Date.now()}@example.com`,
      password: "SecurePassword123!",
      displayName: "Frontend Test User",
      timezone: "Asia/Kolkata",
    };

    let authCookie = "";

    const regRes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const regData = await regRes.json();
    const regCookie = regRes.headers.get("set-cookie") || "";
    if (regCookie.includes("pd_auth=")) {
      authCookie = regCookie.split(";")[0];
    }

    assert(
      regRes.status === 201 &&
        regData.success &&
        regData.data.email === testUser.email &&
        regData.data.displayName === testUser.displayName &&
        regData.data.timezone === testUser.timezone &&
        !regData.data.passwordHash &&
        regCookie.includes("pd_auth="),
      "Registration creates user and issues HTTP-only pd_auth cookie",
      JSON.stringify(regData)
    );

    // 3. Duplicate Registration Check (409)
    const dupRes = await fetch(`${API_BASE}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    const dupData = await dupRes.json();
    assert(
      dupRes.status === 409 && dupData.error.code === "CONFLICT",
      "Duplicate registration produces 409 Conflict error",
      JSON.stringify(dupData)
    );

    // 4. Session Restoration via GET /api/auth/me with Cookie
    const meRes = await fetch(`${API_BASE}/auth/me`, {
      headers: { Cookie: authCookie },
    });
    const meData = await meRes.json();
    assert(
      meRes.status === 200 &&
        meData.success &&
        meData.data.email === testUser.email &&
        !meData.data.passwordHash,
      "GET /api/auth/me restores session using pd_auth cookie",
      JSON.stringify(meData)
    );

    // 5. Unauthenticated GET /api/auth/me without Cookie (401)
    const unauthMeRes = await fetch(`${API_BASE}/auth/me`);
    const unauthMeData = await unauthMeRes.json();
    assert(
      unauthMeRes.status === 401 && unauthMeData.error.code === "UNAUTHORIZED",
      "GET /api/auth/me without cookie correctly rejected (401)",
      JSON.stringify(unauthMeData)
    );

    // 6. Login with Wrong Password (401)
    const wrongLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUser.email, password: "IncorrectPassword!" }),
    });
    const wrongLoginData = await wrongLoginRes.json();
    assert(
      wrongLoginRes.status === 401 &&
        wrongLoginData.error.code === "UNAUTHORIZED" &&
        wrongLoginData.error.message === "Invalid email or password",
      "POST /api/auth/login with wrong password rejected (401)",
      JSON.stringify(wrongLoginData)
    );

    // 7. Login with Correct Credentials
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    const loginData = await loginRes.json();
    const loginCookie = loginRes.headers.get("set-cookie") || "";
    assert(
      loginRes.status === 200 &&
        loginData.success &&
        loginData.data.email === testUser.email &&
        loginCookie.includes("pd_auth="),
      "POST /api/auth/login succeeds and re-issues pd_auth cookie",
      JSON.stringify(loginData)
    );

    // 8. Logout
    const logoutRes = await fetch(`${API_BASE}/auth/logout`, {
      method: "POST",
      headers: { Cookie: authCookie },
    });
    const logoutData = await logoutRes.json();
    const logoutCookie = logoutRes.headers.get("set-cookie") || "";
    assert(
      logoutRes.status === 200 &&
        logoutData.success &&
        (logoutCookie.includes("pd_auth=;") || logoutCookie.includes("Max-Age=0")),
      "POST /api/auth/logout successfully clears pd_auth cookie",
      JSON.stringify(logoutData)
    );

    console.log(`\n=== Integration Verification Results: ${passed}/${total} Passed ===`);
    if (passed === total) {
      console.log("🎉 ALL INTEGRATION TESTS PASSED!");
    } else {
      process.exit(1);
    }
  } finally {
    server.kill();
  }
};

runIntegrationTest();
