// server/db.js
const fs = require("fs");
const path = require("path");

const archivoNotas = path.join(__dirname, "notas.json");

if (!fs.existsSync(archivoNotas)) {
  fs.writeFileSync(archivoNotas, "[]");
}

function guardarNota(nuevaNota) {
  return new Promise((resolve, reject) => {
    fs.readFile(archivoNotas, "utf8", (err, data) => {
      if (err) return reject(err);
      const notas = JSON.parse(data);
      notas.push(nuevaNota);
      fs.writeFile(archivoNotas, JSON.stringify(notas, null, 2), (err) => {
        if (err) return reject(err);
        resolve({ ok: true });
      });
    });
  });
}

function obtenerNotas() {
  return new Promise((resolve, reject) => {
    fs.readFile(archivoNotas, "utf8", (err, data) => {
      if (err) return reject(err);
      try {
        const notas = JSON.parse(data);
        resolve(notas);
      } catch (e) {
        resolve([]);
      }
    });
  });
}

module.exports = { guardarNota, obtenerNotas };