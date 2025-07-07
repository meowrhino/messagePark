import { guardarNota } from "./api.js";
import { ZONAS } from "./app.js";

// Dado x, y, encuentra la zona:
function zonaDe(x, y) {
  return ZONAS.find(
    (z) => x >= z.x && x < z.x + z.w && y >= z.y && y < z.y + z.h
  );
}

export function mostrarPopup(x, y, onSubmit) {
  const zona = zonaDe(x, y);
  const div = document.createElement("div");
  div.innerHTML = `
    <form id="notaForm" style="position:fixed;top:20%;left:50%;transform:translate(-50%,-20%);background:#fff;padding:2rem;box-shadow:0 0 2rem #0008;z-index:9999">
      <h2>Deja una nota</h2>
      <div style="margin-bottom:1em">
        ${
          zona
            ? `<b>Zona:</b> <span>${zona.letrero}</span>`
            : "<b>Zona:</b> <span>Espacio abierto</span>"
        }
      </div>
      <label>Remitente<br><input name="nombre" required></label><br>
      <label>Contraseña<br><input name="password" type="password" required></label><br>
      <label>Mensaje<br><textarea name="mensaje" required></textarea></label><br>
      <label>Color<br>
        <input type="color" name="color" value="#faf0af" style="width:3em;height:2em;border:none;">
      </label><br><br>
      <button>Guardar</button>
      <button type="button" id="cancelarBtn">Cancelar</button>
    </form>
  `;
  document.body.append(div);
  div.querySelector("#cancelarBtn").onclick = () => div.remove();

  div.querySelector("#notaForm").onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target;
    const nombre = f.nombre.value;
    const password = f.password.value;
    const mensaje = f.mensaje.value;
    const color = f.color.value;

    // Generar salt y IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    // Derivar clave
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
      ["encrypt"]
    );
    // Cifrar
    const cifrado = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      key,
      enc.encode(mensaje)
    );

    // Guardar nota
    await guardarNota({
      nombre,
      mensaje: btoa(String.fromCharCode(...new Uint8Array(cifrado))),
      salt: Array.from(salt)
        .map((x) => x.toString(16).padStart(2, "0"))
        .join(""),
      iv: Array.from(iv)
        .map((x) => x.toString(16).padStart(2, "0"))
        .join(""),
      x,
      y,
      color,
      timestamp: new Date().toISOString(),
    });

    div.remove();
    if (onSubmit) onSubmit();
  };
}
