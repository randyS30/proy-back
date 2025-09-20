import { Router } from "express";
import { subirArchivos, listarArchivos, descargarArchivo, eliminarArchivo } from "../controllers/archivo.controller.js";
import { authRequired } from "../middleware/auth.js";
import { upload } from "../config/multer.js";

const router = Router();

router.post("/:id/archivos", authRequired, upload.array("archivos", 20), subirArchivos);
router.get("/:id/archivos", authRequired, listarArchivos);
router.get("/:id/download", authRequired, descargarArchivo);
router.delete("/:id", authRequired, eliminarArchivo);


router.post("/:id/analizar", async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query("SELECT * FROM archivos WHERE id=$1", [id]);
    if (r.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Archivo no encontrado" });
    }

    const archivo = r.rows[0];
    const filePath = `uploads/${archivo.nombre_guardado}`;

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: "Archivo no existe físicamente" });
    }

    const analisis = await analizarArchivoIA(filePath, archivo.nombre_original);

    // 👉 Guardar el reporte en la BD
    const result = await pool.query(
      "INSERT INTO reportes (expediente_id, contenido, generado_por) VALUES ($1, $2, $3) RETURNING *",
      [archivo.expediente_id, analisis, "IA"]
    );

    res.json({ success: true, reporte: result.rows[0] });
  } catch (err) {
    console.error("Error analizando archivo:", err);
    res.status(500).json({ success: false, message: "Error en análisis IA" });
  }
});

export default router;
