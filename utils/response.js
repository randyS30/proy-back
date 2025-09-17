export const ok = (res, data = {}) => res.json({ success: true, ...data });
export const fail = (res, code = 500, msg = "Error en servidor") =>
  res.status(code).json({ success: false, message: msg });
