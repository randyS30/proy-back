// utils/ia.js
import fs from "fs";

// ========================
// 🤖 Llamar a la IA (OpenAI vía fetch)
// ========================
export async function callAISystem(systemMessage, userMessage) {
  if (process.env.OPENAI_API_KEY) {
    try {
      const body = {
        model: process.env.OPENAI_MODEL || "gpt-4o-mini",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: userMessage },
        ],
        max_tokens: 1200,
      };

      const r = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      const j = await r.json();
      return j?.choices?.[0]?.message?.content ?? "Respuesta vacía de OpenAI";
    } catch (err) {
      console.error("OpenAI error:", err);
      return "❌ Error en IA";
    }
  }

  return "⚠️ IA no configurada. Define OPENAI_API_KEY en .env";
}

// ========================
// 📂 Leer archivos simples (TXT)
// ========================
export const leerContenidoArchivo = async (filePath, mimeType, nombre) => {
  try {
    if (mimeType === "text/plain") {
      return fs.readFileSync(filePath, "utf8");
    } else {
      return `⚠️ Tipo de archivo no soportado aún: ${nombre}`;
    }
  } catch (err) {
    console.error("Error leyendo archivo:", err);
    return "";
  }
};
