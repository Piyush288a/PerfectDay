import { extractTokenFromCookie, verifyToken } from "../utils/token.js";
import { UnauthorizedError } from "../utils/errors.js";

export const requireAuth = (req, _res, next) => {
  const token = extractTokenFromCookie(req);

  if (!token) {
    throw new UnauthorizedError("Authentication required");
  }

  try {
    const decoded = verifyToken(token);

    if (!decoded || !decoded.userId) {
      throw new UnauthorizedError("Invalid authentication token");
    }

    req.user = {
      userId: decoded.userId,
    };

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new UnauthorizedError("Authentication token expired");
    }
    if (error.name === "JsonWebTokenError") {
      throw new UnauthorizedError("Invalid authentication token");
    }
    throw error;
  }
};
