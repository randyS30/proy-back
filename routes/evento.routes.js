import { Router } from "express";
import { listarEventos, crearEvento } from "../controllers/evento.controller.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/:id/eventos", authRequired, listarEventos);
router.post("/:id/eventos", authRequired, crearEvento);

export default router;
