import { authApi } from "../api/auth.js";

/**
 * Google Identity Services (GIS) Helper for PerfectDay
 *
 * Handles initialization, dynamic Client ID discovery (Vercel env or Render backend),
 * official Google button rendering, and the OAuth 2.0 popup account chooser.
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
    if (window.google?.accounts?.id && window.google?.accounts?.oauth2) {
      return resolve(window.google.accounts);
    }
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing) {
      existing.addEventListener("load", () => resolve(window.google?.accounts));
      let attempts = 0;
      const interval = setInterval(() => {
        attempts++;
        if (window.google?.accounts || attempts > 20) {
          clearInterval(interval);
          resolve(window.google?.accounts);
        }
      }, 100);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google?.accounts);
    document.head.appendChild(script);
  });
};

/**
 * Triggers the Google OAuth 2.0 popup account chooser directly in response to a user click.
 * Works seamlessly across all desktop & mobile browsers.
 */
export const triggerGooglePopup = async ({ onSuccess, onError }) => {
  const clientId = await resolveGoogleClientId();
  if (!clientId) {
    if (onError) onError(new Error("Google Client ID is not configured. Please check Render or Vercel settings."));
    return;
  }

  const accounts = await loadGoogleScript();
  if (!accounts?.oauth2) {
    if (onError) onError(new Error("Google Identity Services is loading. Please try again."));
    return;
  }

  try {
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: "openid email profile",
      callback: (tokenResponse) => {
        if (tokenResponse.error) {
          const desc = tokenResponse.error_description || tokenResponse.error;
          if (onError) onError(new Error(desc));
          return;
        }
        if (tokenResponse.access_token) {
          onSuccess({ accessToken: tokenResponse.access_token });
        }
      },
      error_callback: (err) => {
        if (onError) onError(new Error(err?.message || "Google Sign-In popup closed."));
      },
    });

    tokenClient.requestAccessToken({ prompt: "select_account" });
  } catch (err) {
    if (onError) onError(err);
  }
};

/**
 * Initializes Google Identity Services and mounts the button.
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

  const accounts = await loadGoogleScript();
  if (!accounts?.id) {
    if (onError) onError(new Error("Unable to load Google Identity Services SDK"));
    return false;
  }

  try {
    accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        if (response?.credential) {
          onSuccess({ idToken: response.credential });
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
    accounts.id.renderButton(containerEl, {
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
