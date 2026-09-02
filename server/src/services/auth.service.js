import { prisma } from "../config/prisma.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import { ConflictError, UnauthorizedError } from "../utils/errors.js";

const toSafeUser = (user) => ({
  id: user.id,
  email: user.email,
  displayName: user.displayName,
  timezone: user.timezone,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

export const registerUser = async ({ email, password, displayName, timezone }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Check if a user with this email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingUser) {
    throw new ConflictError("Email is already registered");
  }

  // Hash password with bcrypt
  const passwordHash = await hashPassword(password);

  // Create User and default "Tasks" List inside a single Prisma transaction
  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        displayName: displayName || null,
        timezone: timezone || "UTC",
      },
    });

    await tx.list.create({
      data: {
        userId: user.id,
        name: "Tasks",
        isDefault: true,
      },
    });

    return user;
  });

  return toSafeUser(createdUser);
};

/**
 * Authenticate a user by email + password.
 *
 * Phase 8A: Returns the safe user object. The controller decides whether
 * to issue a refresh session based on rememberMe.
 */
export const loginUser = async ({ email, password }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // Find user by normalized email
  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  // Guard: user must exist and have a password (not Google-only account)
  if (!user) {
    throw new UnauthorizedError("Invalid email or password");
  }

  if (!user.passwordHash) {
    // Google-only account — cannot log in with password
    throw new UnauthorizedError(
      "This account uses Google Sign-In. Please continue with Google."
    );
  }

  // Verify password with bcrypt
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    throw new UnauthorizedError("Invalid email or password");
  }

  return toSafeUser(user);
};

export const getCurrentUser = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new UnauthorizedError("User not found");
  }

  return toSafeUser(user);
};

/**
 * Phase 8B: Authenticate or Register via Google OAuth 2.0.
 *
 * Rules (Phase 8 Non-Negotiable Directive):
 *  1. Look up User by googleId. If found -> return user.
 *  2. If not found by googleId, check if email exists in DB:
 *     - If email exists (user has passwordHash set or different googleId) ->
 *       THROW ConflictError ("An account with this email already exists using password authentication. Please sign in with your password.", { errorCode: "ACCOUNT_EXISTS_PASSWORD_ONLY" }).
 *       Do NOT silently merge or link accounts.
 *  3. If not found by email or googleId -> Create new User (passwordHash: null, googleId) + default "Tasks" list in transaction.
 */
export const authenticateWithGoogle = async ({ googleId, email, displayName }) => {
  const normalizedEmail = email.trim().toLowerCase();

  // 1. Look up by googleId first
  const existingGoogleUser = await prisma.user.findUnique({
    where: { googleId },
  });

  if (existingGoogleUser) {
    return { user: toSafeUser(existingGoogleUser), isNew: false };
  }

  // 2. Look up by email to check for conflicting password account
  const existingEmailUser = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existingEmailUser) {
    // Conflict: Existing password account with same email — DO NOT MERGE SILENTLY
    throw new ConflictError(
      "An account with this email already exists using password authentication. Please sign in with your password.",
      "ACCOUNT_EXISTS_PASSWORD_ONLY"
    );
  }

  // 3. Register new Google User & default Tasks list in transaction
  const createdUser = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: normalizedEmail,
        googleId,
        passwordHash: null,
        displayName: displayName || normalizedEmail.split("@")[0],
        timezone: "UTC",
      },
    });

    await tx.list.create({
      data: {
        userId: user.id,
        name: "Tasks",
        isDefault: true,
      },
    });

    return user;
  });

  return { user: toSafeUser(createdUser), isNew: true };
};
