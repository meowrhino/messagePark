window.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch("/notas");
  const notas = await res.json();

notas.forEach((nota, index) => {
  const punto = document.createElement("div");
  punto.className = "punto-nota";
  punto.style.left = nota.coordenadas.x + "px";
  punto.style.top = nota.coordenadas.y + "px";

  // Color pastel aleatorio
  const hue = Math.floor(Math.random() * 360);
  punto.style.setProperty("--h", hue);

  // Mostrar el nombre directamente
  punto.textContent = nota.nombre;

  punto.addEventListener("click", () => {
    const clave = prompt("Introduce la contraseña para ver la nota:");
    if (clave) {
      descifrarMensaje(nota, clave).then((mensajeDescifrado) => {
        if (mensajeDescifrado) {
          alert(`📝 Nota de ${nota.nombre}:\n\n${mensajeDescifrado}`);
        } else {
          alert("❌ Contraseña incorrecta o mensaje ilegible");
        }
      });
    }
  });

  document.body.appendChild(punto);
});

async function descifrarMensaje(nota, claveTexto) {
  const decoder = new TextDecoder();

  const salt = new Uint8Array(nota.salt.match(/.{1,2}/g).map(h => parseInt(h, 16)));
  const iv = new Uint8Array(nota.iv.match(/.{1,2}/g).map(h => parseInt(h, 16)));
  const datosCifrados = new Uint8Array(nota.mensaje.match(/.{1,2}/g).map(h => parseInt(h, 16)));

  try {
    const claveBase = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(claveTexto),
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

    const descifrado = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      claveAES,
      datosCifrados
    );

    return decoder.decode(descifrado);
  } catch (err) {
    console.warn("Error al descifrar:", err);
    return null;
  }
}