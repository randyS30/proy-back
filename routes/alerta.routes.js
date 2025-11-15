import { Router } from "express";
import { obtenerAlertas } from "../controllers/alerta.controller.js";
import { authRequired } from "../middleware/auth.js"; // Protegemos la ruta

const router = Router();

// GET /api/alertas
router.get("/alertas", authRequired, obtenerAlertas);

export default router;