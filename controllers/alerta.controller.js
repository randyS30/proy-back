import pool from "../config/db.js";
import { ok, fail } from "../utils/response.js";

// Función para obtener la fecha actual en YYYY-MM-DD
const getToday = () => {
  return new Date().toISOString().split('T')[0];
}

export const obtenerAlertas = async (req, res) => {
  try {
    // La fecha de "hoy"
    const hoy = getToday(); // ej: '2025-11-15'

    // La fecha límite (hoy + 3 días)
    const fechaLimite = new Date();
    fechaLimite.setDate(fechaLimite.getDate() + 3);
    const limite = fechaLimite.toISOString().split('T')[0]; // ej: '2025-11-18'

    // 1. Unir 'eventos' con 'expedientes' para tener el número
    // 2. Buscar eventos que:
    //    a) Ya están vencidos (fecha_evento < hoy)
    //    b) O están por vencer (fecha_evento >= hoy Y fecha_evento <= limite)
    const sql = `
      SELECT 
        e.id AS evento_id,
        e.tipo_evento,
        e.descripcion,
        e.fecha_evento,
        exp.id AS expediente_id,
        exp.numero_expediente
      FROM eventos e
      JOIN expedientes exp ON e.expediente_id = exp.id
      WHERE 
        e.fecha_evento < $1
        OR 
        (e.fecha_evento >= $1 AND e.fecha_evento <= $2)
      ORDER BY e.fecha_evento ASC;
    `;
    
    const r = await pool.query(sql, [hoy, limite]);

    ok(res, { alertas: r.rows });
  } catch (err) {
    console.error("Error en obtenerAlertas:", err.message);
    fail(res, 500, err.message);
  }
};