// server/index.js — API local mensajes.json
const express = require('express');
const cors = require('cors');
const fs = require('fs/promises');
const path = require('path');

const app = express();
app.use(cors({ origin: ['http://localhost:8080', 'http://127.0.0.1:8080'], credentials: false }));
app.use(express.json({ limit: '100kb' }));

const DATA_PATH = path.join(__dirname, '..', 'mensajes.json');

// salud
app.get('/health', (_req, res) => res.type('text').send('ok'));

// leer
app.get('/mensajes', async (_req, res) => {
  try {
    const raw = await fs.readFile(DATA_PATH, 'utf8').catch(() => '[]');
    const data = JSON.parse(raw || '[]');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Error al leer mensajes.json', detail: String(err) });
  }
});

// guardar (nota o decoracion)
app.post('/mensajes', async (req, res) => {
  try {
    const item = req.body || {};
    // validación mínima
    if (!item || (item.tipo !== 'nota' && item.tipo !== 'decoracion')) {
      return res.status(400).json({ error: 'tipo debe ser "nota" o "decoracion"' });
    }
    if (typeof item.x !== 'number' || typeof item.y !== 'number') {
      return res.status(400).json({ error: 'x,y numéricos normalizados 0..1' });
    }
    // límites básicos
    if (item.tipo === 'nota') {
      if (!item.titulo || !item.autor || !item.ciphertext) return res.status(400).json({ error: 'nota incompleta' });
      if ((item.ciphertext||'').length > 5000) return res.status(413).json({ error: 'nota demasiado grande' });
    } else { // decoracion
      if (!item.emoji) return res.status(400).json({ error: 'emoji requerido' });
      item.size = Math.min(256, Math.max(12, Number(item.size||48)));
    }

    const raw = await fs.readFile(DATA_PATH, 'utf8').catch(() => '[]');
    const arr = JSON.parse(raw || '[]');
    item.ts = item.ts || Date.now();
    arr.push(item);
    await fs.writeFile(DATA_PATH, JSON.stringify(arr, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Error al guardar en mensajes.json', detail: String(err) });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
  console.log(`Archivo de datos: ${DATA_PATH}`);
});