// popup.js — editor centrado (placeholders), botones tipo “pill”

(() => {
  const popup = document.getElementById("popup-editor");
  const inTitulo = document.getElementById("titulo");
  const inAutor = document.getElementById("autor");
  const inClave = document.getElementById("clave");
  const inMensaje = document.getElementById("mensaje");
  const coordsTxt = document.getElementById("coordsTxt");
  const info = document.getElementById("popupInfo");
  const btnGuardar = document.getElementById("guardar");
  const btnDesc = document.getElementById("descartar");

  let coords = { x: 0, y: 0 }; // 0..1

  function limpiar() {
    inTitulo.value = "";
    inAutor.value = "";
    inClave.value = "";
    inMensaje.value = "";
    coords = { x: 0, y: 0 };
    coordsTxt.textContent = "";
    info.textContent = "";
  }

  // llamado por app.js
  window.abrirEditorAt = (nx, ny) => {
    coords = { x: nx, y: ny };
    coordsTxt.textContent = `x=${nx.toFixed(4)}  y=${ny.toFixed(4)}`;
    popup.style.display = "block";
    inTitulo.focus();
  };

  btnDesc.addEventListener("click", () => {
    popup.style.display = "none";
    limpiar();
  });

  btnGuardar.addEventListener("click", async () => {
    const titulo = inTitulo.value.trim(),
      autor = inAutor.value.trim(),
      clave = inClave.value,
      msg = inMensaje.value.trim();
    if (!titulo || !autor || !clave || !msg) {
      info.textContent = "Completa todos los campos.";
      return;
    }

    const ciphertext = CryptoJS.AES.encrypt(msg, clave).toString();
    const nota = {
      tipo: "nota",
      titulo,
      autor,
      ciphertext,
      x: coords.x,
      y: coords.y,
      ts: Date.now(),
    };

    info.textContent = "⏳ Guardando...";
    btnGuardar.disabled = true;
    try {
      if (typeof window._guardarNota !== "function")
        throw new Error("bridge no disponible");
      await window._guardarNota(nota);
      info.textContent = "✅ Guardado";
      setTimeout(() => {
        popup.style.display = "none";
        limpiar();
      }, 350);
    } catch (err) {
      console.error(err);
      info.textContent = "❌ Error al guardar";
    } finally {
      btnGuardar.disabled = false;
    }
  });
})();
