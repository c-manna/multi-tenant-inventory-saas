import { Router } from "express";
import { auth } from "../middleware/auth";
import { tenantScope } from "../middleware/tenant";
import { requireRole } from "../middleware/rbac";
import { createProduct, listProducts } from "../controllers/product.controller";

export const productRoutes = Router();
productRoutes.use(auth, tenantScope);

productRoutes.get("/", listProducts);
productRoutes.post("/", requireRole("OWNER","MANAGER"), createProduct);
