const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

const { guardarNota, obtenerNotas } = require("./db");

app.use(express.static("public"));
app.use(express.json());

// 📝 Guardar nota cifrada
app.post("/nota", async (req, res) => {
  try {
    await guardarNota(req.body);
    res.json({ ok: true });
  } catch (err) {
    console.error("Error al guardar nota:", err);
    res.status(500).json({ error: "Error al guardar" });
  }
});

// 📄 Obtener todas las notas
app.get("/notas", async (req, res) => {
  try {
    const notas = await obtenerNotas();
    res.json(notas);
  } catch (err) {
    console.error("Error al obtener notas:", err);
    res.status(500).json({ error: "Error al obtener" });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor en http://localhost:${PORT}`);
});