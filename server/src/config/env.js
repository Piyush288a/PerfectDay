import { z } from "zod";

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  CLIENT_ORIGIN: z.string().default("http://localhost:5173"),
  JWT_SECRET: z
    .string()
    .min(32, "JWT_SECRET must be at least 32 characters long"),
  JWT_EXPIRES_IN: z.string().default("1h"),
  // Phase 8A: Refresh token secret (separate from access token secret)
  REFRESH_TOKEN_SECRET: z
    .string()
    .min(32, "REFRESH_TOKEN_SECRET must be at least 32 characters long")
    .optional()
    .default("change-me-refresh-secret-at-least-32-chars"),
  // 30 days persistent session lifetime
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().default(30),
  // Phase 8B: Google OAuth 2.0 Credentials
  GOOGLE_CLIENT_ID: z.string().optional().default("mock-google-client-id.apps.googleusercontent.com"),
  GOOGLE_CLIENT_SECRET: z.string().optional().default("mock-google-client-secret"),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1);
}

export const env = parsedEnv.data;
