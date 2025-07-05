const express = require("express");
const cors = require("cors"); // ⬅️ Añade esta línea
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // ⬅️ Añade esta línea

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