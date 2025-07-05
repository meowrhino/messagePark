
window.addEventListener("DOMContentLoaded", async () => {
  const res = await fetch(`${API_URL}/notas`);
  const notas = await res.json();

  notas.forEach((nota) => {
    const punto = document.createElement("div");
    punto.className = "punto-nota";
    punto.style.left = nota.coordenadas.x + "px";
    punto.style.top = nota.coordenadas.y + "px";

    const hue = Math.floor(Math.random() * 360);
    punto.style.setProperty("--h", hue);

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
});