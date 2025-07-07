// app.js

// 1️⃣ Variables globales y referencias
let notas = [];
const canvas  = document.getElementById("canvas");
const ctx     = canvas.getContext("2d");
const modoBtn = document.getElementById("modo-toggle");
let isAdmin   = false;

// 2️⃣ Ajuste de tamaño dinámico del canvas
function resizeCanvas() {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

// 3️⃣ Función para pintar una nota
function pintarNota(nota, index) {
  const x = nota.x * canvas.width;
  const y = nota.y * canvas.height;
  const r = 10;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle   = nota.color || "#FFEB3B";
  ctx.fill();
  ctx.lineWidth   = 2;
  ctx.strokeStyle = "#333";
  ctx.stroke();
  ctx.closePath();
  ctx.fillStyle = "#000";
  ctx.font      = "14px sans-serif";
  ctx.fillText(index + 1, x + r + 4, y + 5);
}
window.pintarNota = pintarNota; // exponer global

// 4️⃣ Dibujar todas las notas cargadas
function dibujarNotas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  notas.forEach((n, i) => pintarNota(n, i));
}

// 5️⃣ Cargar notas desde el backend
async function cargarNotas() {
  try {
    const res  = await fetch("/mensajes");
    const data = await res.json();
    notas      = Array.isArray(data) ? data : data.contenido;
    window.notas = notas; // exponer para debug
    dibujarNotas();
  } catch (err) {
    console.error("Error al cargar notas:", err);
  }
}

// 6️⃣ Toggle de modo Admin/Lectura
modoBtn.addEventListener("click", () => {
  isAdmin = !isAdmin;
  modoBtn.textContent = isAdmin ? "Modo Lectura" : "Modo Admin";
});

// 7️⃣ Manejador de click en el canvas
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const x = (e.clientX - rect.left) * (canvas.width  / rect.width);
  const y = (e.clientY - rect.top)  * (canvas.height / rect.height);

  if (!isAdmin) {
    // Modo lectura: si clicas en una nota, pide clave y muestra
    const idx = notas.findIndex(n => {
      const dx = x - n.x * canvas.width;
      const dy = y - n.y * canvas.height;
      return Math.hypot(dx, dy) < 10;
    });
    if (idx >= 0) {
      const pass = prompt("Introduce la contraseña:");
      const bytes = CryptoJS.AES.decrypt(notas[idx].texto, pass);
      const msg   = bytes.toString(CryptoJS.enc.Utf8) || "Clave incorrecta";
      alert(msg);
      return;
    }
    // Si pinchas en fondo, abrir pop-up
    window.abrirPopup(x, y);
  } else {
    // Modo admin
    console.log("Modo Admin: clic en", x, y);
    // Aquí podrías iniciar selección de área o editar notas
  }
});

// 8️⃣ Ejecutar carga inicial
window.addEventListener("load", cargarNotas);