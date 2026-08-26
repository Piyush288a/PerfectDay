import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const AUTH_COOKIE_NAME = "pd_auth";
const COOKIE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

export const generateToken = (payload) => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

export const verifyToken = (token) => {
  return jwt.verify(token, env.JWT_SECRET);
};

export const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: "lax",
  maxAge: COOKIE_MAX_AGE_MS,
  path: "/",
});

export const setAuthCookie = (res, token) => {
  res.cookie(AUTH_COOKIE_NAME, token, getCookieOptions());
};

export const clearAuthCookie = (res) => {
  res.clearCookie(AUTH_COOKIE_NAME, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
};

export const extractTokenFromCookie = (req) => {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [rawKey, ...rawValue] = cookie.trim().split("=");
    if (rawKey === AUTH_COOKIE_NAME) {
      return decodeURIComponent(rawValue.join("="));
    }
  }

  return null;
};
