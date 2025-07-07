// api.js

// app.js (añade al inicio)
export const ZONAS = [
  {
    nombre: "Bosque de Eucaliptos",
    x: 5000, y: 500, w: 1800, h: 2000,
    color: "#a8e6cf", letrero: "🌿 Bosque de Eucaliptos"
  },
  {
    nombre: "Lago Central",
    x: 3800, y: 3200, w: 2000, h: 1500,
    color: "#89d7f5", letrero: "💧 Lago Central"
  },
  {
    nombre: "Pradera de flores",
    x: 1000, y: 7000, w: 3500, h: 1500,
    color: "#ffd3b6", letrero: "🌸 Pradera de flores"
  }
  // ... puedes añadir más zonas
];

// Cambia esta URL por la de tu backend en Render cuando esté desplegado
const API_URL = "https://messagepark.onrender.com";

export async function guardarNota(nota) {
  const res = await fetch(`${API_URL}/nota`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nota)
  });
  return await res.json();
}

export async function obtenerNotas() {
  const res = await fetch(`${API_URL}/notas`);
  return await res.json();
}