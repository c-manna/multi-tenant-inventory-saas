import { Router } from "express";
import { auth } from "../middleware/auth";
import { tenantScope } from "../middleware/tenant";
import { requireRole } from "../middleware/rbac";
import { createSupplier, listSuppliers } from "../controllers/supplier.controller";

export const supplierRoutes = Router();
supplierRoutes.use(auth, tenantScope);

supplierRoutes.get("/", listSuppliers);
supplierRoutes.post("/", requireRole("OWNER","MANAGER"), createSupplier);
