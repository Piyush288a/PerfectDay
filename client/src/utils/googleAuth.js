import { authApi } from "../api/auth.js";

/**
 * Google Identity Services (GIS) Helper for PerfectDay
 *
 * Handles initialization, dynamic Client ID discovery (Vercel env or Render backend),
 * rendering of the official Google Sign-In button, and account credential callbacks.
 */

let cachedClientId = null;

export const resolveGoogleClientId = async () => {
  if (cachedClientId) return cachedClientId;

  // 1. Check client-side build-time environment variable (Vercel)
  const buildTimeId = (typeof import.meta !== "undefined" && import.meta.env?.VITE_GOOGLE_CLIENT_ID) || "";
  if (buildTimeId && buildTimeId !== "mock-google-client-id.apps.googleusercontent.com") {
    cachedClientId = buildTimeId;
    return cachedClientId;
  }

  // 2. Fallback: Dynamically query backend auth config (Render)
  try {
    const config = await authApi.getConfig();
    if (config?.googleClientId) {
      cachedClientId = config.googleClientId;
      return cachedClientId;
    }
  } catch (err) {
    console.warn("Unable to fetch auth config from backend:", err.message);
  }

  return "";
};

/**
 * Loads the Google Identity Services SDK script if not already present on the page.
 */
export const loadGoogleScript = () => {
  return new Promise((resolve) => {
    if (window.google?.accounts?.id) {
      return resolve(window.google.accounts.id);
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google?.accounts?.id));
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts?.id || attempts > 20) {
          clearInterval(interval);
          resolve(window.google?.accounts?.id);
        }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google?.accounts?.id);
    document.head.appendChild(script);
  });
};

/**
 * Initializes Google Identity Services and renders the official Google button.
 *
 * @param {Object} options
 * @param {HTMLElement|string} options.container - DOM element or selector to mount the button in
 * @param {Function} options.onSuccess - Callback receiving the ID token (credential string)
 * @param {Function} [options.onError] - Error handler
 * @param {"continue_with"|"signup_with"|"signin_with"} [options.text="continue_with"]
 * @param {number} [options.width=360]
 */
export const mountGoogleSignInButton = async ({
  container,
  onSuccess,
  onError,
  text = "continue_with",
  width = 360,
}) => {
  const containerEl = typeof container === "string" ? document.querySelector(container) : container;
  if (!containerEl) return false;

  const clientId = await resolveGoogleClientId();
  if (!clientId) {
    return false;
  }

  const googleId = await loadGoogleScript();
  if (!googleId) {
    if (onError) onError(new Error("Unable to load Google Identity Services SDK"));
    return false;
  }

  try {
    googleId.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential) {
          onSuccess(response.credential);
        } else if (onError) {
          onError(new Error("No credential returned from Google."));
        }
      },
      auto_select: false,
      cancel_on_tap_outside: true,
    });

    const isDarkMode = document.documentElement.getAttribute("data-theme") === "dark";

    // Clear placeholder and mount official Google button
    containerEl.innerHTML = "";
    googleId.renderButton(containerEl, {
      type: "standard",
      theme: isDarkMode ? "filled_black" : "outline",
      size: "large",
      text,
      shape: "rectangular",
      logo_alignment: "left",
      width: Math.min(width, containerEl.offsetWidth || width),
    });

    return true;
  } catch (err) {
    if (onError) onError(err);
    return false;
  }
};
