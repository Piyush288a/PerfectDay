import { Router } from "express";
import * as authController from "../controllers/auth.controller.js";
import { validate } from "../middleware/validate.js";
import { requireAuth } from "../middleware/auth.js";
import { registerSchema, loginSchema, googleAuthSchema } from "../schemas/auth.schema.js";

const router = Router();

router.post("/register", validate({ body: registerSchema }), authController.register);
router.post("/login",    validate({ body: loginSchema }),    authController.login);
router.post("/logout",   authController.logout);
router.get("/me",        requireAuth,                        authController.getMe);

// Phase 8A — Transparent session refresh (rotates pd_refresh, issues new pd_auth)
router.post("/refresh", authController.refresh);

// Phase 8B — Continue with Google OAuth
router.post("/google",  validate({ body: googleAuthSchema }), authController.googleAuth);

export default router;
