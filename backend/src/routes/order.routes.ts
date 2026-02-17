import { Router } from "express";
import { auth } from "../middleware/auth";
import { tenantScope } from "../middleware/tenant";
import { requireRole } from "../middleware/rbac";
import { cancelOrder, createOrder, fulfillOrder, listOrders } from "../controllers/order.controller";

export const orderRoutes = Router();
orderRoutes.use(auth, tenantScope);

orderRoutes.get("/", listOrders);
orderRoutes.post("/", requireRole("OWNER","MANAGER","STAFF"), createOrder);
orderRoutes.post("/:id/fulfill", requireRole("OWNER","MANAGER"), fulfillOrder);
orderRoutes.post("/:id/cancel", requireRole("OWNER","MANAGER"), cancelOrder);
