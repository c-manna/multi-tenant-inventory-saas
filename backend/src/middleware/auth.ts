import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { verifyJwt } from "../utils/jwt";

export function auth(req: Request, _res: Response, next: NextFunction) {
  const hdr = req.headers.authorization;
  if (!hdr?.startsWith("Bearer ")) throw new ApiError(401, "Missing token");
  const token = hdr.slice("Bearer ".length);
  const payload = verifyJwt(token);
  (req as any).user = payload;
  next();
}
