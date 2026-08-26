import { sendError } from "../utils/apiResponse.js";

export const notFound = (req, res) => {
  return sendError(
    res,
    {
      code: "NOT_FOUND",
      message: `Cannot ${req.method} ${req.originalUrl}`,
      details: [],
    },
    404
  );
};
