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

  refreshSession: async () => {
    return apiClient("/api/auth/refresh", {
      method: "POST",
    });
  },

  logout: async () => {
    return apiClient("/api/auth/logout", {
      method: "POST",
    });
  },

  getMe: async () => {
    return apiClient("/api/auth/me", {
      method: "GET",
    });
  },
};
