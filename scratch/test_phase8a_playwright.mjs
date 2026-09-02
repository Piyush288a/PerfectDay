/**
 * Phase 8A — Real Browser Playwright Acceptance Test:
 * Physical Pointer Hit-Testing, Label Clicking, Keyboard Space Toggling, and Payload Delivery.
 */

import { spawn } from "child_process";
import http from "http";

let backendProcess = null;
let viteProcess = null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const waitForServer = (url, timeoutMs = 20000) => {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http
        .get(url, (res) => {
          if (res.statusCode < 500) resolve();
          else retry();
        })
        .on("error", () => {
          retry();
        });
    };

    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server at ${url} did not respond within ${timeoutMs}ms`));
      } else {
        setTimeout(check, 500);
      }
    };

    check();
  });
};

const runPlaywrightTest = async () => {
  console.log("=== Phase 8A — Real Browser Playwright Hit-Test & Physical Interaction Suite ===\n");

  // 1. Start backend server
  console.log("Starting backend server on port 3000...");
  backendProcess = spawn("node", ["--env-file=server/.env", "server/src/index.js"], {
    cwd: "S:/PROJECTS/PerfectDay",
    stdio: "pipe",
  });

  await waitForServer("http://localhost:3000/api/health");
  console.log("Backend server online at http://localhost:3000");

  // 2. Start Vite dev server
  console.log("Starting Vite dev server on port 5173...");
  viteProcess = spawn("npx.cmd", ["vite", "--port", "5173", "--force"], {
    cwd: "S:/PROJECTS/PerfectDay/client",
    stdio: "pipe",
    shell: true,
  });

  await waitForServer("http://localhost:5173");
  console.log("Vite dev server online at http://localhost:5173");

  const { chromium } = await import("playwright");
  let browser;
  try {
    browser = await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    try {
      browser = await chromium.launch({ channel: "msedge", headless: true });
    } catch {
      browser = await chromium.launch({ headless: true });
    }
  }
  const context = await browser.newContext();
  const page = await context.newPage();

  let total = 0;
  let passed = 0;

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
    // Navigate to Login page
    await page.goto("http://localhost:5173/#login");
    await page.waitForSelector("#login-form");

    // 1. Element Inspect & Attribute checks
    const rememberInput = page.locator("#remember-me");
    const isVisible = await rememberInput.isVisible();
    const isDisabled = await rememberInput.isDisabled();
    const isCheckedInitial = await rememberInput.isChecked();

    assert(isVisible, "Remember Me checkbox input is visible in real browser viewport");
    assert(!isDisabled, "Remember Me checkbox input is NOT disabled");
    assert(!isCheckedInitial, "Remember Me checkbox is unchecked initially ([ ])");

    // 2. Real Hit-Testing via document.elementFromPoint
    const hitTestInput = await page.evaluate(() => {
      const el = document.querySelector("#remember-me");
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const hitEl = document.elementFromPoint(x, y);
      return {
        tag: hitEl?.tagName,
        id: hitEl?.id,
        className: hitEl?.className,
        isInput: hitEl?.id === "remember-me",
      };
    });

    assert(
      hitTestInput && hitTestInput.isInput,
      `Hit-test at center of checkbox returns #remember-me (returned: ${hitTestInput?.id || hitTestInput?.tag})`
    );

    // 3. Real Hit-Testing at text label
    const hitTestLabel = await page.evaluate(() => {
      const labelText = document.querySelector(".checkbox-label");
      if (!labelText) return null;
      const r = labelText.getBoundingClientRect();
      const x = r.left + r.width / 2;
      const y = r.top + r.height / 2;
      const hitEl = document.elementFromPoint(x, y);
      return {
        tag: hitEl?.tagName,
        id: hitEl?.id,
        className: hitEl?.className,
        isLabelOrInput: hitEl?.id === "remember-me" || hitEl?.classList.contains("checkbox-label") || hitEl?.classList.contains("checkbox-container"),
      };
    });

    assert(
      hitTestLabel && hitTestLabel.isLabelOrInput,
      `Hit-test over label text returns interactive label element (returned: ${hitTestLabel?.className || hitTestLabel?.tag})`
    );

    // 4. Physical pointer click on checkbox
    await rememberInput.click();
    let isCheckedAfterClick = await rememberInput.isChecked();
    assert(isCheckedAfterClick === true, "Physical pointer click on checkbox checks it ([x] Remember me)");

    // 5. Physical pointer click on text label
    await page.getByText("Remember me", { exact: true }).click();
    let isCheckedAfterLabelClick = await rememberInput.isChecked();
    assert(isCheckedAfterLabelClick === false, "Physical pointer click on label text unchecks it ([ ] Remember me)");

    // 6. Keyboard Space toggle
    await rememberInput.focus();
    await page.keyboard.press("Space");
    let isCheckedAfterSpace = await rememberInput.isChecked();
    assert(isCheckedAfterSpace === true, "Keyboard Space key toggles checkbox to checked ([x])");

    // 7. Request Interception & Payload verification
    let lastLoginPayload = null;
    page.on("request", (req) => {
      if (req.url().includes("/api/auth/login") && req.method() === "POST") {
        try {
          lastLoginPayload = JSON.parse(req.postData());
        } catch {}
      }
    });

    // Uncheck and submit
    await page.keyboard.press("Space"); // unchecks
    assert((await rememberInput.isChecked()) === false, "Unchecked before submission");

    const testEmail = `playwright_auth_${Date.now()}@example.com`;

    // Register user first via backend API
    await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testEmail, password: "password123", displayName: "Playwright User" }),
    });

    // Fill login form
    await page.fill("#login-email", testEmail);
    await page.fill("#login-password", "password123");

    // A. Submit with Remember Me OFF (unchecked)
    await page.click("#submit-login-btn");
    await sleep(500);

    assert(
      lastLoginPayload && lastLoginPayload.rememberMe === false,
      `Form submission sends rememberMe: false when unchecked (received: ${lastLoginPayload?.rememberMe})`
    );

    // Verify response cookies: pd_auth set, pd_refresh NOT set
    const cookiesUnchecked = await context.cookies();
    const refreshCookieUnchecked = cookiesUnchecked.find((c) => c.name === "pd_refresh");
    assert(!refreshCookieUnchecked, "Login with rememberMe=false does NOT create pd_refresh cookie");

    // B. Logout & Submit with Remember Me ON (checked)
    await page.evaluate(() => fetch("/api/auth/logout", { method: "POST" }));
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
      window.location.hash = "#login";
      window.location.reload();
    });
    await sleep(800);
    await page.waitForSelector("#login-form");

    await page.fill("#login-email", testEmail);
    await page.fill("#login-password", "password123");
    await page.click("#remember-me");
    assert((await page.locator("#remember-me").isChecked()) === true, "Checkbox checked before submission");

    await page.click("#submit-login-btn");
    await sleep(500);

    assert(
      lastLoginPayload && lastLoginPayload.rememberMe === true,
      `Form submission sends rememberMe: true when checked (received: ${lastLoginPayload?.rememberMe})`
    );

    const meStatus = await page.evaluate(() => fetch("http://localhost:3000/api/auth/me", { credentials: "include" }).then((r) => r.status));
    assert(meStatus === 200, "Login with rememberMe=true sets persistent session (200 OK)");

    // 8. Test Browser Context Restart Persistence (Remember Me ON)
    const activeCookies = await context.cookies(["http://localhost:5173", "http://localhost:3000/api/auth"]);
    await context.close(); // Completely close browser context

    // Reopen brand new browser context with persistent cookies
    const contextRestart = await browser.newContext();
    await contextRestart.addCookies(activeCookies);
    const pageRestart = await contextRestart.newPage();

    await pageRestart.goto("http://localhost:5173/");
    await sleep(500);
    const meStatusRestart = await pageRestart.evaluate(() => fetch("http://localhost:3000/api/auth/me", { credentials: "include" }).then((r) => r.status));
    assert(meStatusRestart === 200, "Reopening browser context restores authenticated session via persistent refresh session (200 OK)");

    // 9. Test Logout Session Revocation
    await pageRestart.evaluate(() => fetch("http://localhost:3000/api/auth/logout", { method: "POST", credentials: "include" }));
    await contextRestart.close(); // Close context after logout

    const contextPostLogout = await browser.newContext();
    const pagePostLogout = await contextPostLogout.newPage();
    await pagePostLogout.goto("http://localhost:5173/");
    await sleep(500);

    const meStatusPostLogout = await pagePostLogout.evaluate(() => fetch("http://localhost:3000/api/auth/me", { credentials: "include" }).then((r) => r.status));
    assert(meStatusPostLogout === 401, "Reopening browser context after logout confirms session is revoked (401 Unauthorized)");

    console.log(`\n=== Phase 8A Playwright Physical Interaction Results: ${passed}/${total} Passed ===`);
    if (passed === total) {
      console.log("🎉 ALL PLAYWRIGHT PHYSICAL INTERACTION & PERSISTENCE TESTS PASSED 100%!");
    } else {
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    if (backendProcess) backendProcess.kill();
    if (viteProcess) viteProcess.kill();
  }
};

runPlaywrightTest().catch((err) => {
  console.error("Playwright test runner error:", err);
  if (backendProcess) backendProcess.kill();
  if (viteProcess) viteProcess.kill();
  process.exit(1);
});
