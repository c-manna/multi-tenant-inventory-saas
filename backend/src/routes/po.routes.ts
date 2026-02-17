import { Router } from "express";
import { auth } from "../middleware/auth";
import { tenantScope } from "../middleware/tenant";
import { requireRole } from "../middleware/rbac";
import { createPO, listPOs, receivePO, updatePOStatus } from "../controllers/po.controller";

export const poRoutes = Router();
poRoutes.use(auth, tenantScope);

poRoutes.get("/", listPOs);
poRoutes.post("/", requireRole("OWNER","MANAGER"), createPO);
poRoutes.patch("/:id/status", requireRole("OWNER","MANAGER"), updatePOStatus);
poRoutes.post("/:id/receive", requireRole("OWNER","MANAGER"), receivePO);
