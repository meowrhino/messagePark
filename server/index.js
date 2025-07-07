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
      fecha: new Date().toISOString()  // 💡 añade timestamp actual
    };

    const { contenido } = await leerMensajes(); // ← CORREGIDO: extraemos contenido directamente
    contenido.push(nuevoMensaje);               // ← CORREGIDO: usamos el array "contenido"
    await guardarMensajes(contenido);           // ← CORREGIDO: guardamos el array actualizado

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