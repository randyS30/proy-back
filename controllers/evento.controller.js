import pool from "../db.js";
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

// Crear nuevo evento
export const crearEvento = async (req, res) => {
  try {
    const { descripcion, fecha } = req.body || {};
    const creadoPor = req.user ? req.user.id : null;

    const r = await pool.query(
      `INSERT INTO eventos (expediente_id, descripcion, fecha, creado_por)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.id, descripcion, fecha, creadoPor]
    );
    ok(res, { evento: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

// Editar evento
export const editarEvento = async (req, res) => {
  try {
    const { descripcion, fecha } = req.body || {};
    const { id } = req.params;

    const r = await pool.query(
      `UPDATE eventos SET descripcion=$1, fecha=$2 WHERE id=$3 RETURNING *`,
      [descripcion, fecha, id]
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
    await pool.query("DELETE FROM eventos WHERE id=$1", [id]);
    ok(res, { message: "Evento eliminado" });
  } catch (err) {
    fail(res, 500, err.message);
  }
};
