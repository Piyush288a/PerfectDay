import { apiClient } from "./client.js";

export const authApi = {
  register: async ({ email, password, displayName, timezone }) => {
    return apiClient("/api/auth/register", {
      method: "POST",
      body: {
        email,
        password,
        displayName: displayName || undefined,
        timezone: timezone || undefined,
      },
    });
  },

  login: async ({ email, password, rememberMe = false }) => {
    return apiClient("/api/auth/login", {
      method: "POST",
      body: {
        email,
        password,
        rememberMe: Boolean(rememberMe),
      },
    });
  },

  refreshSession: async ({ refreshToken } = {}) => {
    return apiClient("/api/auth/refresh", {
      method: "POST",
      body: refreshToken ? { refreshToken } : undefined,
    });
  },

  logout: async ({ refreshToken } = {}) => {
    return apiClient("/api/auth/logout", {
      method: "POST",
      body: refreshToken ? { refreshToken } : undefined,
    });
  },

  getMe: async () => {
    return apiClient("/api/auth/me", {
      method: "GET",
    });
  },

  googleAuth: async ({ idToken, accessToken, rememberMe = false }) => {
    return apiClient("/api/auth/google", {
      method: "POST",
      body: {
        ...(idToken ? { idToken } : {}),
        ...(accessToken ? { accessToken } : {}),
        rememberMe: Boolean(rememberMe),
      },
    });
  },

  getConfig: async () => {
    return apiClient("/api/auth/config", {
      method: "GET",
    });
  },
};
