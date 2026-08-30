import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { env } from "../config/env.js";

// ─────────────────────────────────────────────────────────────────────────────
// Cookie names
// ─────────────────────────────────────────────────────────────────────────────
export const AUTH_COOKIE_NAME = "pd_auth";       // Short-lived access JWT
export const REFRESH_COOKIE_NAME = "pd_refresh"; // Persistent refresh token (8A)
export const OAUTH_STATE_COOKIE_NAME = "pd_oauth_state"; // OAuth CSRF state (8B)

// ─────────────────────────────────────────────────────────────────────────────
// Access token (JWT) — 1 hour, unchanged behavior
// ─────────────────────────────────────────────────────────────────────────────
export const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

// Access cookie options:
//   rememberMe=false → no maxAge (session cookie, cleared on browser close)
//   rememberMe=true  → 1h maxAge (access cookie; refresh keeps session alive)
const ACCESS_COOKIE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export const getCookieOptions = (useMaxAge = true) => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
  ...(useMaxAge ? { maxAge: ACCESS_COOKIE_MAX_AGE_MS } : {}),
});

export const setAuthCookie = (res, token, useMaxAge = true) => {
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions(useMaxAge));
};

export const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Refresh token (Phase 8A: Remember Me)
// Raw token = cryptographically random 48 bytes (hex string, 96 chars)
// Only the bcrypt hash is stored in the database; the raw value goes in the cookie
// ─────────────────────────────────────────────────────────────────────────────
export const generateRefreshToken = () => {
  return randomBytes(48).toString("hex");
};

const REFRESH_COOKIE_MAX_AGE_MS = env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000;

export const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/api/auth", // Scope to auth routes only — reduces surface area
  maxAge: REFRESH_COOKIE_MAX_AGE_MS,
});

export const setRefreshCookie = (res, rawToken) => {
  res.cookie(REFRESH_COOKIE_NAME, rawToken, getRefreshCookieOptions());
};

export const clearRefreshCookie = (res) => {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Cookie parsing helper (used by both auth middleware paths)
// ─────────────────────────────────────────────────────────────────────────────
export const parseCookie = (req, cookieName) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return null;

  for (const cookie of cookieHeader.split(";")) {
    const [rawKey, ...rawValue] = cookie.trim().split("=");
    if (rawKey.trim() === cookieName) {
      return decodeURIComponent(rawValue.join("="));
    }
  }
  return null;
};

export const extractTokenFromCookie = (req) => parseCookie(req, AUTH_COOKIE_NAME);
export const extractRefreshTokenFromCookie = (req) => parseCookie(req, REFRESH_COOKIE_NAME);
