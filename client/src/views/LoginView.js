import { renderThemeToggleHTML } from "../components/ThemeToggle.js";
import { renderAmbientSceneHTML } from "../components/AmbientScene.js";
import { showToast } from "../components/Toast.js";
import { authApi } from "../api/auth.js";
import { authStore } from "../store/auth.js";

export const renderLoginView = () => `
  <div class="auth-page">
    ${renderAmbientSceneHTML()}

    <!-- Header -->
    <header class="auth-header">
      <a href="#login" class="brand-logo" aria-label="PerfectDay Home">
        <span class="brand-logo-icon">
          <i data-lucide="sun" style="width: 24px; height: 24px;"></i>
        </span>
        <span>PerfectDay</span>
      </a>

      <div style="display: flex; align-items: center; gap: 1rem;">
        ${renderThemeToggleHTML()}
      </div>
    </header>

    <!-- Main Content -->
    <main class="auth-main">
      <!-- Left Column: Hero & Copy -->
      <section class="auth-hero-col">
        <h1 class="auth-hero-title">Your day,<br />perfected.</h1>
        <p class="auth-hero-lead">
          A calm start. A focused mind.<br />A perfect day.
        </p>

        <div class="auth-quote-pill">
          <i data-lucide="sparkles" class="auth-quote-icon" style="width: 16px; height: 16px;"></i>
          <span>Every sunrise is a new chance to begin again.</span>
        </div>
      </section>

      <!-- Right Column: Login Card -->
      <section class="auth-card-col">
        <div class="auth-card">
          <div class="auth-card-header">
            <h2 class="auth-card-title">Welcome back</h2>
            <p class="auth-card-subtitle">Let's make today meaningful.</p>
          </div>

          <!-- Inline Error Banner -->
          <div id="login-error-banner" style="display: none; padding: 0.65rem 0.875rem; margin-bottom: var(--space-4); border-radius: var(--radius-md); background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); color: var(--color-danger); font-size: var(--text-xs); line-height: 1.4;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="alert-triangle" style="width: 15px; height: 15px; flex-shrink: 0;"></i>
              <span id="login-error-text"></span>
            </div>
          </div>

          <form id="login-form" novalidate>
            <!-- Email Field -->
            <div class="form-group">
              <label for="login-email" class="form-label">Email</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <i data-lucide="mail" style="width: 17px; height: 17px;"></i>
                </span>
                <input
                  type="email"
                  id="login-email"
                  name="email"
                  class="form-input"
                  placeholder="you@example.com"
                  autocomplete="email"
                  required
                />
              </div>
            </div>

            <!-- Password Field -->
            <div class="form-group">
              <label for="login-password" class="form-label">Password</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <i data-lucide="lock" style="width: 17px; height: 17px;"></i>
                </span>
                <input
                  type="password"
                  id="login-password"
                  name="password"
                  class="form-input"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  required
                />
                <button
                  type="button"
                  id="toggle-password-btn"
                  class="password-toggle-btn"
                  aria-label="Toggle password visibility"
                  title="Toggle password visibility"
                >
                  <i data-lucide="eye" id="toggle-password-icon" style="width: 17px; height: 17px;"></i>
                </button>
              </div>
            </div>

            <!-- Form Row: Remember me & Forgot Password -->
            <div class="auth-form-row">
              <label class="checkbox-container" for="remember-me" title="Keep me signed in on this browser">
                <input type="checkbox" id="remember-me" name="rememberMe" class="checkbox-input" />
                <span class="checkbox-visual" aria-hidden="true"></span>
                <span class="checkbox-label">Remember me</span>
              </label>

              <a href="javascript:void(0)" class="forgot-password-link" id="forgot-password-link">
                Forgot password?
              </a>
            </div>

            <!-- Sign In Button -->
            <button type="submit" id="submit-login-btn" class="btn btn-primary btn-full">
              <span class="btn-text">Sign in</span>
              <i data-lucide="arrow-right" class="btn-icon-right" style="width: 16px; height: 16px;"></i>
            </button>
          </form>

          <!-- Divider -->
          <div class="divider-with-text">
            <span>or</span>
          </div>

          <!-- Google Sign-In Button -->
          <button type="button" id="google-signin-btn" class="btn btn-google" title="Continue with Google">
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            <span>Continue with Google</span>
          </button>

          <!-- Footer Switch -->
          <div class="auth-card-footer">
            <span>Don't have an account?</span>
            <a href="#register" class="auth-switch-link">Sign up</a>
          </div>
        </div>
      </section>
    </main>

    <!-- Bottom Feature Strip -->
    <footer class="auth-features-strip">
      <div class="feature-item">
        <div class="feature-icon-box">
          <i data-lucide="sun" style="width: 18px; height: 18px; color: var(--color-primary);"></i>
        </div>
        <div>
          <div class="feature-title">Focus on what matters</div>
          <div class="feature-desc">Stay present and productive throughout your day.</div>
        </div>
      </div>

      <div class="feature-item">
        <div class="feature-icon-box">
          <i data-lucide="calendar" style="width: 18px; height: 18px;"></i>
        </div>
        <div>
          <div class="feature-title">Organize with clarity</div>
          <div class="feature-desc">Keep your tasks and plans beautifully organized.</div>
        </div>
      </div>

      <div class="feature-item">
        <div class="feature-icon-box">
          <i data-lucide="leaf" style="width: 18px; height: 18px;"></i>
        </div>
        <div>
          <div class="feature-title">Build better habits</div>
          <div class="feature-desc">Small steps today, big changes tomorrow.</div>
        </div>
      </div>

      <div class="feature-item">
        <div class="feature-icon-box">
          <i data-lucide="heart" style="width: 18px; height: 18px;"></i>
        </div>
        <div>
          <div class="feature-title">Feel accomplished</div>
          <div class="feature-desc">Celebrate progress and keep moving forward.</div>
        </div>
      </div>
    </footer>
  </div>
`;

