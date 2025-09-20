// controllers/usuarios.controller.js
import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import { ok, fail } from "../utils/response.js";

const VALID_ROLES = ["Abogado", "admin", "asistente"];

export const crearUsuario = async (req, res) => {
  try {
    let { nombre, email, password, rol } = req.body || {};
    if (!nombre || !email || !password) return fail(res, 400, "Faltan campos");

    // normalizar / fallback rol
    if (!rol || !VALID_ROLES.includes(rol)) rol = "Abogado";

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
  const { id } = req.params;
  const { nombre, email, password, rol } = req.body;

  try {
    let hashPassword;
    if (password) {
      hashPassword = await bcrypt.hash(password, 10);
    }

    const r = await pool.query(
      `UPDATE usuarios 
       SET nombre=$1, email=$2, 
           ${password ? "password=$3," : ""} 
           rol=$4
       WHERE id=$5 
       RETURNING id, nombre, email, rol, creado_en`,
      password
        ? [nombre, email, hashPassword, rol, id]
        : [nombre, email, rol, id]
    );

    if (r.rowCount === 0) return fail(res, 404, "Usuario no encontrado");
    ok(res, { usuario: r.rows[0] });
  } catch (err) {
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

