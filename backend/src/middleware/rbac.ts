import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

export function requireRole(...allowed: Array<"OWNER"|"MANAGER"|"STAFF">) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const role = (req as any).user?.role;
    if (!allowed.includes(role)) throw new ApiError(403, "Forbidden");
    next();
  };
}
