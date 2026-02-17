import { Request, Response, NextFunction } from "express";
import { ApiError } from "../utils/apiError";

export function notFound(_req: Request, res: Response) {
  res.status(404).json({ message: "Not Found" });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err instanceof ApiError ? err.status : 500;
  res.status(status).json({
    message: err.message ?? "Server error",
    details: err.details ?? undefined
  });
}
