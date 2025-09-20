import { Router } from "express";
import { listarEventos, crearEvento, editarEvento, eliminarEvento } from "../controllers/evento.controller.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

// Backend eventos
router.get("/expedientes/:id/eventos", authRequired, listarEventos);
router.post("/expedientes/:id/eventos", authRequired, crearEvento);
router.put("/evento/:id",authRequired, editarEvento);       // asegúrate de tener esta ruta
router.delete("/evento/:id",authRequired, eliminarEvento);  // asegúrate de tener esta ruta

export default router;
