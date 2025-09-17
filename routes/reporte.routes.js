import { Router } from "express";
import { listarReportes, crearReporte, eliminarReporte } from "../controllers/reporte.controller.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/:id/reportes", authRequired, listarReportes);
router.post("/:id/reportes", authRequired, crearReporte);
router.delete("/:id", authRequired, eliminarReporte);

export default router;
