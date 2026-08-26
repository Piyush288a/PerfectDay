import { renderLoginView, initLoginViewEvents } from "../views/LoginView.js";
import { renderRegisterView, initRegisterViewEvents } from "../views/RegisterView.js";
import { renderAppShellView, initAppShellEvents } from "../views/AppShellView.js";
import { initIcons } from "./icons.js";
import { initParallax, renderAmbientSceneHTML } from "../components/AmbientScene.js";
import { authStore } from "../store/auth.js";

let cleanupParallax = null;

const renderLoadingView = () => `
  <div class="auth-page" style="justify-content: center; align-items: center; min-height: 100vh;">
    ${renderAmbientSceneHTML()}
    <div style="display: flex; flex-direction: column; align-items: center; gap: 1rem; z-index: 10;">
      <div style="width: 44px; height: 44px; border-radius: var(--radius-full); background: var(--color-primary-light); color: var(--color-primary); display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px var(--color-primary-glow);">
        <i data-lucide="sun" style="width: 24px; height: 24px;"></i>
      </div>
      <div style="display: flex; align-items: center; gap: 0.5rem; font-size: var(--text-sm); color: var(--color-text-secondary); font-weight: 500;">
        <span class="btn-spinner" style="border-top-color: var(--color-primary); width: 14px; height: 14px;"></span>
        <span>Preparing your day...</span>
      </div>
    </div>
  </div>
`;

export const navigate = () => {
  const hash = window.location.hash || "#login";
  const appContainer = document.getElementById("app");
  if (!appContainer) return;

  const { status } = authStore.getState();

  // 1. Initial Session Check (Loading state)
  if (status === "loading") {
    appContainer.innerHTML = renderLoadingView();
    initIcons();
    return;
  }

  // Cleanup existing parallax listeners
  if (cleanupParallax) {
    cleanupParallax();
    cleanupParallax = null;
  }

  // 2. Protected Route Guards
  if (status === "authenticated") {
    // If authenticated user visits #login or #register, redirect to #app
    if (hash === "#login" || hash === "#register" || hash === "") {
      window.location.hash = "#app";
      return;
    }

    // Render Authenticated App Shell
    appContainer.innerHTML = renderAppShellView();
    initAppShellEvents();
  } else {
    // If unauthenticated user visits #app, redirect to #login
    if (hash === "#app") {
      window.location.hash = "#login";
      return;
    }

    if (hash === "#register") {
      appContainer.innerHTML = renderRegisterView();
      initRegisterViewEvents();
      cleanupParallax = initParallax();
    } else {
      // Default to #login
      appContainer.innerHTML = renderLoginView();
      initLoginViewEvents();
      cleanupParallax = initParallax();
    }
  }

  // Refresh Lucide icons in newly rendered DOM
  initIcons();
};

export const initRouter = () => {
  window.addEventListener("hashchange", navigate);
  authStore.subscribe(() => {
    navigate();
  });
  navigate();
};
