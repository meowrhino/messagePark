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