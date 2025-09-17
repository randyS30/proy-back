import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "pon_un_valor_largo_y_secreto_aqui";

export const authRequired = (req, res, next) => {
  const header = req.headers["authorization"];
  if (!header) return res.status(401).json({ success: false, message: "No autorizado" });
  const token = header.split(" ")[1];
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ success: false, message: "Token inválido" });
  }
};

export const requireRole = (roles = []) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.rol)) {
    return res.status(403).json({ success: false, message: "No tienes permisos" });
  }
  next();
};