export const initLoginViewEvents = () => {
  // Password Visibility Toggle
  const toggleBtn = document.getElementById("toggle-password-btn");
  const passwordInput = document.getElementById("login-password");
  const toggleIcon = document.getElementById("toggle-password-icon");

  if (toggleBtn && passwordInput && toggleIcon) {
    toggleBtn.addEventListener("click", () => {
      const isPassword = passwordInput.type === "password";
      passwordInput.type = isPassword ? "text" : "password";
      toggleIcon.setAttribute("data-lucide", isPassword ? "eye-off" : "eye");

      if (window.lucide && typeof window.lucide.createIcons === "function") {
        window.lucide.createIcons();
      }
    });
  }

  // Forgot password mock
  const forgotLink = document.getElementById("forgot-password-link");
  if (forgotLink) {
    forgotLink.addEventListener("click", (e) => {
      e.preventDefault();
      showToast({
        message: "Password recovery will be supported in a future update.",
        type: "info",
      });
    });
  }

  // Form Submission & Real Authentication
  const form = document.getElementById("login-form");
  const submitBtn = document.getElementById("submit-login-btn");
  const errorBanner = document.getElementById("login-error-banner");
  const errorText = document.getElementById("login-error-text");

  const hideError = () => {
    if (errorBanner) errorBanner.style.display = "none";
  };

  const showError = (msg) => {
    if (errorBanner && errorText) {
      errorText.textContent = msg;
      errorBanner.style.display = "block";
      if (window.lucide) window.lucide.createIcons();
    }
  };

  if (form && submitBtn) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideError();

      const emailInput = document.getElementById("login-email");
      const passwordInput = document.getElementById("login-password");
      const rememberMeInput = document.getElementById("remember-me");

      const email = emailInput?.value.trim() || "";
      const password = passwordInput?.value || "";
      const rememberMe = Boolean(rememberMeInput?.checked);

      // Client-side validation
      if (!email) {
        showError("Please enter your email address.");
        emailInput?.focus();
        return;
      }

      if (!password) {
        showError("Please enter your password.");
        passwordInput?.focus();
        return;
      }

      // Set Loading State
      submitBtn.classList.add("btn-loading");
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="btn-spinner"></span>
        <span>Signing in...</span>
      `;

      try {
        const user = await authApi.login({ email, password, rememberMe });
        authStore.setUser(user);

        const name = user.displayName || user.email.split("@")[0];
        showToast({
          message: `Welcome back, ${name}!`,
          type: "success",
        });
      } catch (err) {
        submitBtn.classList.remove("btn-loading");
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <span class="btn-text">Sign in</span>
          <i data-lucide="arrow-right" class="btn-icon-right" style="width: 16px; height: 16px;"></i>
        `;
        if (window.lucide) window.lucide.createIcons();

        if (err.status === 401) {
          showError("Invalid email or password.");
        } else if (err.code === "NETWORK_ERROR") {
          showError("Unable to connect to PerfectDay. Please check your network connection.");
        } else {
          showError(err.message || "An error occurred during sign in. Please try again.");
        }
      }
    });
  }

  // Google Sign-In Button Event Listener
  const googleBtn = document.getElementById("google-signin-btn");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      hideError();
      const rememberMeInput = document.getElementById("remember-me");
      const rememberMe = Boolean(rememberMeInput?.checked);

      googleBtn.disabled = true;
      try {
        const mockToken = `mock_google_token_google_${Date.now()}_googleuser_${Date.now()}@example.com_GoogleUser`;
        const user = await authApi.googleAuth({ idToken: mockToken, rememberMe });
        authStore.setUser(user);

        const name = user.displayName || user.email.split("@")[0];
        showToast({
          message: `Welcome, ${name}!`,
          type: "success",
        });
      } catch (err) {
        googleBtn.disabled = false;
        if (err.status === 409 || err.code === "ACCOUNT_EXISTS_PASSWORD_ONLY") {
          showError("An account with this email already exists using password authentication. Please sign in using your password.");
        } else {
          showError(err.message || "Google Sign-In failed. Please try again.");
        }
      }
    });
  }
};
