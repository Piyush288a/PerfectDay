const API_BASE_URL = (typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL) || "http://localhost:3000";

export class ApiError extends Error {
  constructor(message, { code = "API_ERROR", status = 500, details = [] } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const getStoredToken = () => {
  try {
    return localStorage.getItem("pd_auth_token") || null;
  } catch {
    return null;
  }
};

export const setStoredToken = (token) => {
  try {
    if (token) {
      localStorage.setItem("pd_auth_token", token);
    } else {
      localStorage.removeItem("pd_auth_token");
    }
  } catch {}
};

export const getStoredRefreshToken = () => {
  try {
    return localStorage.getItem("pd_refresh_token") || null;
  } catch {
    return null;
  }
};

export const setStoredRefreshToken = (token) => {
  try {
    if (token) {
      localStorage.setItem("pd_refresh_token", token);
    } else {
      localStorage.removeItem("pd_refresh_token");
    }
  } catch {}
};

export const apiClient = async (endpoint, { method = "GET", body, headers = {} } = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const token = getStoredToken();
  const refreshToken = getStoredRefreshToken();

  const requestHeaders = {
    "Content-Type": "application/json",
    ...headers,
  };

  // Attach Bearer token to circumvent third-party cookie blocking across Vercel & Render
  if (token && !requestHeaders["Authorization"]) {
    requestHeaders["Authorization"] = `Bearer ${token}`;
  }

  if (refreshToken && !requestHeaders["X-Refresh-Token"]) {
    requestHeaders["X-Refresh-Token"] = refreshToken;
  }

  const requestOptions = {
    method,
    headers: requestHeaders,
    credentials: "include", // Enforce sending/receiving HTTP-only cookies where supported
  };

  if (body !== undefined) {
    requestOptions.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, requestOptions);
  } catch (networkError) {
    throw new ApiError("Unable to connect to PerfectDay. Please check your network connection.", {
      code: "NETWORK_ERROR",
      status: 0,
    });
  }

  // Capture rotated access token if returned by backend in header
  const newAccessToken = response.headers.get("X-New-Access-Token");
  if (newAccessToken) {
    setStoredToken(newAccessToken);
  }

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  // If 401 Unauthorized and we have a refreshToken, try silent refresh once
  if (response.status === 401 && refreshToken && !endpoint.includes("/auth/refresh") && !endpoint.includes("/auth/login")) {
    try {
      const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Refresh-Token": refreshToken,
        },
        body: JSON.stringify({ refreshToken }),
        credentials: "include",
      });

      if (refreshRes.ok) {
        const refreshJson = await refreshRes.json();
        const refreshedData = refreshJson?.data;
        if (refreshedData?.token) {
          setStoredToken(refreshedData.token);
          if (refreshedData.refreshToken) {
            setStoredRefreshToken(refreshedData.refreshToken);
          }
          // Retry the original failed request with the new access token
          requestHeaders["Authorization"] = `Bearer ${refreshedData.token}`;
          if (refreshedData.refreshToken) {
            requestHeaders["X-Refresh-Token"] = refreshedData.refreshToken;
          }
          response = await fetch(url, { ...requestOptions, headers: requestHeaders });
          try {
            data = await response.json();
          } catch {
            data = null;
          }
        }
      }
    } catch {}
  }

  if (!response.ok) {
    const errorInfo = data?.error || {};
    throw new ApiError(errorInfo.message || "An unexpected error occurred", {
      code: errorInfo.code || `HTTP_${response.status}`,
      status: response.status,
      details: errorInfo.details || [],
    });
  }

  return data?.data ?? data;
};
