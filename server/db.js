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
      y INTEGER
    )
  `);
});

function guardarNota({ nombre, mensaje, salt, iv, coordenadas }) {
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO notas (nombre, mensaje, salt, iv, x, y) VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre, mensaje, salt, iv, coordenadas.x, coordenadas.y],
      function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID });
      }
    );
  });
}

function obtenerNotas() {
  return new Promise((resolve, reject) => {
    db.all(`SELECT * FROM notas`, [], (err, rows) => {
      if (err) return reject(err);
      resolve(rows.map(row => ({
        nombre: row.nombre,
        mensaje: row.mensaje,
        salt: row.salt,
        iv: row.iv,
        coordenadas: { x: row.x, y: row.y }
      })));
    });
  });
}

module.exports = { guardarNota, obtenerNotas };