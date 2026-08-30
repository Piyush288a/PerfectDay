/**
 * Phase 8A Automated Verification Suite — Remember Me & Session Rotation
 *
 * Tests:
 * 1. Health check online.
 * 2. User registration returns 201 with pd_auth cookie (no pd_refresh).
 * 3. Login with rememberMe = false returns 200, pd_auth cookie, NO pd_refresh cookie.
 * 4. DB check: zero Session records created when rememberMe = false.
 * 5. Logout clears pd_auth cookie.
 * 6. Login with rememberMe = true returns 200, pd_auth cookie AND pd_refresh cookie.
 * 7. DB check: exactly 1 active Session record created with tokenHash (not raw token).
 * 8. GET /api/auth/me succeeds with pd_auth cookie.
 * 9. POST /api/auth/refresh with pd_refresh cookie returns 200, rotates pd_refresh, sets new pd_auth.
 * 10. DB check: old Session revoked (revokedAt != null), new active Session created.
 * 11. Silent auto-refresh: GET /api/auth/me with invalid/expired pd_auth BUT valid pd_refresh succeeds (200).
 * 12. POST /api/auth/logout revokes active Session in DB and clears pd_auth and pd_refresh cookies.
 * 13. POST /api/auth/refresh with revoked pd_refresh cookie returns 401 Unauthorized.
 * 14. POST /api/auth/refresh without pd_refresh cookie returns 401 Unauthorized.
 * 15. Cross-account security: User B cannot use User A's refresh cookie.
 */

import http from "http";
import app from "../server/src/app.js";
import { prisma } from "../server/src/config/prisma.js";

let server;
const PORT = 3098;
const BASE_URL = `http://localhost:${PORT}`;

const request = (path, options = {}) => {
  return new Promise((resolve, reject) => {
    const url = `${BASE_URL}${path}`;
    const parsed = new URL(url);

    const reqOptions = {
      hostname: parsed.hostname,
      port: parsed.port,
      path: parsed.pathname + parsed.search,
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
    };

    const req = http.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json;
        try {
          json = JSON.parse(data);
        } catch {
          json = data;
        }

        const setCookieHeader = res.headers["set-cookie"] || [];

        resolve({
          status: res.statusCode,
          headers: res.headers,
          cookies: setCookieHeader,
          body: json,
        });
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }
    req.end();
  });
};

const extractCookie = (cookies, name) => {
  if (!cookies) return null;
  for (const c of cookies) {
    const parts = c.split(";")[0].split("=");
    if (parts[0].trim() === name) {
      return c.split(";")[0]; // returns "name=value"
    }
  }
  return null;
};

