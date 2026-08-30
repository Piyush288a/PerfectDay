/**
 * Phase 8A — Server-side Session Management (Remember Me)
 *
 * Design:
 *   - A raw refresh token (96-char hex) is placed in the pd_refresh HTTP-only cookie.
 *   - Only the bcrypt hash of that raw token is stored in the Session table.
 *   - On each refresh, the old session is revoked and a new one is created (rotation).
 *   - Logout revokes the current session so stolen tokens cannot be reused.
 */

import bcrypt from "bcrypt";
import { prisma } from "../config/prisma.js";
import { env } from "../config/env.js";
import { UnauthorizedError } from "./errors.js";

const HASH_ROUNDS = 10; // Lower than password rounds — token already has high entropy

/**
 * Hash a raw refresh token for storage.
 */
export const hashRefreshToken = async (rawToken) => {
  return bcrypt.hash(rawToken, HASH_ROUNDS);
};

/**
 * Create a new Session record in the database.
 *
 * @param {string} userId
 * @param {string} rawToken - The raw refresh token (will be hashed before storage)
 * @param {object} metadata - Optional: { userAgent, ipAddress }
 * @returns {Promise<import("@prisma/client").Session>}
 */
export const createSession = async (userId, rawToken, metadata = {}) => {
  const tokenHash = await hashRefreshToken(rawToken);

  const expiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
  );

  return prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
      userAgent: metadata.userAgent ?? null,
      ipAddress: metadata.ipAddress ?? null,
    },
  });
};

/**
 * Validate a raw refresh token against the database and rotate it.
 *
 * Steps:
 *   1. Find all non-revoked, non-expired sessions for context.
 *   2. Bcrypt-compare rawToken against each session's tokenHash.
 *   3. If matched: revoke the old session, create a new one (rotation), return new token.
 *   4. If not matched or expired/revoked: throw UnauthorizedError.
 *
 * @param {string} rawToken - Raw token from pd_refresh cookie
 * @param {object} metadata - Optional: { userAgent, ipAddress }
 * @returns {Promise<{ userId: string; newRawToken: string }>}
 */
export const validateAndRotateSession = async (rawToken, metadata = {}) => {
  if (!rawToken) {
    throw new UnauthorizedError("Refresh token missing");
  }

  // Find candidate sessions — we compare by brute-force bcrypt since we can't
  // lookup by raw token. Limit to recent active sessions per user to bound cost.
  // Sessions are indexed by userId, but we need to scan all non-revoked ones.
  // In practice, a user will have at most a handful of concurrent sessions.
  const now = new Date();

  const activeSessions = await prisma.session.findMany({
    where: {
      revokedAt: null,
      expiresAt: { gt: now },
    },
    // Limit scan to prevent DoS — legitimate users won't have hundreds of sessions
    take: 200,
    orderBy: { lastUsedAt: "desc" },
  });

  let matchedSession = null;

  for (const session of activeSessions) {
    const isMatch = await bcrypt.compare(rawToken, session.tokenHash);
    if (isMatch) {
      matchedSession = session;
      break;
    }
  }

  if (!matchedSession) {
    throw new UnauthorizedError("Invalid or expired refresh token");
  }

  // Rotate: revoke old session and create a new one atomically
  const { randomBytes } = await import("crypto");
  const newRawToken = randomBytes(48).toString("hex");
  const newTokenHash = await hashRefreshToken(newRawToken);
  const newExpiresAt = new Date(
    Date.now() + env.REFRESH_TOKEN_EXPIRES_DAYS * 24 * 60 * 60 * 1000
  );

  await prisma.$transaction([
    // Revoke old session
    prisma.session.update({
      where: { id: matchedSession.id },
      data: { revokedAt: now },
    }),
    // Create new rotated session
    prisma.session.create({
      data: {
        userId: matchedSession.userId,
        tokenHash: newTokenHash,
        expiresAt: newExpiresAt,
        userAgent: metadata.userAgent ?? matchedSession.userAgent,
        ipAddress: metadata.ipAddress ?? matchedSession.ipAddress,
      },
    }),
  ]);

  return { userId: matchedSession.userId, newRawToken };
};

/**
 * Revoke the session matching a raw refresh token (called on logout).
 * Silently does nothing if no session is found (e.g., already expired).
 *
 * @param {string} rawToken - Raw token from pd_refresh cookie
 */
export const revokeSessionByToken = async (rawToken) => {
  if (!rawToken) return;

  const now = new Date();

  const activeSessions = await prisma.session.findMany({
    where: {
      revokedAt: null,
      expiresAt: { gt: now },
    },
    take: 200,
    orderBy: { lastUsedAt: "desc" },
  });

  for (const session of activeSessions) {
    const isMatch = await bcrypt.compare(rawToken, session.tokenHash);
    if (isMatch) {
      await prisma.session.update({
        where: { id: session.id },
        data: { revokedAt: now },
      });
      break;
    }
  }
};

/**
 * Revoke ALL active sessions for a user (use for security events, not normal logout).
 *
 * @param {string} userId
 */
export const revokeAllUserSessions = async (userId) => {
  await prisma.session.updateMany({
    where: {
      userId,
      revokedAt: null,
    },
    data: { revokedAt: new Date() },
  });
};
