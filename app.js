const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// 💾 Variables globales
let notas = []; // ← Aquí defines la variable para guardar las notas

// 💾 Cargar notas desde el backend
async function cargarNotas() {
  try {
    const res = await fetch("https://messagepark.onrender.com/mensajes");
    const data = await res.json();
    notas = Array.isArray(data) ? data : data.contenido; // Asegura que notas siempre es un array
    dibujarNotas();
  } catch (err) {
    console.error("Error al cargar notas:", err);
  }
}

// 🖼️ Dibujar todas las notas en el canvas
function dibujarNotas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  notas.forEach((nota) => {
    const x = nota.x * canvas.width;
    const y = nota.y * canvas.height;

    ctx.beginPath();
    ctx.arc(x, y, 10, 0, Math.PI * 2);
    ctx.fillStyle = "#FFD700";
    ctx.fill();

    ctx.fillStyle = "#000";
    ctx.font = "12px sans-serif";
    ctx.fillText(nota.autor, x + 12, y + 4);
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

///cambiar modos y cursores
const modoToggle = document.getElementById("modo-toggle");
let modoActual = "enviar"; // por defecto

// Cambiar cursor según modo
function cambiarCursor(modo) {
  if (modo === "enviar") {
    document.body.style.cursor = 'url("Sniper.ani"), auto';
    modoToggle.textContent = "Enviar nota";
  } else if (modo === "leer") {
    document.body.style.cursor = 'url("mailbox.ani"), auto';
    modoToggle.textContent = "Leer notas";
  }
}

// Alternar modo al hacer clic en botón
modoToggle.addEventListener("click", () => {
  modoActual = modoActual === "enviar" ? "leer" : "enviar";
  cambiarCursor(modoActual);
});

// Inicializar cursor
cambiarCursor(modoActual);

// 🖱️ Detectar clics según modo actual
canvas.addEventListener("click", (e) => {
  const x = e.clientX;
  const y = e.clientY;

  if (modoActual === "leer") {
    const notaClicada = notas.find((nota) => {
      const x = nota.x * canvas.width;
      const y = nota.y * canvas.height;
      return Math.hypot(x - e.clientX, y - e.clientY) < 20;
    });

    if (notaClicada) {
      abrirPopupLeerNota(notaClicada);
    }
  }
});

// 📖 Abrir popup para leer nota con contraseña
function abrirPopupLeerNota(nota) {
  const pass = prompt("Introduce la contraseña para leer la nota:");

  if (pass === nota.password) {
    alert(`Contenido de la nota: ${nota.contenido}\nFecha: ${nota.fecha}`);
  } else {
    alert("Contraseña incorrecta.");
  }
}
