// popup.js — editor de notas (título, autor, clave, mensaje, coords)

(() => {
  const popup = document.getElementById("popup-editor");
  const inTitulo = document.getElementById("titulo");
  const inAutor = document.getElementById("autor");
  const inClave = document.getElementById("clave");
  const inMensaje = document.getElementById("mensaje");
  const coordsTxt = document.getElementById("coordsTxt");
  const info = document.getElementById("popupInfo");
  const btnGuardar = document.getElementById("guardar");
  const btnDescartar = document.getElementById("descartar");

  let coords = { x: 0, y: 0 };  // normalizadas 0..1

  function limpiar() {
    inTitulo.value = "";
    inAutor.value = "";
    inClave.value = "";
    inMensaje.value = "";
    coords = { x: 0, y: 0 };
    coordsTxt.textContent = "";
    info.textContent = "";
  }

  // clamp y colocación del popup en pantalla (con medida real)
  function placePopup(el, sx, sy) {
    el.style.display = "block";
    const rect = el.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    const left = Math.min(window.innerWidth - w - 10, Math.max(10, sx));
    const top  = Math.min(window.innerHeight - h - 10, Math.max(10, sy));
    el.style.left = `${left}px`;
    el.style.top  = `${top}px`;
  }

  // llamada desde app.js
  window.abrirEditorAt = (nx, ny, screenX=40, screenY=40, placer) => {
    coords = { x: nx, y: ny };
    coordsTxt.textContent = `x=${nx.toFixed(4)}  y=${ny.toFixed(4)}`;
    (placer || placePopup)(popup, screenX, screenY);
  };

  btnDescartar.addEventListener("click", () => {
    popup.style.display = "none";
    limpiar();
  });

  btnGuardar.addEventListener("click", async () => {
    const titulo = inTitulo.value.trim();
    const autor  = inAutor.value.trim();
    const clave  = inClave.value;
    const msg    = inMensaje.value.trim();

    if (!titulo || !autor || !clave || !msg) {
      info.textContent = "Completa todos los campos.";
      return;
    }

    const ciphertext = CryptoJS.AES.encrypt(msg, clave).toString();

    const nota = {
      tipo: "nota",
      titulo, autor, ciphertext,
      x: Number(coords.x), y: Number(coords.y),
      ts: Date.now()
    };

    info.textContent = "⏳ Guardando...";
    btnGuardar.disabled = true;
    try {
      if (typeof window._guardarNota !== "function") throw new Error("bridge no disponible");
      await window._guardarNota(nota);
      info.textContent = "✅ Guardado";
      setTimeout(() => {
        popup.style.display = "none";
        limpiar();
      }, 400);
    } catch (err) {
      console.error(err);
      info.textContent = "❌ Error al guardar";
    } finally {
      btnGuardar.disabled = false;
    }
  });
})();