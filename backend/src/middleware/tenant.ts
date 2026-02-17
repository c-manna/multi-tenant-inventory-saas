import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

export function tenantScope(req: Request, _res: Response, next: NextFunction) {
  const u = (req as any).user;
  if (!u?.tenantId) throw new ApiError(401, "Tenant missing in token");
  (req as any).tenantId = u.tenantId;
  next();
}
