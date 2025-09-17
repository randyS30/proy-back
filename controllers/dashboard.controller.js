import pool from "../config/db.js";
import { ok, fail } from "../utils/response.js";

export const getDashboard = async (req, res) => {
  try {
    const totalExp = await pool.query("SELECT COUNT(*)::int AS total FROM expedientes");
    const porEstado = await pool.query(`
      SELECT COALESCE(NULLIF(estado,''),'Sin estado') AS estado, COUNT(*)::int AS total
      FROM expedientes GROUP BY COALESCE(NULLIF(estado,''),'Sin estado') ORDER BY estado
    `);
    const porUsuario = await pool.query(`
      SELECT COALESCE(u.nombre, e.creado_por, 'Desconocido') AS usuario, COUNT(*)::int AS total
      FROM expedientes e LEFT JOIN usuarios u ON u.email = e.creado_por OR u.nombre = e.creado_por OR u.id::text = e.creado_por
      GROUP BY usuario ORDER BY total DESC
    `);
    ok(res, {
      indicadores: {
        total: Number(totalExp.rows[0].total),
      },
      porEstado: porEstado.rows,
      porUsuario: porUsuario.rows,
    });
  } catch (err) {
    fail(res, 500, err.message);
  }
};
