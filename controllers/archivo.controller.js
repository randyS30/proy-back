import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { uploadDir } from "../config/multer.js"; // Importamos el uploadDir
import { ok, fail } from "../utils/response.js";

// Esta función es llamada por archivo.routes.js
export const descargarArchivo = async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM archivos WHERE id=$1", [req.params.id]);
    if (r.rows.length === 0) return fail(res, 404, "Archivo no encontrado en la base de datos");

    const file = r.rows[0];
    
    // file.archivo_path será "PREPARADO_DEMANDA.pdf" (gracias al mago)
    const filePath = path.join(uploadDir, file.archivo_path); 

    if (!fs.existsSync(filePath)) {
      console.error(`Archivo no encontrado: ${filePath}`);
      return fail(res, 404, "El archivo físico no se encuentra en el servidor");
    }

    // Enviar el archivo para descarga, usando el nombre original
    res.download(filePath, file.nombre_original);
  } catch (err) {
    console.error("Error al descargar archivo:", err.message);
    fail(res, 500, err.message);
  }
};

// Esta función es llamada por archivo.routes.js
export const eliminarArchivo = async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query("DELETE FROM archivos WHERE id=$1 RETURNING *", [id]);
    if (r.rows.length === 0) return fail(res, 404, "Archivo no encontrado");

    const archivoBorrado = r.rows[0];
    
    // IMPORTANTE: No borramos el archivo físico si es uno "preparado"
    if (!archivoBorrado.archivo_path.startsWith("PREPARADO_")) {
      const filePath = path.join(uploadDir, archivoBorrado.archivo_path);
      if (fs.existsSync(filePath)) {
        try { 
          fs.unlinkSync(filePath); 
        } catch (e) { 
          console.warn("No se pudo borrar archivo físico:", e.message); 
        }
      }
    }

    ok(res, { archivo: archivoBorrado });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

// ---
// Las siguientes funciones (subir, listar) están definidas en
// expediente.controller.js porque tus rutas las llaman desde allí.
// Las dejamos aquí comentadas por si mueves tus rutas en el futuro.
// ---

// export const subirArchivos = async (req, res) => {
//   // La lógica está en expediente.controller.js
// };
// export const listarArchivos = async (req, res) => {
//   // La lógica está en expediente.controller.js
// };