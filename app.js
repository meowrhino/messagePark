import { API_URL } from "./api.js";

// Función para convertir hex a ArrayBuffer
function hexToBuffer(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes.buffer;
}

// Desencriptar mensaje
async function descifrarMensaje(cifrado, claveTexto, saltHex, ivHex) {
  const encoder = new TextEncoder();
  const salt = hexToBuffer(saltHex);
  const iv = hexToBuffer(ivHex);

  const claveBase = await crypto.subtle.importKey(
    "raw", encoder.encode(claveTexto),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  const claveAES = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt,
      iterations: 100000,
      hash: "SHA-256"
    },
    claveBase,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );

  try {
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      claveAES,
      hexToBuffer(cifrado)
    );

    return new TextDecoder().decode(decrypted);
  } catch (e) {
    alert("❌ Contraseña incorrecta o mensaje dañado");
    return null;
  }
}

// Mostrar notas
window.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch(`${API_URL}/notas`);
  const notas = await res.json();

  const canvas = document.getElementById("canvas");

  notas.forEach(nota => {
    const div = document.createElement("div");
    div.className = "nota";
    div.style.left = `${nota.coordenadas.x}px`;
    div.style.top = `${nota.coordenadas.y}px`;
    div.textContent = `💌 ${nota.nombre}`;

    div.addEventListener("click", async () => {
      const clave = prompt(`Introduce la contraseña para leer el mensaje de ${nota.nombre}:`);
      if (!clave) return;
      const mensaje = await descifrarMensaje(nota.mensaje, clave, nota.salt, nota.iv);
      if (mensaje) alert(`📩 Mensaje de ${nota.nombre}:\n\n${mensaje}`);
    });

    canvas.appendChild(div);
  });
});