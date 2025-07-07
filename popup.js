// popup.js

// 1️⃣ Paleta de colores
const colors = [
  "#FFEB3B",
  "#E91E63",
  "#2196F3",
  "#4CAF50",
  "#FF9800",
  "#9C27B0",
];
let selectedColor = colors[0];

// 2️⃣ Referencias del DOM
const popup = document.getElementById("popup");
const canvas = document.getElementById("canvas"); // Para coordenadas
const inputAutor = document.getElementById("autor");
const inputTexto = document.getElementById("mensaje");
const inputClave = document.getElementById("clave");
const btnEnviar = document.getElementById("enviar");
const btnCerrar = document.getElementById("cerrar");
const popupInfo = document.getElementById("popupInfo");
const paletteDiv = document.getElementById("color-palette");

// 3️⃣ Construye la paleta de swatches
colors.forEach((col) => {
  const sw = document.createElement("div");
  sw.className = "swatch";
  sw.style.backgroundColor = col;
  if (col === selectedColor) sw.classList.add("selected");
  sw.addEventListener("click", () => {
    selectedColor = col;
    paletteDiv
      .querySelectorAll(".swatch")
      .forEach((el) => el.classList.toggle("selected", el === sw));
  });
  paletteDiv.appendChild(sw);
});

// 4️⃣ Función para limpiar formulario
function limpiarPopup() {
  inputAutor.value = "";
  inputTexto.value = "";
  inputClave.value = "";
  popupInfo.textContent = "";
  selectedColor = colors[0];
  paletteDiv
    .querySelectorAll(".swatch")
    .forEach((sw) =>
      sw.classList.toggle(
        "selected",
        sw.style.backgroundColor === selectedColor
      )
    );
}

// 5️⃣ Control de apertura / cierre del pop-up
let clickXY = { x: 0, y: 0 };
window.abrirPopup = (x, y) => {
  clickXY = { x, y };
  limpiarPopup();
  popup.classList.remove("hidden");
  popup.style.left = `${x}px`;
  popup.style.top = `${y}px`;
  inputAutor.focus();
};
btnCerrar.addEventListener("click", () => {
  popup.classList.add("hidden");
  limpiarPopup();
});

// 6️⃣ Manejador de envío de nota
btnEnviar.addEventListener("click", async () => {
  const autor = inputAutor.value.trim();
  const texto = inputTexto.value.trim();
  const clave = inputClave.value.trim();
  if (!autor || !texto || !clave) {
    popupInfo.textContent = "Autor, mensaje y clave son obligatorios";
    return;
  }

  // Encriptar el mensaje
  const ciphertext = CryptoJS.AES.encrypt(texto, clave).toString();

  // Construir objeto nota
  const nota = {
    autor,
    texto: ciphertext,
    color: selectedColor,
    x: clickXY.x / canvas.width,
    y: clickXY.y / canvas.height,
    timestamp: Date.now(),
  };

  // 1️⃣ POST al backend para guardar nota
  const res = await fetch("/mensajes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(nota),
  });

  if (res.ok) {
    popupInfo.textContent = "✅ Nota enviada con éxito";
    // 2️⃣ Cerrar y pintar sin recargar
    setTimeout(() => {
      popup.classList.add("hidden");
      window.notas.push(nota);
      window.pintarNota(nota, window.notas.length - 1);
      limpiarPopup();
    }, 300);
  } else {
    popupInfo.textContent = "❌ Error al enviar nota";
  }
});
