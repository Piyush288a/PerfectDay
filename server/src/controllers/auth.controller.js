import * as authService from "../services/auth.service.js";
import {
  generateToken,
  setAuthCookie,
  clearAuthCookie,
  generateRefreshToken,
  setRefreshCookie,
  clearRefreshCookie,
  extractRefreshTokenFromCookie,
} from "../utils/token.js";
import {
  createSession,
  validateAndRotateSession,
  revokeSessionByToken,
} from "../utils/session.js";
import { sendSuccess } from "../utils/apiResponse.js";
import { UnauthorizedError } from "../utils/errors.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export const register = async (req, res) => {
  const user = await authService.registerUser(req.body);
  const token = generateToken({ userId: user.id });

  // Registration always uses a session cookie (no Remember Me on register)
  setAuthCookie(res, token, false);

  return sendSuccess(res, user, 201);
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// Phase 8A: accepts rememberMe boolean in body
// ─────────────────────────────────────────────────────────────────────────────
export const login = async (req, res) => {
  const { rememberMe = false } = req.body;

  const user = await authService.loginUser(req.body);
  const token = generateToken({ userId: user.id });

  if (rememberMe) {
    // Remember Me ON:
    //   - Access cookie: 1h maxAge (will be transparently refreshed)
    //   - Refresh cookie: 30-day maxAge, HTTP-only, scoped to /api/auth
    setAuthCookie(res, token, true);

    const rawRefreshToken = generateRefreshToken();
    const metadata = {
      userAgent: req.headers["user-agent"] ?? null,
      ipAddress: req.ip ?? null,
    };
    await createSession(user.id, rawRefreshToken, metadata);
    setRefreshCookie(res, rawRefreshToken);
  } else {
    // Remember Me OFF: session cookie (no maxAge), cleared when browser closes
    setAuthCookie(res, token, false);
    // No refresh cookie — purely session-based
  }

  return sendSuccess(res, { ...user, rememberMe }, 200);
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/refresh
// Phase 8A: transparently rotate refresh token and issue new access JWT
// ─────────────────────────────────────────────────────────────────────────────
export const refresh = async (req, res) => {
  const rawToken = extractRefreshTokenFromCookie(req);

  if (!rawToken) {
    throw new UnauthorizedError("No refresh token present");
  }

  const metadata = {
    userAgent: req.headers["user-agent"] ?? null,
    ipAddress: req.ip ?? null,
  };

  const { userId, newRawToken } = await validateAndRotateSession(rawToken, metadata);

  // Issue new access JWT
  const newAccessToken = generateToken({ userId });
  setAuthCookie(res, newAccessToken, true);

  // Set rotated refresh cookie
  setRefreshCookie(res, newRawToken);

  // Fetch user for the response
  const user = await authService.getCurrentUser(userId);

  return sendSuccess(res, user, 200);
};

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/logout
// Phase 8A: also revokes the Session record if one exists
// ─────────────────────────────────────────────────────────────────────────────
export const logout = async (req, res) => {
  // Revoke persistent session if one exists (Remember Me was ON)
  const rawRefreshToken = extractRefreshTokenFromCookie(req);
  if (rawRefreshToken) {
    await revokeSessionByToken(rawRefreshToken).catch((err) => {
      console.warn("Session revocation warning during logout:", err.message);
    });
  }

  clearAuthCookie(res);
  clearRefreshCookie(res);

  return sendSuccess(res, { message: "Logged out successfully" }, 200);
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = async (req, res) => {
  const user = await authService.getCurrentUser(req.user.userId);

  return sendSuccess(res, user, 200);
};
