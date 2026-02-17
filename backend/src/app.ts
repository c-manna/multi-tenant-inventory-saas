import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env";
import { notFound, errorHandler } from "./middleware/error";

import { authRoutes } from "./routes/auth.routes";
import { productRoutes } from "./routes/product.routes";
import { supplierRoutes } from "./routes/supplier.routes";
import { poRoutes } from "./routes/po.routes";
import { orderRoutes } from "./routes/order.routes";
import { dashboardRoutes } from "./routes/dashboard.routes";

export function createApp() {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN, credentials: true }));
  app.use(express.json({ limit: "2mb" }));
  app.use(morgan("dev"));

  app.get("/health", (_req, res) => res.json({ ok: true }));

  app.use("/api/auth", authRoutes);
  app.use("/api/products", productRoutes);
  app.use("/api/suppliers", supplierRoutes);
  app.use("/api/purchase-orders", poRoutes);
  app.use("/api/orders", orderRoutes);
  app.use("/api/dashboard", dashboardRoutes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
