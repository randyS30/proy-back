import { Router } from "express";
import {
  listarReportes,
  crearReporte,
  actualizarReporte,
  eliminarReporte
} from "../controllers/reporte.controller.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/expedientes/:id/reportes", authRequired, listarReportes);
router.post("/expedientes/:id/reportes", authRequired, crearReporte);
router.put("/:id", authRequired, actualizarReporte);
router.delete("/:id", authRequired, eliminarReporte);
export default router;
