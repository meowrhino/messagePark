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

  let coords = { x: 0, y: 0 };

  window.abrirEditorAt = (nx, ny) => {
    coords = { x: nx, y: ny };
    coordsTxt.textContent = `x=${nx.toFixed(4)}  y=${ny.toFixed(4)}`;
    popup.style.display = "block";
    inTitulo.focus();
  };
  btnDesc.addEventListener("click", () => {
    popup.style.display = "none";
    inTitulo.value = inAutor.value = inClave.value = inMensaje.value = "";
    info.textContent = "";
  });

  btnGuardar.addEventListener("click", async () => {
    const titulo = inTitulo.value.trim(),
      autor = inAutor.value.trim(),
      clave = inClave.value,
      msg = inMensaje.value.trim();
    if (!titulo || !autor || !clave || !msg) {
      info.textContent = "completa todos los campos.";
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

    info.textContent = "⏳ guardando...";
    btnGuardar.disabled = true;
    try {
      if (typeof window._guardarNota === "function") {
        await window._guardarNota(nota);
      } else {
        // fallback directo al API
        const API_URL = window.API_URL || "http://localhost:3000/mensajes";
        const r = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nota),
          mode: "cors",
        });
        if (!r.ok) throw new Error("post " + r.status);
      }
      info.textContent = "✅ guardado";
      setTimeout(() => {
        popup.style.display = "none";
        inTitulo.value = inAutor.value = inClave.value = inMensaje.value = "";
        info.textContent = "";
      }, 350);
    } catch (e) {
      console.error(e);
      info.textContent = "❌ error al guardar";
    } finally {
      btnGuardar.disabled = false;
    }
  });
})();
