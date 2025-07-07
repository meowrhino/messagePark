// app.js
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

// Botón dejar nota
const btn = document.createElement("button");
// app.js
btn.style.position = "fixed";
btn.style.bottom = "30px";
btn.style.left = "50%";
btn.style.transform = "translateX(-50%)";
btn.style.top = "unset";
btn.style.right = "unset";
btn.style.padding = "1rem 2rem";
btn.style.background = "#fff";
btn.style.border = "2px solid #999";
btn.style.borderRadius = "999px";
btn.style.boxShadow = "0 2px 16px #0003";
btn.style.fontWeight = "bold";

btn.onclick = () => {
  // Pide posición actual (puedes personalizarlo)
  const x = window.scrollX + window.innerWidth / 2;
  const y = window.scrollY + window.innerHeight / 2;
  mostrarPopup(x, y, pintarNotas);
};

// Mostrar notas en el lienzo
async function pintarNotas() {
  lienzo.innerHTML = "";
  const notas = await obtenerNotas();
  for (const nota of notas) {
    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.left = `${nota.x}px`;
    div.style.top = `${nota.y}px`;
    div.style.background = "#faf";
    div.style.padding = "12px";
    div.style.borderRadius = "8px";
    div.style.cursor = "pointer";
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
    const salt = new Uint8Array(nota.salt.match(/.{1,2}/g).map(x => parseInt(x, 16)));
    const iv = new Uint8Array(nota.iv.match(/.{1,2}/g).map(x => parseInt(x, 16)));
    const enc = new TextEncoder();
    const keyMaterial = await window.crypto.subtle.importKey(
      "raw", enc.encode(password), "PBKDF2", false, ["deriveKey"]
    );
    const key = await window.crypto.subtle.deriveKey({
      name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256"
    }, keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]);
    const cifrado = Uint8Array.from(atob(nota.mensaje), c => c.charCodeAt(0));
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
    div.style.position = "absolute";
    div.style.left = `${zona.x}px`;
    div.style.top = `${zona.y}px`;
    div.style.width = `${zona.w}px`;
    div.style.height = `${zona.h}px`;
    div.style.background = zona.color;
    div.style.opacity = "0.2";
    div.style.borderRadius = "30px";
    div.style.zIndex = "1";
    lienzo.appendChild(div);

    // Letrero (si quieres un letrero flotante)
    const letrero = document.createElement("div");
    letrero.textContent = zona.letrero;
    letrero.style.position = "absolute";
    letrero.style.left = `${zona.x + 20}px`;
    letrero.style.top = `${zona.y + 20}px`;
    letrero.style.background = "#fff8";
    letrero.style.padding = "8px 20px";
    letrero.style.borderRadius = "999px";
    letrero.style.fontWeight = "bold";
    letrero.style.zIndex = "2";
    lienzo.appendChild(letrero);
  }
}