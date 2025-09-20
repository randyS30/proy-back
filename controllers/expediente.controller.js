import pool from "../config/db.js";
import { ok, fail } from "../utils/response.js";
import { leerContenidoArchivo, callAISystem } from "../utils/ia.js";


export const listarExpedientes = async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM expedientes ORDER BY creado_en DESC");
    ok(res, { expedientes: r.rows });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const crearExpediente = async (req, res) => {
  try {

    console.log(req.body); // campos texto
    console.log(req.file); //archivo
    const { numero_expediente, demandante, demandado, fecha_inicio, creado_por } = req.body;
    const r = await pool.query(
      `INSERT INTO expedientes (numero_expediente, demandante, demandado, fecha_inicio, creado_por, creado_en)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [numero_expediente, demandante, demandado, fecha_inicio, creado_por]
    );
    ok(res, { expediente: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const obtenerExpediente = async (req, res) => {
  try {
    const r = await pool.query("SELECT * FROM expedientes WHERE id=$1", [req.params.id]);
    if (r.rows.length === 0) return fail(res, 404, "No encontrado");
    ok(res, { expediente: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const actualizarExpediente = async (req, res) => {
  try {
    const { numero_expediente, demandante, demandado, fecha_inicio, fecha_fin, estado } = req.body;
    const r = await pool.query(
      `UPDATE expedientes SET numero_expediente=$1, demandante=$2, demandado=$3, fecha_inicio=$4, fecha_fin=$5, estado=$6
       WHERE id=$7 RETURNING *`,
      [numero_expediente, demandante, demandado, fecha_inicio, fecha_fin, estado, req.params.id]
    );
    ok(res, { expediente: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const eliminarExpediente = async (req, res) => {
  try {
    await pool.query("DELETE FROM expedientes WHERE id=$1", [req.params.id]);
    ok(res, { message: "Expediente eliminado" });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

// =======================
// 🔎 Analizar expediente completo
// =======================
/* export const analizarExpediente = async (req, res) => {
  try {
    const expedienteId = parseInt(req.params.id);
    const archivos = await pool.query("SELECT * FROM archivos WHERE expediente_id=$1", [expedienteId]);
    if (archivos.rows.length === 0)
      return fail(res, 400, "No hay archivos para analizar");

    let contenido = "";
    for (const archivo of archivos.rows) {
      const absPath = path.join(uploadDir, archivo.archivo_path);
      const texto = await leerContenidoArchivo(absPath, archivo.tipo_mime, archivo.nombre_original);
      contenido += `\n--- ${archivo.nombre_original} ---\n${texto}`;
    }

    const aiResult = await callAISystem(
      "Eres un abogado peruano experto en cese de alimentos.",
      contenido
    );

    const insert = await pool.query(
      `INSERT INTO reportes (expediente_id, contenido, generado_por, generado_en)
       VALUES ($1,$2,$3,NOW()) RETURNING *`,
      [expedienteId, aiResult, req.user?.id || null]
    );

    ok(res, { reporte: insert.rows[0] });
  } catch (err) {
    fail(res, 500, "Error analizando expediente");
  }
}; */
// ================= ANALIZAR CON IA =================
export const analizarExpediente = async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query("SELECT * FROM expedientes WHERE id=$1", [id]);
    if (r.rows.length === 0) return fail(res, 404, "No encontrado");

    const expediente = r.rows[0];
    const prompt = `Genera un análisis jurídico breve del siguiente expediente:`;
    const contenido = JSON.stringify(expediente, null, 2);

    const resultado = await callAISystem(prompt, contenido);

    // Guardar como reporte
    const reporte = await pool.query(
      "INSERT INTO reportes (expediente_id, contenido, generado_por, generado_en) VALUES ($1, $2, $3, NOW()) RETURNING *",
      [id, resultado, req.user?.email || "sistema"]
    );

    ok(res, { reporte: reporte.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

// ================= EVENTOS =================
export const listarEventos = async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query("SELECT * FROM eventos WHERE expediente_id=$1 ORDER BY fecha_evento DESC", [id]);
    ok(res, { eventos: r.rows });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const crearEvento = async (req, res) => {
  try {
    const { id } = req.params;
    const { tipo_evento, descripcion, fecha_evento } = req.body;
    const r = await pool.query(
      "INSERT INTO eventos (expediente_id, tipo_evento, descripcion, fecha_evento, creado_en) VALUES ($1,$2,$3,$4,NOW()) RETURNING *",
      [id, tipo_evento, descripcion, fecha_evento]
    );
    ok(res, { evento: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const actualizarEvento = async (req, res) => {
  try {
    const { eventoId } = req.params;
    const { tipo_evento, descripcion, fecha_evento } = req.body;
    const r = await pool.query(
      "UPDATE eventos SET tipo_evento=$1, descripcion=$2, fecha_evento=$3 WHERE id=$4 RETURNING *",
      [tipo_evento, descripcion, fecha_evento, eventoId]
    );
    ok(res, { evento: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const eliminarEvento = async (req, res) => {
  try {
    await pool.query("DELETE FROM eventos WHERE id=$1", [req.params.eventoId]);
    ok(res, { message: "Evento eliminado" });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

// ================= REPORTES =================
export const listarReportes = async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query("SELECT * FROM reportes WHERE expediente_id=$1 ORDER BY generado_en DESC", [id]);
    ok(res, { reportes: r.rows });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const crearReporte = async (req, res) => {
  try {
    const { id } = req.params;
    const { contenido } = req.body;
    const r = await pool.query(
      "INSERT INTO reportes (expediente_id, contenido, generado_por, generado_en) VALUES ($1,$2,$3,NOW()) RETURNING *",
      [id, contenido, req.user?.email || "sistema"]
    );
    ok(res, { reporte: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const actualizarReporte = async (req, res) => {
  try {
    const { reporteId } = req.params;
    const { contenido } = req.body;
    const r = await pool.query(
      "UPDATE reportes SET contenido=$1 WHERE id=$2 RETURNING *",
      [contenido, reporteId]
    );
    ok(res, { reporte: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const eliminarReporte = async (req, res) => {
  try {
    await pool.query("DELETE FROM reportes WHERE id=$1", [req.params.reporteId]);
    ok(res, { message: "Reporte eliminado" });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

// ================= ARCHIVOS =================
export const listarArchivos = async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query("SELECT * FROM archivos WHERE expediente_id=$1 ORDER BY subido_en DESC", [id]);
    ok(res, { archivos: r.rows });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const subirArchivos = async (req, res) => {
  try {
    const { id } = req.params;
    const archivos = [];
    for (let f of req.files) {
      const r = await pool.query(
        "INSERT INTO archivos (expediente_id, nombre_original, ruta, mime_type, subido_por, subido_en) VALUES ($1,$2,$3,$4,$5,NOW()) RETURNING *",
        [id, f.originalname, f.path, f.mimetype, req.user?.email || "sistema"]
      );
      archivos.push(r.rows[0]);
    }
    ok(res, { archivos });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const eliminarArchivo = async (req, res) => {
  try {
    await pool.query("DELETE FROM archivos WHERE id=$1", [req.params.archivoId]);
    ok(res, { message: "Archivo eliminado" });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const analizarArchivo = async (req, res) => {
  try {
    const { archivoId } = req.params;
    const r = await pool.query("SELECT * FROM archivos WHERE id=$1", [archivoId]);
    if (r.rows.length === 0) return fail(res, 404, "No encontrado");

    const archivo = r.rows[0];
    const contenido = await leerContenidoArchivo(archivo.ruta, archivo.mime_type, archivo.nombre_original);
    const prompt = `Haz un resumen jurídico breve de este archivo`;
    const resultado = await callAISystem(prompt, contenido);

    const reporte = await pool.query(
      "INSERT INTO reportes (expediente_id, contenido, generado_por, generado_en) VALUES ($1,$2,$3,NOW()) RETURNING *",
      [archivo.expediente_id, resultado, req.user?.email || "sistema"]
    );

    ok(res, { reporte: reporte.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};