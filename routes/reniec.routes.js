import { Router } from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const router = Router();

router.get("/:doc", async (req, res) => {
  const { doc } = req.params;

  let tipo = "";
  if (doc.length === 8) tipo = "dni";
  else if (doc.length === 9) tipo = "ce";
  else {
    return res.status(400).json({ success: false, message: "Documento inválido" });
  }

  try {
    const url = `https://api.decolecta.com/v1/reniec/${tipo}?numero=${doc}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${process.env.RENIEC_TOKEN}`,
      },
    });

    if (!response.ok) {
      const errorTxt = await response.text();
      console.error("RENIEC ERROR:", response.status, errorTxt);
      return res
        .status(response.status)
        .json({ success: false, message: "No autorizado o no encontrado en RENIEC" });
    }

    const data = await response.json();

    res.json({
      success: true,
      nombre: data.full_name || `${data.first_last_name} ${data.second_last_name} ${data.first_name}`,
      fecha_nacimiento: data.birth_date || "",
      direccion: data.address || "",
      raw: data,
    });
  } catch (error) {
    console.error("Error consultando RENIEC:", error.message);
    res.status(500).json({ success: false, message: "Error consultando RENIEC" });
  }
});

export default router;
