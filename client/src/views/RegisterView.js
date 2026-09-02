import { renderThemeToggleHTML } from "../components/ThemeToggle.js";
import { renderAmbientSceneHTML } from "../components/AmbientScene.js";
import { showToast } from "../components/Toast.js";
import { authApi } from "../api/auth.js";
import { authStore } from "../store/auth.js";

export const renderRegisterView = () => `
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
        <h1 class="auth-hero-title">Start your<br />journey today.</h1>
        <p class="auth-hero-lead">
          Design your routines, find your rhythm, and focus on what truly matters.
        </p>

        <div class="auth-quote-pill">
          <i data-lucide="sparkles" class="auth-quote-icon" style="width: 16px; height: 16px;"></i>
          <span>Small daily habits create extraordinary results.</span>
        </div>
      </section>

      <!-- Right Column: Register Card -->
      <section class="auth-card-col">
        <div class="auth-card">
          <div class="auth-card-header">
            <h2 class="auth-card-title">Create account</h2>
            <p class="auth-card-subtitle">Join PerfectDay and organize your life.</p>
          </div>

          <!-- Inline Error Banner -->
          <div id="register-error-banner" style="display: none; padding: 0.65rem 0.875rem; margin-bottom: var(--space-4); border-radius: var(--radius-md); background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.25); color: var(--color-danger); font-size: var(--text-xs); line-height: 1.4;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <i data-lucide="alert-triangle" style="width: 15px; height: 15px; flex-shrink: 0;"></i>
              <span id="register-error-text"></span>
            </div>
          </div>

          <form id="register-form" novalidate>
            <!-- Name Field -->
            <div class="form-group">
              <label for="register-name" class="form-label">Full Name <span style="font-weight: 400; color: var(--color-text-muted);">(optional)</span></label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <i data-lucide="user" style="width: 17px; height: 17px;"></i>
                </span>
                <input
                  type="text"
                  id="register-name"
                  name="displayName"
                  class="form-input"
                  placeholder="Alex Morgan"
                  autocomplete="name"
                />
              </div>
            </div>

            <!-- Email Field -->
            <div class="form-group">
              <label for="register-email" class="form-label">Email</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <i data-lucide="mail" style="width: 17px; height: 17px;"></i>
                </span>
                <input
                  type="email"
                  id="register-email"
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
              <label for="register-password" class="form-label">Password</label>
              <div class="input-wrapper">
                <span class="input-icon">
                  <i data-lucide="lock" style="width: 17px; height: 17px;"></i>
                </span>
                <input
                  type="password"
                  id="register-password"
                  name="password"
                  class="form-input"
                  placeholder="At least 8 characters"
                  autocomplete="new-password"
                  required
                />
                <button
                  type="button"
                  id="toggle-register-password-btn"
                  class="password-toggle-btn"
                  aria-label="Toggle password visibility"
                  title="Toggle password visibility"
                >
                  <i data-lucide="eye" id="toggle-register-password-icon" style="width: 17px; height: 17px;"></i>
                </button>
              </div>
            </div>

            <!-- Create Account Button -->
            <button type="submit" id="submit-register-btn" class="btn btn-primary btn-full" style="margin-top: var(--space-4);">
              <span class="btn-text">Create account</span>
              <i data-lucide="arrow-right" class="btn-icon-right" style="width: 16px; height: 16px;"></i>
            </button>
          </form>

          <!-- Divider -->
          <div class="divider-with-text">
            <span>or</span>
          </div>

          <!-- Google Sign-Up Button -->
          <button type="button" id="google-signup-btn" class="btn btn-google" title="Sign up with Google">
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.616z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707c-.18-.54-.282-1.117-.282-1.707 0-.59.102-1.167.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            <span>Sign up with Google</span>
          </button>

          <!-- Footer Switch -->
          <div class="auth-card-footer">
            <span>Already have an account?</span>
            <a href="#login" class="auth-switch-link">Sign in</a>
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

export const initRegisterViewEvents = () => {
  // Password Visibility Toggle
  const toggleBtn = document.getElementById("toggle-register-password-btn");
  const passwordInput = document.getElementById("register-password");
  const toggleIcon = document.getElementById("toggle-register-password-icon");

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

  // Form Submission & Real Registration
  const form = document.getElementById("register-form");
  const submitBtn = document.getElementById("submit-register-btn");
  const errorBanner = document.getElementById("register-error-banner");
  const errorText = document.getElementById("register-error-text");

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

      const nameInput = document.getElementById("register-name");
      const emailInput = document.getElementById("register-email");
      const passwordInput = document.getElementById("register-password");

      const displayName = nameInput?.value.trim() || undefined;
      const email = emailInput?.value.trim() || "";
      const password = passwordInput?.value || "";

      // Client-side validation
      if (!email) {
        showError("Please enter your email address.");
        emailInput?.focus();
        return;
      }

      if (!password) {
        showError("Please enter a password.");
        passwordInput?.focus();
        return;
      }

      if (password.length < 8) {
        showError("Password must be at least 8 characters long.");
        passwordInput?.focus();
        return;
      }

      if (password.length > 72) {
        showError("Password must not exceed 72 characters.");
        passwordInput?.focus();
        return;
      }

      // Auto-detect browser timezone
      let timezone = "UTC";
      try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      } catch {
        timezone = "UTC";
      }

      // Set Loading State
      submitBtn.classList.add("btn-loading");
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="btn-spinner"></span>
        <span>Creating account...</span>
      `;

      try {
        const user = await authApi.register({
          email,
          password,
          displayName,
          timezone,
        });

        authStore.setUser(user);

        const welcomeName = user.displayName || user.email.split("@")[0];
        showToast({
          message: `Welcome to PerfectDay, ${welcomeName}!`,
          type: "success",
        });
      } catch (err) {
        submitBtn.classList.remove("btn-loading");
        submitBtn.disabled = false;
        submitBtn.innerHTML = `
          <span class="btn-text">Create account</span>
          <i data-lucide="arrow-right" class="btn-icon-right" style="width: 16px; height: 16px;"></i>
        `;
        if (window.lucide) window.lucide.createIcons();

        if (err.status === 409) {
          showError("An account with this email already exists.");
        } else if (err.code === "NETWORK_ERROR") {
          showError("Unable to connect to PerfectDay. Please check your network connection.");
        } else if (err.status === 400 && err.details?.length) {
          const detailMsg = err.details.map((d) => d.message).join(". ");
          showError(detailMsg || err.message);
        } else {
          showError(err.message || "An error occurred during registration. Please try again.");
        }
      }
    });
  }

  // Google Sign-Up Button Event Listener
  const googleBtn = document.getElementById("google-signup-btn");
  if (googleBtn) {
    googleBtn.addEventListener("click", async () => {
      hideError();
      googleBtn.disabled = true;
      try {
        const mockToken = `mock_google_token_google_${Date.now()}_googleuser_${Date.now()}@example.com_GoogleUser`;
        const user = await authApi.googleAuth({ idToken: mockToken, rememberMe: false });
        authStore.setUser(user);

        const name = user.displayName || user.email.split("@")[0];
        showToast({
          message: `Welcome to PerfectDay, ${name}!`,
          type: "success",
        });
      } catch (err) {
        googleBtn.disabled = false;
        if (err.status === 409 || err.code === "ACCOUNT_EXISTS_PASSWORD_ONLY") {
          showError("An account with this email already exists using password authentication. Please sign in using your password.");
        } else {
          showError(err.message || "Google Sign-Up failed. Please try again.");
        }
      }
    });
  }
};
