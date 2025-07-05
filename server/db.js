const sqlite3 = require("sqlite3").verbose();
const path = require("path");

const dbPath = path.join(__dirname, "notas.db");
const db = new sqlite3.Database(dbPath);

// Crear tabla si no existe
db.serialize(() => {
  db.run(`
CREATE TABLE IF NOT EXISTS notas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT,
  mensaje TEXT,
  salt TEXT,
  iv TEXT,
  x INTEGER,
  y INTEGER,
  timestamp TEXT
)
  `);
});

function guardarNota({ nombre, mensaje, salt, iv, coordenadas }) {
  return new Promise((resolve, reject) => {
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO notas (nombre, mensaje, salt, iv, x, y, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [nombre, mensaje, salt, iv, coordenadas.x, coordenadas.y, now],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
}

// 💬 Nota de ejemplo (test/test)
const ejemplo = {
  nombre: "test",
  mensaje: "7fbb3f48691dd2a967a94fe7a6aeb51dcf0cb6319c209e15",
  salt: "f04b39ebbcfa8e7bce9e4a5b50f6b91e",
  iv: "5b2247c9778f98a1b2f9019a",
  x: 4500,
  y: 4500,
  timestamp: new Date().toISOString(),
};

db.get(`SELECT COUNT(*) as c FROM notas WHERE nombre = 'test'`, (err, row) => {
  if (err) return console.error("Error al verificar nota de ejemplo:", err);
  if (row.c === 0) {
    db.run(
      `INSERT INTO notas (nombre, mensaje, salt, iv, x, y, timestamp) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        ejemplo.nombre,
        ejemplo.mensaje,
        ejemplo.salt,
        ejemplo.iv,
        ejemplo.x,
        ejemplo.y,
        ejemplo.timestamp,
      ],
      (err) => {
        if (err) console.error("❌ Error insertando nota de ejemplo:", err);
        else console.log("✅ Nota de ejemplo 'test' insertada.");
      }
    );
  }
});

function obtenerNotas() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM notas`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(
        rows.map((row) => ({
          nombre: row.nombre,
          mensaje: row.mensaje,
          salt: row.salt,
          iv: row.iv,
          coordenadas: { x: row.x, y: row.y },
          timestamp: row.timestamp, // 💡 ya disponible si se quiere mostrar
        }))
      );
    });
  });
}

module.exports = { guardarNota, obtenerNotas };
