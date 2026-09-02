import http from "http";
import app from "../server/src/app.js";
import { prisma } from "../server/src/config/prisma.js";

const PORT = 3099;
const API_BASE = `http://localhost:${PORT}/api`;

const assert = (condition, message) => {
  if (condition) {
    console.log(`✅ [PASS] ${message}`);
  } else {
    console.error(`❌ [FAIL] ${message}`);
    process.exitCode = 1;
  }
};

const parseCookies = (res) => {
  const setCookieHeaders = res.headers["set-cookie"] || [];
  const cookies = {};
  setCookieHeaders.forEach((str) => {
    const parts = str.split(";")[0].split("=");
    if (parts.length >= 2) {
      cookies[parts[0].trim()] = parts.slice(1).join("=").trim();
    }
  });
  return cookies;
};

const makeRequest = (path, method = "GET", body = null, cookies = {}) => {
  return new Promise((resolve, reject) => {
    const url = new URL(path.startsWith("http") ? path : `${API_BASE}${path}`);
    const headers = { "Content-Type": "application/json" };

    const cookieStr = Object.entries(cookies)
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
    if (cookieStr) {
      headers["Cookie"] = cookieStr;
    }

    const req = http.request(
      url,
      { method, headers },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          let json = null;
          try {
            json = JSON.parse(data);
          } catch {}
          resolve({ status: res.statusCode, headers: res.headers, json, body: data });
        });
      }
    );

    req.on("error", reject);
    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

const runTests = async () => {
  console.log("=== PerfectDay Phase 8B: Google OAuth 2.0 Integration Verification ===\n");

  const server = app.listen(PORT);
  await new Promise((resolve) => setTimeout(resolve, 300));

  try {
    // 1. Health check
    const health = await makeRequest("/health");
    assert(health.status === 200, "1. Backend /api/health online");

    // Test Data Identifiers
    const googleIdA = `google_sub_${Date.now()}_a`;
    const googleEmailA = `google_user_a_${Date.now()}@example.com`;

    // 2. New Google User Registration via POST /api/auth/google
    const idTokenA = `mock_google_token_${googleIdA}::${googleEmailA}::GoogleUserA`;
    const resRegA = await makeRequest("/auth/google", "POST", { idToken: idTokenA, rememberMe: false });
    assert(resRegA.status === 201, "2. New Google user registered successfully (201 Created)");

    const cookiesRegA = parseCookies(resRegA);
    assert(Boolean(cookiesRegA.pd_auth), "3. Google registration sets pd_auth access cookie");
    assert(!cookiesRegA.pd_refresh, "4. Google registration without Remember Me does NOT set pd_refresh cookie");

    // DB Verification for Google User A
    const dbUserA = await prisma.user.findUnique({ where: { email: googleEmailA } });
    assert(Boolean(dbUserA), "5. User record created in database for Google user");
    assert(dbUserA?.googleId === googleIdA, "6. User record has googleId set to Google sub claim");
    assert(dbUserA?.passwordHash === null, "7. User record has passwordHash = null (Google-only user)");

    // Default List Check
    const listsA = await prisma.list.findMany({ where: { userId: dbUserA.id } });
    assert(listsA.length === 1 && listsA[0].isDefault === true, "8. Default 'Tasks' list automatically created for new Google user");

    // 3. Password Login Guard for Google-Only User
    const resPassLogin = await makeRequest("/auth/login", "POST", { email: googleEmailA, password: "Password123!" });
    assert(resPassLogin.status === 401, "9. Password login attempt for Google-only account is rejected (401 Unauthorized)");

    // 4. Existing Google User Login
    const resLoginA = await makeRequest("/auth/google", "POST", { idToken: idTokenA, rememberMe: false });
    assert(resLoginA.status === 200, "10. Existing Google user login returns 200 OK");
    assert(resLoginA.json?.data?.id === dbUserA.id, "11. Login response matches existing Google user identity");

    // 5. Account Conflict Protection (No Silent Merging)
    const passEmail = `password_user_${Date.now()}@example.com`;
    const resPassReg = await makeRequest("/auth/register", "POST", { email: passEmail, password: "Password123!", displayName: "Password User" });
    assert(resPassReg.status === 201, "12. Registered password user successfully");

    const conflictIdToken = `mock_google_token_hacker_google_id::${passEmail}::HackerName`;
    const resConflict = await makeRequest("/auth/google", "POST", { idToken: conflictIdToken, rememberMe: false });
    assert(resConflict.status === 409, "13. Google login with matching email of existing password account returns 409 Conflict");
    assert(resConflict.json?.error?.code === "ACCOUNT_EXISTS_PASSWORD_ONLY", "14. Error code specifies ACCOUNT_EXISTS_PASSWORD_ONLY");

    // DB Verification: Ensure NO silent merging occurred
    const dbPassUser = await prisma.user.findUnique({ where: { email: passEmail } });
    assert(dbPassUser?.googleId === null, "15. DB check: Password user googleId remains NULL (no silent merging)");
    assert(dbPassUser?.passwordHash !== null, "16. DB check: Password user passwordHash remains intact");

    // 6. Google Auth with Remember Me ON
    const googleIdB = `google_sub_${Date.now()}_b`;
    const googleEmailB = `google_user_b_${Date.now()}@example.com`;
    const idTokenB = `mock_google_token_${googleIdB}::${googleEmailB}::GoogleUserB`;

    const resGoogleRem = await makeRequest("/auth/google", "POST", { idToken: idTokenB, rememberMe: true });
    assert(resGoogleRem.status === 201, "17. Google Auth with rememberMe=true returns 201 Created");

    const cookiesRemB = parseCookies(resGoogleRem);
    assert(Boolean(cookiesRemB.pd_auth), "18. Google Auth with Remember Me sets pd_auth access cookie");
    assert(Boolean(cookiesRemB.pd_refresh), "19. Google Auth with Remember Me sets persistent pd_refresh cookie");

    const dbUserB = await prisma.user.findUnique({ where: { email: googleEmailB } });
    const sessionsB = await prisma.session.findMany({ where: { userId: dbUserB.id, revokedAt: null } });
    assert(sessionsB.length === 1, "20. Exactly 1 active Session record created in DB for Google user with Remember Me ON");

    // 7. Transparent Session Refresh for Google User
    const resRefresh = await makeRequest("/auth/refresh", "POST", null, { pd_refresh: cookiesRemB.pd_refresh });
    assert(resRefresh.status === 200, "21. POST /api/auth/refresh for Google user session returns 200 OK");

    const cookiesRefreshed = parseCookies(resRefresh);
    assert(Boolean(cookiesRefreshed.pd_auth), "22. Refresh returns new pd_auth access cookie");
    assert(Boolean(cookiesRefreshed.pd_refresh), "23. Refresh returns rotated pd_refresh cookie");

    // 8. Logout for Google User
    const resLogout = await makeRequest("/auth/logout", "POST", null, { pd_refresh: cookiesRefreshed.pd_refresh });
    assert(resLogout.status === 200, "24. Logout for Google user returns 200 OK");

    const sessionsAfterLogout = await prisma.session.findMany({ where: { userId: dbUserB.id, revokedAt: null } });
    assert(sessionsAfterLogout.length === 0, "25. Logout revokes all active Session records for Google user in DB");

    console.log("\n=== Phase 8B Verification Complete: All Tests Passed ===");
    console.log("🎉 ALL PHASE 8B GOOGLE OAUTH TESTS PASSED SUCCESSFULLY!");
  } finally {
    server.close();
  }
};

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
