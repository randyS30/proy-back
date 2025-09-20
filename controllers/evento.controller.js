import pool from "../config/db.js";
import { ok, fail } from "../utils/response.js";

// Listar eventos de un expediente
export const listarEventos = async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT * FROM eventos WHERE expediente_id=$1 ORDER BY fecha DESC",
      [req.params.id]
    );
    ok(res, { eventos: r.rows });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

// Editar evento
export const editarEvento = async (req, res) => {
  try {
    const { tipo_evento, descripcion, fecha_evento } = req.body || {};
    const { id } = req.params;

    const r = await pool.query(
      `UPDATE eventos 
       SET tipo_evento=$1, descripcion=$2, fecha_evento=$3 
       WHERE id=$4 RETURNING *`,
      [tipo_evento, descripcion, fecha_evento, id]
    );

    if (r.rowCount === 0) return fail(res, 404, "Evento no encontrado");
    ok(res, { evento: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

// Crear evento (si quieres que guarde tipo_evento también)
export const crearEvento = async (req, res) => {
  try {
    const { tipo_evento, descripcion, fecha_evento } = req.body || {};
    const creadoPor = req.user?.id || null;

    const r = await pool.query(
      `INSERT INTO eventos (expediente_id, tipo_evento, descripcion, fecha_evento, creado_en)
       VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
      [req.params.id, tipo_evento, descripcion, fecha_evento]
    );
    ok(res, { evento: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};


// Eliminar evento
export const eliminarEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query("DELETE FROM eventos WHERE id=$1 RETURNING *", [id]);
    if (r.rowCount === 0) return fail(res, 404, "Evento no encontrado");
    ok(res, { message: "Evento eliminado" });
  } catch (err) {
    fail(res, 500, err.message);
  }
};
