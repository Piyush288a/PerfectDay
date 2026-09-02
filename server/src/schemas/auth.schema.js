import { z } from "zod";

export const registerSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters long")
    .max(72, "Password must not exceed 72 characters"),
  displayName: z
    .string()
    .trim()
    .min(1, "Display name cannot be empty")
    .max(100, "Display name must not exceed 100 characters")
    .optional(),
  timezone: z
    .string()
    .trim()
    .min(1, "Timezone cannot be empty")
    .optional(),
});

export const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Invalid email address"),
  password: z
    .string()
    .min(1, "Password is required")
    .max(72, "Password must not exceed 72 characters"),
  // Phase 8A: Remember Me — if true, a persistent refresh token session is created
  rememberMe: z.boolean().optional().default(false),
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(1, "Google ID token is required"),
  rememberMe: z.boolean().optional().default(false),
});
