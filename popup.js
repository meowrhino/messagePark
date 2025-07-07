let popup = document.getElementById("popup");
let btnEnviar = document.getElementById("enviar");
let btnCerrar = document.getElementById("cerrar");

let popupInfo = document.getElementById("popupInfo");
let inputAutor = document.getElementById("autor");
let inputMensaje = document.getElementById("mensaje");
let inputClave = document.getElementById("clave");

let coordenadasClick = { x: 0, y: 0 };

// Mostrar popup en coordenadas
window.abrirPopup = function(x, y) {
  coordenadasClick = { x, y };
  popup.classList.remove("hidden");
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
};

// Cerrar popup
btnCerrar.addEventListener("click", () => {
  popup.classList.add("hidden");
  limpiarPopup();
});

// Enviar mensaje
btnEnviar.addEventListener("click", async () => {
  const autor = inputAutor.value.trim();
  const mensaje = inputMensaje.value.trim();
  const clave = inputClave.value;

  if (!autor || !mensaje || !clave) {
    popupInfo.textContent = "Por favor, completa todos los campos.";
    return;
  }

  // Encriptar
  const ciphertext = CryptoJS.AES.encrypt(mensaje, clave).toString();

  // Preparar objeto
  const nota = {
    autor,
    x: coordenadasClick.x,
    y: coordenadasClick.y,
    ciphertext,
    timestamp: Date.now()
  };

  // Enviar
  try {
    const res = await fetch("https://messagepark.onrender.com/mensajes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nota)
    });

    if (res.ok) {
      popupInfo.textContent = "✅ Nota enviada con éxito.";
      setTimeout(() => {
        popup.classList.add("hidden");
        limpiarPopup();
        location.reload(); // puedes cambiar por una función que recargue las notas
      }, 1000);
    } else {
      popupInfo.textContent = "❌ Error al enviar.";
    }
  } catch (err) {
    popupInfo.textContent = "⚠️ No se pudo conectar.";
    console.error(err);
  }
});

// Limpiar formulario
function limpiarPopup() {
  inputAutor.value = "";
  inputMensaje.value = "";
  inputClave.value = "";
  popupInfo.textContent = "";
}