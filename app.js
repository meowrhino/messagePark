// app.js

// app.js (añade al inicio)
export const ZONAS = [
  {
    nombre: "Bosque de Eucaliptos",
    x: 5000,
    y: 500,
    w: 1800,
    h: 2000,
    color: "#a8e6cf",
    letrero: "🌿 Bosque de Eucaliptos",
  },
  {
    nombre: "Lago Central",
    x: 3800,
    y: 3200,
    w: 2000,
    h: 1500,
    color: "#89d7f5",
    letrero: "💧 Lago Central",
  },
  {
    nombre: "Pradera de flores",
    x: 1000,
    y: 7000,
    w: 3500,
    h: 1500,
    color: "#ffd3b6",
    letrero: "🌸 Pradera de flores",
  },
  // ... puedes añadir más zonas
];
import { obtenerNotas } from "./api.js";
import { mostrarPopup } from "./popup.js";

const lienzo = document.createElement("div");
lienzo.style.position = "absolute";
lienzo.style.width = "1000vw";
lienzo.style.height = "1000vh";
lienzo.style.background = "#eee";
lienzo.style.overflow = "hidden";
document.body.appendChild(lienzo);

function centrarVista() {
  window.scrollTo(
    lienzo.offsetWidth / 2 - window.innerWidth / 2,
    lienzo.offsetHeight / 2 - window.innerHeight / 2
  );
}

const btn = document.createElement("button");
btn.textContent = "Dejar nota";
btn.className = "btn-dejar-nota"; // Añade una clase identificativa

btn.onclick = () => {
  // Pide posición actual (puedes personalizarlo)
  const x = window.scrollX + window.innerWidth / 2;
  const y = window.scrollY + window.innerHeight / 2;
  mostrarPopup(x, y, pintarNotas);
};

document.body.appendChild(btn);

// Mostrar notas en el lienzo
async function pintarNotas() {
  lienzo.innerHTML = "";
  const notas = await obtenerNotas();
  for (const nota of notas) {
    const div = document.createElement("div");
    div.className = "punto-nota";
    div.style.left = `${nota.x}px`;
    div.style.top = `${nota.y}px`;
    div.style.backgroundColor = nota.color || "#faf";
    div.textContent = nota.nombre;
    div.onclick = () => desbloquearNota(nota);
    lienzo.appendChild(div);
  }
}

// Pedir contraseña y descifrar nota
async function desbloquearNota(nota) {
  const password = prompt("Introduce la contraseña para ver la nota:");
  if (!password) return;
  try {
    const salt = new Uint8Array(
      nota.salt.match(/.{1,2}/g).map((x) => parseInt(x, 16))
    );
    const iv = new Uint8Array(
      nota.iv.match(/.{1,2}/g).map((x) => parseInt(x, 16))
    );
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw",
      enc.encode(password),
      "PBKDF2",
      false,
      ["deriveKey"]
    );
    const key = await window.crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt,
        iterations: 100000,
        hash: "SHA-256",
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    const cifrado = Uint8Array.from(atob(nota.mensaje), (c) => c.charCodeAt(0));
    const plano = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cifrado
    );
    alert(new TextDecoder().decode(plano));
  } catch (e) {
    alert("Contraseña incorrecta o nota corrupta.");
  }
}

centrarVista();
pintarNotas();
window.addEventListener("resize", centrarVista);

// app.js (dentro de pintarNotas o en una función aparte)
function dibujarZonas() {
  for (const zona of ZONAS) {
    const div = document.createElement("div");
    div.className = "zona-parque";
    div.style.left = `${zona.x}px`;
    div.style.top = `${zona.y}px`;
    div.style.width = `${zona.w}px`;
    div.style.height = `${zona.h}px`;
    div.style.backgroundColor = zona.color; // Solo el color dinámico se queda en JS
    lienzo.appendChild(div);

    // Letrero (si quieres un letrero flotante)
    const letrero = document.createElement("div");
    letrero.textContent = zona.letrero;
    letrero.className = "letrero-zona";
    letrero.style.left = `${zona.x + 20}px`;
    letrero.style.top = `${zona.y + 20}px`;
    lienzo.appendChild(letrero);
  }
}
