import { Router } from "express";
import { auth } from "../middleware/auth";
import { tenantScope } from "../middleware/tenant";
import { dashboard } from "../controllers/dashboard.controller";

export const dashboardRoutes = Router();
dashboardRoutes.use(auth, tenantScope);
dashboardRoutes.get("/", dashboard);
