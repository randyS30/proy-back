import pool from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ok, fail } from "../utils/response.js";

const JWT_SECRET = process.env.JWT_SECRET || "pon_un_valor_largo_y_secreto_aqui";

export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) return fail(res, 400, "Email y password requeridos");

  try {
    const r = await pool.query("SELECT * FROM usuarios WHERE email=$1 LIMIT 1", [email]);
    if (r.rows.length === 0) return fail(res, 401, "Credenciales inválidas");

    const user = r.rows[0];
    const valid = user.password.startsWith("$2")
      ? await bcrypt.compare(password, user.password)
      : password === user.password;

    if (!valid) return fail(res, 401, "Credenciales inválidas");

    const payload = { id: user.id, nombre: user.nombre, email: user.email, rol: user.rol };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
    ok(res, { user: payload, token });
  } catch (err) {
    console.error("login error:", err);
    fail(res);
  }
};

export const me = (req, res) => ok(res, { user: req.user });
