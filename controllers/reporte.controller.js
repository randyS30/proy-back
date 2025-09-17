import pool from "../config/db.js";
import { ok, fail } from "../utils/response.js";

export const listarReportes = async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM reportes WHERE expediente_id=$1 ORDER BY generado_en DESC", [req.params.id]);
    ok(res, { reportes: r.rows });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const crearReporte = async (req, res) => {
  try {
    const { contenido, generado_por } = req.body || {};
    const generadoBy = req.user ? req.user.id : (generado_por || null);

    const r = await pool.query(
      `INSERT INTO reportes (expediente_id, contenido, generado_por, generado_en)
       VALUES ($1,$2,$3,NOW()) RETURNING *`,
      [req.params.id, contenido, generadoBy]
    );
    ok(res, { reporte: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const eliminarReporte = async (req, res) => {
  try {
    await pool.query("DELETE FROM reportes WHERE id=$1", [req.params.id]);
    ok(res, { message: "Reporte eliminado" });
  } catch (err) {
    fail(res, 500, err.message);
  }
};
