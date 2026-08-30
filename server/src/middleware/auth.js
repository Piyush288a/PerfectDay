import {
  extractTokenFromCookie,
  extractRefreshTokenFromCookie,
  verifyToken,
  generateToken,
  setAuthCookie,
  setRefreshCookie,
} from "../utils/token.js";
import { validateAndRotateSession } from "../utils/session.js";
import { UnauthorizedError } from "../utils/errors.js";

/**
 * requireAuth middleware — Phase 8A aware.
 *
 * Flow:
 *   1. Try to verify the pd_auth access JWT.
 *   2. If valid → attach req.user, continue.
 *   3. If expired AND pd_refresh cookie present → attempt token refresh:
 *        a. Rotate session (revoke old, create new).
 *        b. Issue new access JWT cookie.
 *        c. Set new refresh cookie.
 *        d. Attach req.user, continue.
 *   4. If any step fails → throw UnauthorizedError (→ 401).
 */
export const requireAuth = async (req, res, next) => {
  const token = extractTokenFromCookie(req);

  if (!token) {
    // No access token at all — check for refresh token before giving up
    const rawRefresh = extractRefreshTokenFromCookie(req);
    if (rawRefresh) {
      return attemptRefresh(req, res, next, rawRefresh);
    }
    throw new UnauthorizedError("Authentication required");
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      throw new UnauthorizedError("Invalid authentication token");
    }

    req.user = { userId: decoded.userId };
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      // Access token expired or invalid — try to silently refresh using pd_refresh
      const rawRefresh = extractRefreshTokenFromCookie(req);
      if (rawRefresh) {
        return attemptRefresh(req, res, next, rawRefresh);
      }
      throw new UnauthorizedError(
        error.name === "TokenExpiredError"
          ? "Authentication token expired"
          : "Invalid authentication token"
      );
    }

    throw error;
  }
};

/**
 * Attempt to use the refresh token to get a new access token transparently.
 * On success: issues new cookies, attaches req.user, calls next().
 * On failure: throws UnauthorizedError.
 */
const attemptRefresh = async (req, res, next, rawRefresh) => {
  try {
    const metadata = {
      userAgent: req.headers["user-agent"] ?? null,
      ipAddress: req.ip ?? null,
    };

    const { userId, newRawToken } = await validateAndRotateSession(rawRefresh, metadata);

    // Issue new access JWT
    const newAccessToken = generateToken({ userId });
    setAuthCookie(res, newAccessToken, true);

    // Set rotated refresh cookie
    setRefreshCookie(res, newRawToken);

    req.user = { userId };
    return next();
  } catch {
    throw new UnauthorizedError("Session expired — please sign in again");
  }
};
