const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let notas = [];

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 💾 Cargar notas desde el backend
async function cargarNotas() {
  try {
    const res = await fetch("https://messagepark.onrender.com/mensajes");
    const data = await res.json();
    notas = data;
    dibujarNotas();
  } catch (err) {
    console.error("Error al cargar notas:", err);
  }
}

// 🖼️ Dibujar todas las notas en el canvas
function dibujarNotas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  notas.forEach((nota) => {
    ctx.beginPath();
    ctx.arc(nota.x, nota.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD700"; // dorado
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "12px sans-serif";
    ctx.fillText(nota.autor, nota.x + 12, nota.y + 4);
  });
}

// 🖱️ Detectar clics y abrir popup
canvas.addEventListener("click", (e) => {
  const x = e.clientX;
  const y = e.clientY;
  window.abrirPopup(x, y);
});

// ⛳ Iniciar todo
cargarNotas();

// 📐 Redibujar en resize
window.addEventListener("resize", () => {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  dibujarNotas();
});