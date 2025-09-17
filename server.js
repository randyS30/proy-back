import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes.js";
import usuariosRoutes from "./routes/usuarios.routes.js";
import expedienteRoutes from "./routes/expediente.routes.js";
import eventosRoutes from "./routes/evento.routes.js";
import archivosRoutes from "./routes/archivo.routes.js";
import reportesRoutes from "./routes/reporte.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import reniecRoutes from "./routes/reniec.routes.js";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Rutas
app.use("/api", authRoutes);
app.use("/api/usuarios", usuariosRoutes);
app.use("/api/expedientes", expedienteRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/archivos", archivosRoutes);
app.use("/api/reportes", reportesRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/reniec", reniecRoutes);

// Root
app.get("/", (req, res) => res.send("✅ Backend funcionando"));

// Start
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
});
