const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export class ApiError extends Error {
  constructor(message, { code = "API_ERROR", status = 500, details = [] } = {}) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const apiClient = async (endpoint, { method = "GET", body, headers = {} } = {}) => {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const requestOptions = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    credentials: "include", // Enforce sending/receiving HTTP-only cookies
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

  let data;
  try {
    data = await response.json();
  } catch {
    data = null;
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
