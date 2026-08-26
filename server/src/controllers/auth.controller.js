import * as authService from "../services/auth.service.js";
import { generateToken, setAuthCookie, clearAuthCookie } from "../utils/token.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const register = async (req, res) => {
  const user = await authService.registerUser(req.body);
  const token = generateToken({ userId: user.id });

  setAuthCookie(res, token);

  return sendSuccess(res, user, 201);
};

export const login = async (req, res) => {
  const user = await authService.loginUser(req.body);
  const token = generateToken({ userId: user.id });

  setAuthCookie(res, token);

  return sendSuccess(res, user, 200);
};

export const logout = async (_req, res) => {
  clearAuthCookie(res);

  return sendSuccess(res, { message: "Logged out successfully" }, 200);
};

export const getMe = async (req, res) => {
  const user = await authService.getCurrentUser(req.user.userId);

  return sendSuccess(res, user, 200);
};
