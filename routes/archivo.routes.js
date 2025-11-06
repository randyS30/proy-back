import { Router } from "express";
// Importamos las funciones del controlador de *archivos*
import { 
  descargarArchivo, 
  eliminarArchivo 
} from "../controllers/archivo.controller.js";
// Importamos la función de analizar del controlador de *expedientes*
import { analizarArchivo } from "../controllers/expediente.controller.js"; 
import { authRequired } from "../middleware/auth.js";
// No necesitamos 'upload' aquí

const router = Router();

// Ruta de Descarga: GET /api/archivos/:id/download
// Tu frontend la llama como: `${API}/api/archivos/${ar.id}/download`
// PERO tu ruta en archivo.routes.js dice "/:id/download"
// Asumiré que tu 'server.js' monta esto en '/api/archivos'
router.get("/:id/download", authRequired, descargarArchivo);

// Ruta de Eliminación: DELETE /api/archivos/:id
// Tu frontend la llama como: `${API}/api/archivos/${id}`
router.delete("/:id", authRequired, eliminarArchivo);

// Ruta de Análisis: POST /api/expedientes/archivos/:id/analizar
// Esta ruta no pertenece aquí según tu frontend.
// La ruta correcta está en expediente.routes.js

export default router;