// controllers/usuarios.controller.js
import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import { ok, fail } from "../utils/response.js";

const VALID_ROLES = ["Abogado", "Admin", "asistente"];

export const crearUsuario = async (req, res) => {
  try {
    let { nombre, email, password, rol } = req.body || {};
    if (!nombre || !email || !password) return fail(res, 400, "Faltan campos");

    // normalizar / fallback rol
    if (!rol || !VALID_ROLES.includes(rol)) rol = ["Admin", "Abogado", "Asistente"];

    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol, creado_en)
       VALUES ($1,$2,$3,$4,NOW()) RETURNING id, nombre, email, rol, creado_en`,
      [nombre, email, hash, rol]
    );
    ok(res, { usuario: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const listarUsuarios = async (req, res) => {
  try {
    const r = await pool.query(
      "SELECT id, nombre, email, rol, creado_en FROM usuarios ORDER BY id DESC"
    );
    ok(res, { usuarios: r.rows });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

// Actualizar usuario
export const actualizarUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) return fail(res, 400, "Falta ID");

    const { nombre, email, password, rol } = req.body || {};

    // Validaciones basicas
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return fail(res, 400, "Email inválido");
    if (rol !== undefined && rol !== null && !VALID_ROLES.includes(rol)) return fail(res, 400, `Rol inválido. Valores permitidos: ${VALID_ROLES.join(", ")}`);

    // Construir query dinamica: solo campos presentes
    const fields = [];
    const values = [];
    let idx = 1;

    if (nombre !== undefined) { fields.push(`nombre=$${idx++}`); values.push(nombre); }
    if (email !== undefined)  { fields.push(`email=$${idx++}`); values.push(email); }
    if (rol !== undefined)    { fields.push(`rol=$${idx++}`); values.push(rol); }
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      fields.push(`password=$${idx++}`);
      values.push(hash);
    }

    if (fields.length === 0) return fail(res, 400, "Nada para actualizar");

    values.push(id); // id es el último parámetro
    const q = `UPDATE usuarios SET ${fields.join(", ")} WHERE id=$${idx} RETURNING id, nombre, email, rol, creado_en`;
    const r = await pool.query(q, values);

    if (r.rows.length === 0) return fail(res, 404, "Usuario no encontrado");
    ok(res, { usuario: r.rows[0] });
  } catch (err) {
    console.error("actualizarUsuario error:", err);
    fail(res, 500, err.message);
  }
};


// Eliminar usuario
export const eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  try {
    const r = await pool.query("DELETE FROM usuarios WHERE id=$1 RETURNING id", [id]);
    if (r.rowCount === 0) return fail(res, 404, "Usuario no encontrado");
    ok(res, { message: "Usuario eliminado" });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

