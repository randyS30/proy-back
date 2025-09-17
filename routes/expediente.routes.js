import { Router } from "express";
import {
  listarExpedientes,
  crearExpediente,
  obtenerExpediente,
  actualizarExpediente,
  eliminarExpediente,
  analizarExpediente,
  listarEventos,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  listarReportes,
  crearReporte,
  actualizarReporte,
  eliminarReporte,
  listarArchivos,
  subirArchivos,
  eliminarArchivo,
  analizarArchivo,
} from "../controllers/expediente.controller.js";
import { authRequired, requireRole } from "../middleware/auth.js";
import upload from "../middleware/upload.js"; // para multer

const router = Router();

// CRUD
router.get("/", authRequired, listarExpedientes);
router.post("/", authRequired, requireRole(["admin", "abogado"]), crearExpediente);
router.get("/:id", authRequired, obtenerExpediente);
router.put("/:id", authRequired, requireRole(["admin", "abogado"]), actualizarExpediente);
router.delete("/:id", authRequired, requireRole(["admin"]), eliminarExpediente);

// IA
router.post("/:id/analizar", authRequired, analizarExpediente);
router.post("/archivos/:id/analizar", authRequired, analizarArchivo);

// 📌 Eventos
router.get("/:id/eventos", authRequired, listarEventos);
router.post("/:id/eventos", authRequired, requireRole(["admin", "abogado"]), crearEvento);
router.put("/eventos/:eventoId", authRequired, actualizarEvento);
router.delete("/eventos/:eventoId", authRequired, eliminarEvento);

// 📌 Reportes
router.get("/:id/reportes", authRequired, listarReportes);
router.post("/:id/reportes", authRequired, requireRole(["admin", "abogado"]), crearReporte);
router.put("/reportes/:reporteId", authRequired, actualizarReporte);
router.delete("/reportes/:reporteId", authRequired, eliminarReporte);

// 📌 Archivos
router.get("/:id/archivos", authRequired, listarArchivos);
router.post("/:id/archivos", authRequired, upload.array("archivos"), subirArchivos);
router.delete("/archivos/:archivoId", authRequired, eliminarArchivo);
router.post("/archivos/:archivoId/analizar", authRequired, analizarArchivo);


export default router;
