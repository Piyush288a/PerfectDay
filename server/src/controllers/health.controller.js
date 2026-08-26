import { getHealthStatus } from "../services/health.service.js";
import { sendSuccess } from "../utils/apiResponse.js";

export const getHealth = async (_req, res) => {
  const healthData = await getHealthStatus();
  return sendSuccess(res, healthData, 200);
};
