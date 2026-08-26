export const sendSuccess = (res, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
  });
};

export const sendError = (
  res,
  { code = "INTERNAL_SERVER_ERROR", message = "An unexpected error occurred", details = [] },
  statusCode = 500
) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details,
    },
  });
};
