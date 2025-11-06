import pool from "../config/db.js";
import { ok, fail } from "../utils/response.js";
import { leerContenidoArchivo, callAISystem } from "../utils/ia.js";
import fs from "fs";
import path from "path";
import { uploadDir } from "../config/multer.js";


const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function getRandomDelay(minMs, maxMs) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

const archivosPreparados = [
  { 
    filename: "PREPARADO_DEMANDA.pdf",    
    original: "Demanda Oficial (Presentada).pdf" 
  },
  { 
    filename: "PREPARADO_SENTENCIA.pdf",   
    original: "Sentencia de Primera Instancia.pdf" 
  },
  { 
    filename: "PREPARADO_APELACION.pdf",  
    original: "Recurso de Apelación.pdf" 
  },
  // Agrega más si lo necesitas
];

export const listarExpedientes = async (req, res) => {
  try {
    const { q: rawQ, estado, from, to } = req.query;
    const q = rawQ ? rawQ.trim() : null;

    const where = [];
    const values = [];
    let idx = 1;

    if (q) {
      where.push(
        `(exp.numero_expediente ILIKE '%' || $${idx} || '%' OR exp.demandante ILIKE '%' || $${idx} || '%' OR exp.demandado ILIKE '%' || $${idx} || '%')`
      );
      values.push(q);
      idx++;
    }

    if (estado) {
      where.push(`exp.estado = $${idx}`);
      values.push(estado);
      idx++;
    }

    if (from) {
      where.push(`exp.fecha_inicio >= $${idx}`);
      values.push(from);
      idx++;
    }

    if (to) {
      where.push(`exp.fecha_inicio <= $${idx}`);
      values.push(to);
      idx++;
    }

    const sql = `
      SELECT exp.*,
             COALESCE(u.nombre, exp.creado_por) AS creado_por_nombre
      FROM expedientes exp
      LEFT JOIN usuarios u
        ON (u.id::text = exp.creado_por OR u.email = exp.creado_por)
      ${where.length ? "WHERE " + where.join(" AND ") : ""}
      ORDER BY exp.creado_en DESC
    `;

    console.log("listarExpedientes params:", { q, estado, from, to, values });

    const r = await pool.query(sql, values);
    ok(res, { expedientes: r.rows });
  } catch (err) {
    console.error("listarExpedientes error:", err);
    fail(res, 500, err.message);
  }
};

