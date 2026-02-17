import dotenv from "dotenv";
dotenv.config();

export const env = {
  NODE_ENV: process.env.NODE_ENV ?? "development",
  PORT: Number(process.env.PORT ?? 5000),
  MONGO_URI: process.env.MONGO_URI ?? "",
  JWT_SECRET: process.env.JWT_SECRET ?? "",
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN ?? "7d",
  CORS_ORIGIN: process.env.CORS_ORIGIN ?? "http://localhost:5173"
};

if (!env.MONGO_URI || !env.JWT_SECRET) {
  throw new Error("Missing required env vars: MONGO_URI / JWT_SECRET");
}
