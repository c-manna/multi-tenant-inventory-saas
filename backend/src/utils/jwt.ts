import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayload = {
  sub: string; // userId
  tenantId: string;
  role: "OWNER" | "MANAGER" | "STAFF";
};

export function signJwt(payload: JwtPayload) {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export function verifyJwt(token: string) {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
}
