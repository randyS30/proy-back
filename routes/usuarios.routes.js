// routes/usuarios.routes.js
import { Router } from "express";
import {
  crearUsuario,
  listarUsuarios,
  actualizarUsuario,
  eliminarUsuario,
} from "../controllers/usuarios.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, requireRole(["admin"]), listarUsuarios);
router.post("/", authRequired, requireRole(["admin"]), crearUsuario);
router.put("/:id", authRequired, requireRole(["admin"]), actualizarUsuario);
router.delete("/:id", authRequired, requireRole(["admin"]), eliminarUsuario);

export default router;
