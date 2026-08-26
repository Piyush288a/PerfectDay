import { ZodError } from "zod";
import { AppError } from "../utils/errors.js";
import { sendError } from "../utils/apiResponse.js";

export const errorHandler = (err, _req, res, _next) => {
  // Handle Zod schema validation errors
  if (err instanceof ZodError) {
    const details = err.errors.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    }));
    return sendError(
      res,
      {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details,
      },
      400
    );
  }

  // Handle custom application errors
  if (err instanceof AppError) {
    return sendError(
      res,
      {
        code: err.errorCode,
        message: err.message,
        details: err.details,
      },
      err.statusCode
    );
  }

  // Handle known Prisma errors
  if (err?.code === "P2002") {
    return sendError(
      res,
      {
        code: "CONFLICT",
        message: "A unique constraint was violated",
        details: [],
      },
      409
    );
  }

  if (err?.code === "P2025") {
    return sendError(
      res,
      {
        code: "NOT_FOUND",
        message: "Requested record was not found",
        details: [],
      },
      404
    );
  }

  // Handle unexpected internal server errors
  console.error("Unhandled error:", err);

  return sendError(
    res,
    {
      code: "INTERNAL_SERVER_ERROR",
      message: "An unexpected internal server error occurred",
      details: [],
    },
    500
  );
};
