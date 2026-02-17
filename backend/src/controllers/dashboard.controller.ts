import { asyncHandler } from "../utils/asyncHandler";
import { getDashboard } from "../services/dashboard.service";

export const dashboard = asyncHandler(async (req, res) => {
  const tenantId = (req as any).tenantId;
  const data = await getDashboard(tenantId);
  res.json(data);
});
