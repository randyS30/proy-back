import { Router } from "express";
import { crearUsuario, listarUsuarios } from "../controllers/usuarios.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, requireRole(["admin"]), listarUsuarios);
router.post("/", authRequired, requireRole(["admin"]), crearUsuario);

export default router;
