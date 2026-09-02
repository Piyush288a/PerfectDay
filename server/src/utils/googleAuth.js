import { env } from "../config/env.js";
import { UnauthorizedError } from "./errors.js";

/**
 * Phase 8B — Google OAuth Token Verification Helper
 *
 * Verifies a Google ID token / Credential JWT and extracts the user's verified identity payload:
 * { googleId, email, displayName, avatarUrl }
 *
 * Supports mock verification in test environments or when mock tokens are provided.
 */
export async function verifyGoogleIdToken(idToken) {
  if (!idToken || typeof idToken !== "string") {
    throw new UnauthorizedError("Google ID token is required");
  }

  // 1. Mock / Integration Test Token Verification
  if (idToken.startsWith("mock_google_token_") || idToken.startsWith("mock_") || env.NODE_ENV === "test") {
    return parseMockGoogleToken(idToken);
  }

  // 2. Real Production/Dev Google Token Verification via OAuth2 TokenInfo endpoint
  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!response.ok) {
      throw new UnauthorizedError("Google token verification failed");
    }

    const payload = await response.json();

    // Verify audience matches configured Google Client ID
    if (env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_ID !== "mock-google-client-id.apps.googleusercontent.com") {
      if (payload.aud !== env.GOOGLE_CLIENT_ID) {
        throw new UnauthorizedError("Google token audience mismatch");
      }
    }

    // Verify email is verified by Google
    if (payload.email_verified === false || payload.email_verified === "false") {
      throw new UnauthorizedError("Google email is not verified");
    }

    return {
      googleId: payload.sub,
      email: payload.email,
      displayName: payload.name ?? payload.email.split("@")[0],
      avatarUrl: payload.picture ?? null,
    };
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error;
    throw new UnauthorizedError(`Failed to verify Google token: ${error.message}`);
  }
}

/**
 * Helper to parse test mock tokens of format:
 * "mock_google_token_{googleId}_{email:.+}_{displayName:.+}"
 * or fallback JSON string.
 */
function parseMockGoogleToken(token) {
  if (token.startsWith("mock_google_token_")) {
    const raw = token.replace("mock_google_token_", "");
    const parts = raw.split("::");
    if (parts.length >= 2) {
      return {
        googleId: parts[0],
        email: parts[1].toLowerCase(),
        displayName: parts[2] || "Google User",
        avatarUrl: "https://lh3.googleusercontent.com/a/mock_avatar",
      };
    }
    const legacyParts = raw.split("_");
    const googleId = legacyParts[0] || "mock_google_id_12345";
    const email = legacyParts[1] || `google_user_${googleId}@example.com`;
    const displayName = legacyParts[2] || "Google User";
    return {
      googleId,
      email: email.toLowerCase(),
      displayName,
      avatarUrl: "https://lh3.googleusercontent.com/a/mock_avatar",
    };
  }

  try {
    const parsed = JSON.parse(token);
    if (parsed.sub && parsed.email) {
      return {
        googleId: parsed.sub,
        email: parsed.email.toLowerCase(),
        displayName: parsed.name || parsed.email.split("@")[0],
        avatarUrl: parsed.picture || null,
      };
    }
  } catch {}

  // Standard fallback test identity
  return {
    googleId: "google_sub_100200300",
    email: "test_google_user@example.com",
    displayName: "Test Google User",
    avatarUrl: null,
  };
}
