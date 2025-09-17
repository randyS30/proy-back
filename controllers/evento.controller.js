import pool from "../config/db.js";
import { ok, fail } from "../utils/response.js";

export const listarEventos = async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM eventos WHERE expediente_id=$1 ORDER BY fecha_evento DESC", [req.params.id]);
    ok(res, { eventos: r.rows });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const crearEvento = async (req, res) => {
  try {
    const { tipo_evento, descripcion, fecha_evento } = req.body;
    const r = await pool.query(
      `INSERT INTO eventos (expediente_id, tipo_evento, descripcion, fecha_evento, creado_en)
       VALUES ($1,$2,$3,$4,NOW()) RETURNING *`,
      [req.params.id, tipo_evento, descripcion, fecha_evento]
    );
    ok(res, { evento: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};
