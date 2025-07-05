

// api.js
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