import pool from "../config/db.js";
import fs from "fs";
import path from "path";
import { uploadDir } from "../config/multer.js";
import { ok, fail } from "../utils/response.js";

export const subirArchivos = async (req, res) => {
  try {
    const expedienteId = parseInt(req.params.id);

    // 1. CORRECCIÓN CRÍTICA DE LÓGICA
    // Si req.user no existe (autenticación fallida/incompleta), 
    // usamos el valor que envías en el body (req.body.subido_por, que debe ser "1"),
    // o un fallback numérico simple (1) como última opción.
    const subidoPor = req.user 
        ? req.user.id 
        : req.body.subido_por || '1'; // Usamos '1' como valor de respaldo

    const results = [];
    for (const f of req.files) {
      const inserted = await pool.query(
        `INSERT INTO archivos (expediente_id, nombre_original, archivo_path, tipo_mime, subido_por, subido_en)
         VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *`,
        [expedienteId, f.originalname, f.filename, f.mimetype, subidoPor]
      );
      results.push(inserted.rows[0]);
    }
    ok(res, { archivos: results });
  } catch (err) {
    // 2. CORRECCIÓN DE DEBUGGING: Imprimir el error para verlo en Railway Logs
    console.error("Error crítico al subir archivo (detalles):", err);
    fail(res, 500, err.message);
  }
};

export const listarArchivos = async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM archivos WHERE expediente_id=$1 ORDER BY id DESC", [req.params.id]);
    ok(res, { archivos: r.rows });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const descargarArchivo = async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM archivos WHERE id=$1", [req.params.id]);
    if (r.rows.length === 0) return fail(res, 404, "Archivo no encontrado");

    const file = r.rows[0];
    const filePath = path.join(uploadDir, file.archivo_path);
    if (!fs.existsSync(filePath)) return fail(res, 404, "Archivo físico no encontrado");

    res.download(filePath, file.nombre_original);
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const eliminarArchivo = async (req, res) => {
  try {
    const r = await pool.query("DELETE FROM archivos WHERE id=$1 RETURNING *", [req.params.id]);
    if (r.rows.length === 0) return fail(res, 404, "Archivo no encontrado");

    const filePath = path.join(uploadDir, r.rows[0].archivo_path);
    if (fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) { console.warn("No se pudo borrar archivo físico:", e.message); }
    }

    ok(res, { archivo: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};
