async function cifrarMensaje(mensaje, claveTexto) {
  const encoder = new TextEncoder();

  // Salt y IV aleatorios
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Derivar clave con PBKDF2
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
    ["encrypt"]
  );

  // Cifrar el mensaje
  const cifrado = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    claveAES,
    encoder.encode(mensaje)
  );

  return {
    mensaje: Array.from(new Uint8Array(cifrado)).map(b => b.toString(16).padStart(2, '0')).join(''),
    salt: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
    iv: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('')
  };
}

const API_URL = "https://messagepark.onrender.com"; // tu backend real

// Mostrar y ocultar el popup
const btnAbrir = document.getElementById("btnNota");
const popup = document.getElementById("popupNota");
const cerrarPopup = document.getElementById("cerrarPopup");

btnAbrir.addEventListener("click", () => popup.style.display = "block");
cerrarPopup.addEventListener("click", () => popup.style.display = "none");

document.getElementById("formNota").addEventListener("submit", async (e) => {
  e.preventDefault();

  const nombre = e.target.nombre.value;
  const clave = e.target.clave.value;
  const mensaje = e.target.mensaje.value;

  const coordenadas = { x: window.scrollX, y: window.scrollY };
  const cifrado = await cifrarMensaje(mensaje, clave);

  await fetch(`${API_URL}/nota`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nombre, ...cifrado, coordenadas })
  });

  alert("✅ Nota enviada");
  e.target.reset();
  popup.style.display = "none";
});