const express = require("express");
const cors = require("cors");
const { leerMensajes, guardarMensajes } = require("./github");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());



app.get("/mensajes", async (req, res) => {
  try {
    const mensajes = await leerMensajes();
    res.json(mensajes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/mensajes", async (req, res) => {
  try {
    const nuevo = req.body;
    const mensajes = await leerMensajes();
    const actualizados = [...mensajes, nuevo];
    await guardarMensajes(actualizados);
    res.status(201).json({ mensaje: "Mensaje guardado" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ✅ Ping de prueba
app.get("/", (req, res) => {
  res.send("🟢 Backend MessagePark activo");
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en puerto ${PORT}`);
});