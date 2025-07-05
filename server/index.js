const express = require("express");
const cors = require("cors");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const { guardarNota, obtenerNotas } = require("./db");

// 📝 Guardar nota cifrada
app.post("/nota", async (req, res) => {
  try {
    console.log("📩 Recibida nueva nota:", req.body);
    await guardarNota(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error("❌ Error al guardar nota:", err);
    res.status(500).json({ error: "Error al guardar" });
  }
});

// 📚 Obtener todas las notas
app.get("/notas", async (req, res) => {
  try {
    const notas = await obtenerNotas();
    res.json(notas);
  } catch (err) {
    console.error("❌ Error al obtener notas:", err);
    res.status(500).json({ error: "Error al obtener notas" });
  }
});

// 🚀 Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en puerto ${PORT}`);
});