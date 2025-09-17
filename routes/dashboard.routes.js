import { Router } from "express";
import { getDashboard } from "../controllers/dashboard.controller.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, getDashboard);

export default router;