export const crearExpediente = async (req, res) => {
  try {
    const creadoPor = req.user?.id || null; 

    const {
      demandante_doc,
      demandante,
      fecha_nacimiento,
      direccion,
      demandado_doc,
      demandado,
      estado,
      fecha_inicio
    } = req.body;

    if (!demandante_doc || !demandante || !demandado_doc || !demandado || !estado || !fecha_inicio) {
      return fail(res, 400, "Faltan campos obligatorios");
    }

    const year = new Date().getFullYear();
    const sec = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const numero_expediente = `EXP-${year}-${sec}`;

    const query = `
      INSERT INTO expedientes 
      (numero_expediente, demandante_doc, demandante, fecha_nacimiento, direccion, demandado_doc, demandado, estado, fecha_inicio, creado_por, creado_en)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,NOW()) 
      RETURNING *`;
    const values = [
      numero_expediente,
      demandante_doc,
      demandante,
      fecha_nacimiento,
      direccion,
      demandado_doc,
      demandado,
      estado,
      fecha_inicio,
      creadoPor
    ];

    const r = await pool.query(query, values);

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

export const analizarExpediente = async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query("SELECT * FROM expedientes WHERE id=$1", [id]);
    if (r.rows.length === 0) return fail(res, 404, "No encontrado");

    const expediente = r.rows[0];
    const prompt = `Genera un análisis jurídico breve del siguiente expediente:`;
    const contenido = JSON.stringify(expediente, null, 2);

    const resultado = await callAISystem(prompt, contenido);

    const reporte = await pool.query(
      "INSERT INTO reportes (expediente_id, contenido, generado_por, generado_en) VALUES ($1, $2, $3, NOW()) RETURNING *",
      [id, resultado, req.user?.email || "sistema"]
    );

    ok(res, { reporte: reporte.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

// --- FUNCIONES DE EVENTOS ---

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

// --- FUNCIONES DE REPORTES ---

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

// --- FUNCIONES DE ARCHIVOS ---
// Estas funciones son llamadas por 'expediente.routes.js'

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

    const delayAleatorio = getRandomDelay(45000, 90000); 


    console.log(`Iniciando Mago de Oz. Espera aleatoria de ${delayAleatorio / 1000} segundos...`);

    await delay(delayAleatorio);

    const { id: expedienteId } = req.params;
    const subidoPor = req.body.subido_por || req.user?.id || '1';

    if (!req.files || req.files.length === 0) {
      console.log("Subida fallida: No se adjuntó ningún archivo.");
      return fail(res, 400, "No se adjuntó ningún archivo.");
    }


    for (const f of req.files) {
      try {
        fs.unlinkSync(f.path);
      } catch (e) {
        console.warn(`No se pudo borrar el archivo bruto: ${f.path}`);
      }
    }

   
    const countResult = await pool.query(
      "SELECT count(*) FROM archivos WHERE expediente_id = $1 AND archivo_path LIKE 'PREPARADO_%'",
      [expedienteId]
    );
    let archivosAsignados = parseInt(countResult.rows[0].count, 10);
    console.log(`Este expediente ya tiene ${archivosAsignados} archivos preparados.`);

    const archivosInsertados = [];

    if (archivosAsignados >= archivosPreparados.length) {
      console.warn("Se acabaron los archivos preparados. Reiniciando el ciclo.");
      archivosAsignados = 0; 
    }

    const archivoPreparado = archivosPreparados[archivosAsignados];

    if (!archivoPreparado) {
       console.error("Error crítico: La lista 'archivosPreparados' está vacía.");
       return fail(res, 500, "Error del servidor: no hay archivos preparados configurados.");
    }
    console.log(`Asignando archivo preparado: ${archivoPreparado.filename}`);

 
    const preparadoPath = path.join(uploadDir, archivoPreparado.filename);
    if (!fs.existsSync(preparadoPath)) {
      const errorMsg = `El archivo preparado ${archivoPreparado.filename} no se encuentra en ${uploadDir}`;
      console.error(errorMsg);
      return fail(res, 500, errorMsg);
    }

    const r = await pool.query(
      `INSERT INTO archivos (
        expediente_id, nombre_original, archivo_path, tipo_mime, subido_por, subido_en
      ) VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [
        expedienteId,
        archivoPreparado.original,
        archivoPreparado.filename,
        "application/pdf",
        subidoPor
      ]
    );
    
    archivosInsertados.push(r.rows[0]);
    console.log(`Éxito. Archivo ${archivoPreparado.original} insertado en la BD.`);

    ok(res, { archivos: archivosInsertados });
    
  } catch (err) {
    console.error("Error crítico en subirArchivos:", err.message, err.stack);
    fail(res, 500, err.message);
  }
};

export const eliminarArchivo = async (req, res) => {
  try {

    const { archivoId } = req.params;
    
    const r = await pool.query("DELETE FROM archivos WHERE id=$1 RETURNING *", [archivoId]);
    if (r.rows.length === 0) return fail(res, 404, "Archivo no encontrado");

    const archivoBorrado = r.rows[0];

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

export const analizarArchivo = async (req, res) => {
  try {
    const { archivoId } = req.params; 
    
    const r = await pool.query("SELECT * FROM archivos WHERE id=$1", [archivoId]);
    if (r.rows.length === 0) return fail(res, 404, "No encontrado");

    const archivo = r.rows[0];
    const absPath = path.join(uploadDir, archivo.archivo_path); // archivo_path es 'PREPARADO_DEMANDA.pdf'

    const contenido = await leerContenidoArchivo(absPath, archivo.tipo_mime, archivo.nombre_original);
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