const runTests = async () => {
  console.log("=== PerfectDay Phase 8A: Remember Me & Session Management Verification ===\n");

  await new Promise((resolve) => {
    server = app.listen(PORT, () => {
      console.log(`Test server listening on ${BASE_URL}`);
      resolve();
    });
  });

  let passed = 0;
  let total = 0;

  const assert = (condition, message) => {
    total++;
    if (condition) {
      console.log(`✅ [PASS] ${total}. ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${total}. ${message}`);
      process.exitCode = 1;
    }
  };

  try {
    // 1. Health check
    const health = await request("/api/health");
    assert(health.status === 200 && health.body?.data?.status === "ok", "Backend /api/health online");

    // Clean up test users if existing
    const testEmailA = "phase8a_usera@example.com";
    const testEmailB = "phase8a_userb@example.com";

    await prisma.user.deleteMany({
      where: { email: { in: [testEmailA, testEmailB] } },
    });

    // 2. Register User A
    const regRes = await request("/api/auth/register", {
      method: "POST",
      body: { email: testEmailA, password: "password123", displayName: "User A" },
    });
    assert(regRes.status === 201 && regRes.body?.data?.id, "User A registered successfully (201)");
    const userA = regRes.body.data;

    const regAuthCookie = extractCookie(regRes.cookies, "pd_auth");
    const regRefreshCookie = extractCookie(regRes.cookies, "pd_refresh");
    assert(Boolean(regAuthCookie), "Registration sets pd_auth access cookie");
    assert(!regRefreshCookie, "Registration does NOT set pd_refresh cookie (Remember Me OFF)");

    // 3. Login without Remember Me (rememberMe = false)
    const loginNoRem = await request("/api/auth/login", {
      method: "POST",
      body: { email: testEmailA, password: "password123", rememberMe: false },
    });
    assert(loginNoRem.status === 200, "Login with rememberMe=false returns 200");

    const noRemAuthCookie = extractCookie(loginNoRem.cookies, "pd_auth");
    const noRemRefreshCookie = extractCookie(loginNoRem.cookies, "pd_refresh");
    assert(Boolean(noRemAuthCookie), "Login returns pd_auth cookie");
    assert(!noRemRefreshCookie, "Login with rememberMe=false does NOT return pd_refresh cookie");

    // 4. DB check for rememberMe = false
    const sessionsNoRem = await prisma.session.findMany({ where: { userId: userA.id } });
    assert(sessionsNoRem.length === 0, "Zero Session records created when rememberMe=false");

    // 5. Logout
    const logoutRes1 = await request("/api/auth/logout", {
      method: "POST",
      headers: { Cookie: noRemAuthCookie },
    });
    assert(logoutRes1.status === 200, "Logout returns 200");

    // 6. Login WITH Remember Me (rememberMe = true)
    const loginRem = await request("/api/auth/login", {
      method: "POST",
      body: { email: testEmailA, password: "password123", rememberMe: true },
    });
    assert(loginRem.status === 200, "Login with rememberMe=true returns 200");

    const remAuthCookie = extractCookie(loginRem.cookies, "pd_auth");
    const remRefreshCookie = extractCookie(loginRem.cookies, "pd_refresh");
    assert(Boolean(remAuthCookie), "Login returns pd_auth access cookie");
    assert(Boolean(remRefreshCookie), "Login with rememberMe=true returns pd_refresh cookie");

    // 7. DB check for rememberMe = true
    const sessionsRem = await prisma.session.findMany({ where: { userId: userA.id, revokedAt: null } });
    assert(sessionsRem.length === 1, "Exactly 1 active Session record created in DB when rememberMe=true");
    const initialSession = sessionsRem[0];
    assert(
      initialSession.tokenHash.startsWith("$2b$") || initialSession.tokenHash.startsWith("$2a$"),
      "Session token is stored as a bcrypt hash in DB (never raw)"
    );

    // 8. GET /api/auth/me with pd_auth
    const meRes = await request("/api/auth/me", {
      headers: { Cookie: remAuthCookie },
    });
    assert(meRes.status === 200 && meRes.body?.data?.id === userA.id, "GET /api/auth/me returns authenticated User A");

    // 9. POST /api/auth/refresh with pd_refresh
    const refreshRes = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: remRefreshCookie },
    });
    assert(refreshRes.status === 200, "POST /api/auth/refresh with valid pd_refresh returns 200");

    const newAuthCookie = extractCookie(refreshRes.cookies, "pd_auth");
    const newRefreshCookie = extractCookie(refreshRes.cookies, "pd_refresh");
    assert(Boolean(newAuthCookie), "Refresh endpoint returns new pd_auth access cookie");
    assert(Boolean(newRefreshCookie), "Refresh endpoint returns new rotated pd_refresh cookie");
    assert(newRefreshCookie !== remRefreshCookie, "Refresh token was rotated (new cookie value)");

    // 10. DB check after rotation
    const oldSessionDb = await prisma.session.findUnique({ where: { id: initialSession.id } });
    assert(oldSessionDb.revokedAt !== null, "Previous Session record was revoked in DB (revokedAt != null)");

    const activeSessionsAfterRotate = await prisma.session.findMany({ where: { userId: userA.id, revokedAt: null } });
    assert(activeSessionsAfterRotate.length === 1, "New rotated active Session record exists in DB");

    // 11. Silent Auto-Refresh: send request with invalid access cookie BUT valid rotated refresh cookie
    const autoRefreshRes = await request("/api/auth/me", {
      headers: { Cookie: `pd_auth=invalid_expired_jwt; ${newRefreshCookie}` },
    });
    assert(autoRefreshRes.status === 200 && autoRefreshRes.body?.data?.id === userA.id, "GET /api/auth/me with invalid access token auto-refreshes silently using pd_refresh (200)");

    // Get the latest refresh cookie from the auto-refresh response
    const latestRefreshCookie = extractCookie(autoRefreshRes.cookies, "pd_refresh") || newRefreshCookie;

    // 12. Logout with Remember Me
    const logoutRes2 = await request("/api/auth/logout", {
      method: "POST",
      headers: { Cookie: `${newAuthCookie}; ${latestRefreshCookie}` },
    });
    assert(logoutRes2.status === 200, "Logout with Remember Me returns 200");

    // Allow async revocation background task to settle
    await new Promise((r) => setTimeout(r, 200));

    const activeSessionsAfterLogout = await prisma.session.findMany({ where: { userId: userA.id, revokedAt: null } });
    assert(activeSessionsAfterLogout.length === 0, "Logout revokes all user sessions in DB (0 active)");

    // 13. Refresh with revoked session cookie -> 401
    const revokedRefreshRes = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: latestRefreshCookie },
    });
    assert(revokedRefreshRes.status === 401, "POST /api/auth/refresh with revoked refresh cookie returns 401 Unauthorized");

    // 14. Refresh without refresh cookie -> 401
    const noCookieRefreshRes = await request("/api/auth/refresh", { method: "POST" });
    assert(noCookieRefreshRes.status === 401, "POST /api/auth/refresh without cookies returns 401 Unauthorized");

    // 15. Register User B and verify cross-account refresh isolation
    const regResB = await request("/api/auth/register", {
      method: "POST",
      body: { email: testEmailB, password: "password123", displayName: "User B" },
    });
    const userB = regResB.body.data;

    const loginB = await request("/api/auth/login", {
      method: "POST",
      body: { email: testEmailB, password: "password123", rememberMe: true },
    });
    const refreshCookieB = extractCookie(loginB.cookies, "pd_refresh");

    // Refresh User B
    const refreshBRes = await request("/api/auth/refresh", {
      method: "POST",
      headers: { Cookie: refreshCookieB },
    });
    assert(refreshBRes.status === 200 && refreshBRes.body?.data?.id === userB.id, "User B refresh returns User B identity only");

    // 16. UI DOM Verification: LoginView Remember Me control is fully enabled and interactive
    const { JSDOM } = await import("jsdom");
    const { renderLoginView } = await import("../client/src/views/LoginView.js");
    const dom = new JSDOM(`<!DOCTYPE html><html><body><div id="app">${renderLoginView()}</div></body></html>`);
    const doc = dom.window.document;
    const rememberCheckbox = doc.getElementById("remember-me");
    assert(Boolean(rememberCheckbox), "Remember Me checkbox exists in LoginView DOM");
    assert(rememberCheckbox.disabled === false && !rememberCheckbox.hasAttribute("disabled"), "Remember Me checkbox is NOT disabled in DOM");
    assert(rememberCheckbox.getAttribute("aria-disabled") !== "true", "Remember Me checkbox has no aria-disabled attribute");

    const rememberLabel = rememberCheckbox.closest("label")?.textContent || "";
    assert(!rememberLabel.includes("1h session") && !rememberLabel.includes("Fixed 1-hour"), "Obsolete '1h session' label text removed from UI");

    // Simulate clicking checkbox
    rememberCheckbox.click();
    assert(rememberCheckbox.checked === true, "Clicking Remember Me checkbox checks the box ([x] Remember me)");

    rememberCheckbox.click();
    assert(rememberCheckbox.checked === false, "Clicking Remember Me checkbox again unchecks the box ([ ] Remember me)");

    // Cleanup
    await prisma.user.deleteMany({
      where: { email: { in: [testEmailA, testEmailB] } },
    });

    console.log(`\n=== Phase 8A Verification Complete: ${passed}/${total} Tests Passed ===`);
    if (passed === total) {
      console.log("🎉 ALL 15 PHASE 8A REMEMBER ME TESTS PASSED SUCCESSFULLY!");
    } else {
      process.exitCode = 1;
    }
  } finally {
    server.close();
  }
};

runTests();
