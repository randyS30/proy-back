import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import { ok, fail } from "../utils/response.js";

export const crearUsuario = async (req, res) => {
  const { nombre, email, password, rol } = req.body || {};
  if (!nombre || !email || !password) return fail(res, 400, "Faltan campos");
  try {
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(
      `INSERT INTO usuarios (nombre, email, password, rol, creado_en)
       VALUES ($1,$2,$3,$4,NOW()) RETURNING id, nombre, email, rol`,
      [nombre, email, hash, rol || "usuario"]
    );
    ok(res, { usuario: r.rows[0] });
  } catch (err) {
    fail(res, 500, err.message);
  }
};

export const listarUsuarios = async (req, res) => {
  try {
    const r = await pool.query("SELECT id, nombre, email, rol, creado_en FROM usuarios ORDER BY id DESC");
    ok(res, { usuarios: r.rows });
  } catch (err) {
    fail(res, 500, err.message);
  }
};
