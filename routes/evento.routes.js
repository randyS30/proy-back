import { Router } from "express";
import {
  listarEventos,
  crearEvento,
  editarEvento,
  eliminarEvento,
} from "../controllers/evento.controller.js";
import { authRequired } from "../middleware/auth.js"; // si usas auth

const router = Router();

// Listar eventos de un expediente
router.get("/expedientes/:id/eventos", authRequired, listarEventos);

// Crear evento para un expediente
router.post("/expedientes/:id/eventos", authRequired, crearEvento);

// Editar evento
router.put("/eventos/:id", authRequired, editarEvento);

// Eliminar evento
router.delete("/eventos/:id", authRequired, eliminarEvento);

export default router;
