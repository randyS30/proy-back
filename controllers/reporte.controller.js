import pool from "../config/db.js";
import { ok, fail } from "../utils/response.js";

// Listar reportes de un expediente
export const listarReportes = async (req, res) => {
  try {
    const r = await pool.query(
      `SELECT r.*, u.nombre AS generado_por_nombre
       FROM reportes r
       LEFT JOIN usuarios u ON r.generado_por = u.id
       WHERE expediente_id=$1
       ORDER BY generado_en DESC`,
      [req.params.id]
    );
    ok(res, { reportes: r.rows });
  } catch (err) {
    fail(res, 500, err.message);
  }
};


// Crear reporte
export const crearReporte = async (req, res) => {
  try {
    console.log("👉 req.user recibido del token:", req.user); // 👈 DEBUG

    const { contenido } = req.body || {};
    const generadoPor = parseInt(req.user?.id, 10) || null;

    if (!contenido) return fail(res, 400, "Falta contenido del reporte");

    const expedienteId = parseInt(req.params.id, 10);
    if (isNaN(expedienteId)) return fail(res, 400, "ID de expediente inválido");

    // Insertamos el reporte
    const r = await pool.query(
      `INSERT INTO reportes (expediente_id, contenido, generado_por, generado_en)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, expediente_id, contenido, generado_por, generado_en`,
      [expedienteId, contenido, generadoPor]
    );

    const nuevo = r.rows[0];

    let generadoPorNombre = null;
    if (nuevo.generado_por) {
      const u = await pool.query("SELECT nombre FROM usuarios WHERE id=$1", [
        nuevo.generado_por,
      ]);
      generadoPorNombre = u.rows[0]?.nombre || null;
    }

    ok(res, { reporte: { ...nuevo, generado_por_nombre: generadoPorNombre } });
  } catch (err) {
    console.error("❌ ERROR crearReporte:", err.message);
    fail(res, 500, err.message);
  }
};




// Editar reporte
export const actualizarReporte = async (req, res) => {
  try {
    const { contenido } = req.body;
    const r = await pool.query(
      "UPDATE reportes SET contenido=$1 WHERE id=$2 RETURNING *",
      [contenido, req.params.id]
    );
    if (r.rowCount === 0) return fail(res, 404, "Reporte no encontrado");
    ok(res, { reporte: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

// Eliminar reporte
export const eliminarReporte = async (req, res) => {
  try {
    const r = await pool.query("DELETE FROM reportes WHERE id=$1 RETURNING *", [req.params.id]);
    if (r.rowCount === 0) return fail(res, 404, "Reporte no encontrado");
    ok(res, { message: "Reporte eliminado" });
  } catch (err) {
    fail(res, 500, err.message);
  }
};
