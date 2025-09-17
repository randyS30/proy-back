import { Router } from "express";
import { subirArchivos, listarArchivos, descargarArchivo, eliminarArchivo } from "../controllers/archivo.controller.js";
import { authRequired } from "../middleware/auth.js";
import { upload } from "../config/multer.js";

const router = Router();

router.post("/:id/archivos", authRequired, upload.array("archivos", 20), subirArchivos);
router.get("/:id/archivos", authRequired, listarArchivos);
router.get("/:id/download", authRequired, descargarArchivo);
router.delete("/:id", authRequired, eliminarArchivo);

export default router;
