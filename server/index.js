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
    const { contenido } = await leerMensajes(); // solo usamos el contenido
    res.json(contenido);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/mensajes", async (req, res) => {
  try {
    const nuevoMensaje = {
      ...req.body,
      fecha: new Date().toISOString() // añade timestamp en el backend
    };

    const { contenido } = await leerMensajes(); // extraemos array actual de mensajes
    contenido.push(nuevoMensaje);
    await guardarMensajes(contenido);

    res.json({ ok: true, mensaje: nuevoMensaje });
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

// Admin: borrar nota por índice
app.delete("/admin/notas/:indice", async (req, res) => {
  try {
    const indice = parseInt(req.params.indice);
    const { contenido } = await leerMensajes();
    contenido.splice(indice, 1);
    await guardarMensajes(contenido);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: obtener notas sin contraseña
app.get("/admin/notas", async (req, res) => {
  try {
    const { contenido } = await leerMensajes();
    res.json(contenido);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
