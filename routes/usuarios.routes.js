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

router.get("/", authRequired, requireRole(["Admin"]), listarUsuarios);
router.post("/", authRequired, requireRole(["Admin"]), crearUsuario);
router.put("/:id", authRequired, requireRole(["Admin"]), actualizarUsuario);
router.delete("/:id", authRequired, requireRole(["Admin"]), eliminarUsuario);

export default router;
