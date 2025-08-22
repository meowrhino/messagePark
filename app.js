// app.js — mundo x10, scroll/pan, modos: leer / colocar / decorar

(() => {
  const API_URL = window.API_URL || "http://localhost:3000/mensajes";

  // ---------- Mundo y vista ----------
  const WORLD_SCALE = 10;
  let worldW = 0, worldH = 0;
  let view = { x: 0, y: 0 };           // offset del viewport dentro del mundo

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  // UI
  const btnLeer = document.getElementById("btn-leer");
  const btnColocar = document.getElementById("btn-colocar");
  const btnDecorar = document.getElementById("btn-decorar");
  const statusEl = document.getElementById("status");
  const decorPanel = document.getElementById("decor-panel");
  const emojiGrid = document.getElementById("emojiGrid");
  const emojiSize = document.getElementById("emojiSize");
  const emojiSizeVal = document.getElementById("emojiSizeVal");
  const emojiPreview = document.getElementById("emojiPreview");

  // datos
  let notas = [];        // {tipo:'nota', titulo, autor, ciphertext, x,y, ts}
  let decoraciones = []; // {tipo:'decoracion', emoji, size, x,y, ts}

  // emojis (20 exactos, respetando ZWJ)
  const EMOJIS = [
    "🌳","🌲","🌴","🪾",
    "⛰️","🏔️","🌋","🗻",
    "🐇","🐈‍⬛","🦔","🐁",
    "🌼","🌸","🌻","🌺",
    "⛩️","⛲","⛺","🚗"
  ];
  let activeEmoji = null;

  // Pan con espacio o con scroll
  let isSpace = false;
  let isPanning = false;
  let panStart = { x:0, y:0 }, viewStart = { x:0, y:0 };

  // ---------- Canvas HiDPI ----------
  function resizeCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = window.innerWidth;
    const h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
  }

  function initWorldIfNeeded() {
    if (worldW === 0 || worldH === 0) {
      worldW = Math.round(window.innerWidth * WORLD_SCALE);
      worldH = Math.round(window.innerHeight * WORLD_SCALE);
      view.x = 0; view.y = 0;
    }
  }

  // ---------- Coords ----------
  function screenToWorld(x, y) { return { x: view.x + x, y: view.y + y }; }
  function worldToScreen(x, y) { return { x: x - view.x, y: y - view.y }; }
  function normFromWorld(x, y) { return { x: x / worldW, y: y / worldH }; }
  function worldFromNorm(nx, ny) { return { x: nx * worldW, y: ny * worldH }; }

  // ---------- Data I/O ----------
  async function cargarDatos() {
    try {
      const res = await fetch(API_URL, { mode: "cors" });
      if (!res.ok) throw new Error("GET " + res.status);
      const arr = await res.json();
      notas = [];
      decoraciones = [];
      for (const it of arr) {
        const tipo = it.tipo || (it.ciphertext ? "nota" : it.emoji ? "decoracion" : "nota");
        if (tipo === "nota") notas.push(it);
        else decoraciones.push(it);
      }
      dibujar();
    } catch (err) {
      console.warn("GET falló, fallback a local mensajes.json", err);
      try {
        const res = await fetch("./mensajes.json");
        const arr = await res.json();
        notas = arr.filter(x => (x.tipo || (x.ciphertext ? "nota" : "decoracion")) === "nota");
        decoraciones = arr.filter(x => (x.tipo || (x.ciphertext ? "nota" : "decoracion")) === "decoracion");
        dibujar();
      } catch (e2) {
        console.error("Sin datos", e2);
        notas = []; decoraciones = [];
        dibujar(true);
      }
    }
  }

  async function guardarItem(item, retries=1) {
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        mode: "cors"
      });
      if (!res.ok) throw new Error("POST " + res.status);
      return await res.json().catch(() => ({}));
    } catch (e) {
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 300));
        return guardarItem(item, retries-1);
      }
      throw e;
    }
  }

  // ---------- Dibujo ----------
  function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // grid
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,0.06)";
    const step = 100;
    for (let x = -(view.x % step); x < canvas.width; x += step) {
      ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke();
    }
    for (let y = -(view.y % step); y < canvas.height; y += step) {
      ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke();
    }
    ctx.restore();
  }

  function drawEnvelope(x, y) {
    // dibuja un ✉️ centrado en (x,y)
    ctx.font = "20px system-ui, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji";
    ctx.textBaseline = "middle"; ctx.textAlign = "center";
    ctx.fillText("✉️", x, y);
  }

  function dibujar(showMsg=false) {
    clear();
    if (showMsg) {
      ctx.fillStyle="#777"; ctx.font="14px system-ui";
      ctx.fillText("Sin datos. Haz clic para añadir.", 16, 28);
    }

    // decoraciones
    for (const d of decoraciones) {
      const W = worldFromNorm(d.x, d.y);
      const S = worldToScreen(W.x, W.y);
      if (S.x < -200 || S.y < -200 || S.x > canvas.width+200 || S.y > canvas.height+200) continue;
      ctx.save();
      ctx.font = `${d.size || 48}px system-ui, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji`;
      ctx.textBaseline = "middle"; ctx.textAlign = "center";
      ctx.fillText(d.emoji || "❔", S.x, S.y);
      ctx.restore();
    }

    // notas
    for (const n of notas) {
      const W = worldFromNorm(n.x, n.y);
      const S = worldToScreen(W.x, W.y);
      if (S.x < -60 || S.y < -60 || S.x > canvas.width+60 || S.y > canvas.height+60) continue;
      drawEnvelope(S.x, S.y);
      ctx.fillStyle="#222";
      ctx.font="12px system-ui";
      ctx.textBaseline="top"; ctx.textAlign="center";
      const label = n.titulo ? n.titulo : (n.autor || "nota");
      ctx.fillText(label, S.x, S.y + 14);
    }

    statusEl.textContent = `vista ${Math.round(view.x)}/${Math.round(view.y)} — mundo ${worldW}×${worldH}`;
  }

  // ---------- Modos ----------
  let modo = "leer"; // "leer" | "colocar" | "decorar"

  function setModo(m) {
    modo = m;
    btnLeer.classList.toggle("active", modo==="leer");
    btnColocar.classList.toggle("active", modo==="colocar");
    btnDecorar.classList.toggle("active", modo==="decorar");
    decorPanel.style.display = (modo==="decorar") ? "block" : "none";
    document.body.style.cursor = (modo==="colocar") ? "crosshair" : "default";
  }

  function buildEmojiGrid() {
    emojiGrid.innerHTML = "";
    EMOJIS.forEach((e) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = e;
      b.addEventListener("click", () => {
        [...emojiGrid.children].forEach(x=>x.classList.remove("active"));
        b.classList.add("active");
        activeEmoji = e;
        emojiPreview.textContent = e;
      });
      emojiGrid.appendChild(b);
    });
    emojiPreview.textContent = "—";
  }

  // ---------- Interacción canvas ----------
  function placePopup(el, sx, sy) {
    // mostrar temporalmente para medir
    el.style.display = "block";
    const rect = el.getBoundingClientRect();
    const w = rect.width, h = rect.height;
    const left = Math.min(window.innerWidth - w - 10, Math.max(10, sx));
    const top  = Math.min(window.innerHeight - h - 10, Math.max(10, sy));
    el.style.left = `${left}px`;
    el.style.top  = `${top}px`;
  }

  function onPointerDown(ev) {
    const rect = canvas.getBoundingClientRect();
    const sx = ev.clientX - rect.left;
    const sy = ev.clientY - rect.top;

    if (isSpace) { // iniciar pan con espacio
      isPanning = true;
      panStart = { x: sx, y: sy };
      viewStart = { x: view.x, y: view.y };
      return;
    }

    const W = screenToWorld(sx, sy);
    const N = normFromWorld(W.x, W.y);

    if (modo === "colocar") {
      // abrir editor
      window.abrirEditorAt(N.x, N.y, sx + 14, sy + 14, placePopup);
      return;
    }

    if (modo === "decorar") {
      if (!activeEmoji) { statusEl.textContent = "Elige un emoji primero"; return; }
      const deco = {
        tipo: "decoracion",
        emoji: activeEmoji,
        size: Number(emojiSize.value) || 48,
        x: Number(N.x), y: Number(N.y),
        ts: Date.now()
      };
      guardarItem(deco).then(async () => {
        await cargarDatos();
      }).catch(err => {
        console.error(err);
        statusEl.textContent = "Error guardando decoración";
      });
      return;
    }

    // modo leer: ¿clic cerca de una nota?
    const hit = notas.find((n) => {
      const p = worldFromNorm(n.x, n.y);
      const s = worldToScreen(p.x, p.y);
      return Math.hypot(s.x - sx, s.y - sy) < 16;
    });
    if (hit) abrirLectura(hit, sx + 14, sy + 14);
  }

  function onPointerMove(ev) {
    if (!isPanning) return;
    const rect = canvas.getBoundingClientRect();
    const sx = ev.clientX - rect.left;
    const sy = ev.clientY - rect.top;
    const dx = sx - panStart.x;
    const dy = sy - panStart.y;
    view.x = Math.max(0, Math.min(worldW - rect.width, viewStart.x - dx));
    view.y = Math.max(0, Math.min(worldH - rect.height, viewStart.y - dy));
    dibujar();
  }
  function onPointerUp() { isPanning = false; }

  // scroll/trackpad para pan
  function onWheel(ev) {
    ev.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const K = 1; // factor
    view.x = Math.max(0, Math.min(worldW - rect.width, view.x + ev.deltaX * K));
    view.y = Math.max(0, Math.min(worldH - rect.height, view.y + ev.deltaY * K));
    dibujar();
  }

  // teclado
  window.addEventListener("keydown", (e) => { if (e.code === "Space") { isSpace = true; document.body.style.cursor = "grab"; }});
  window.addEventListener("keyup",   (e) => { if (e.code === "Space") { isSpace = false; document.body.style.cursor = (modo==="colocar"?"crosshair":"default"); }});

  // botones de modo
  btnLeer.addEventListener("click", () => setModo("leer"));
  btnColocar.addEventListener("click", () => setModo("colocar"));
  btnDecorar.addEventListener("click", () => setModo("decorar"));
  emojiSize.addEventListener("input", () => { emojiSizeVal.textContent = emojiSize.value; if (activeEmoji) emojiPreview.textContent = activeEmoji; });

  // canvas
  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  // ---------- Lectura de notas ----------
  const passPopup = document.getElementById("popup-pass");
  const passTitle = document.getElementById("passTitle");
  const passClave = document.getElementById("passClave");
  const passInfo  = document.getElementById("passInfo");
  const passCancel = document.getElementById("passCancel");
  const passOk     = document.getElementById("passOk");

  const msgPopup  = document.getElementById("popup-msg");
  const msgTitle  = document.getElementById("msgTitle");
  const msgMeta   = document.getElementById("msgMeta");
  const msgBody   = document.getElementById("msgBody");
  const msgClose  = document.getElementById("msgClose");

  let currentNote = null;

  function abrirLectura(nota, sx, sy) {
    currentNote = nota;
    passTitle.textContent = `✉️ ${nota.titulo || "Nota"}`;
    passClave.value = "";
    passInfo.textContent = "";
    placePopup(passPopup, sx, sy);
    passClave.focus();
  }

  passCancel.addEventListener("click", () => { passPopup.style.display = "none"; passInfo.textContent=""; });
  passOk.addEventListener("click", () => {
    const clave = passClave.value;
    if (!clave) { passInfo.textContent = "Escribe la contraseña"; return; }
    try {
      const bytes = CryptoJS.AES.decrypt(currentNote.ciphertext, clave);
      const texto = bytes.toString(CryptoJS.enc.Utf8);
      if (!texto) { passInfo.textContent = "Contraseña equivocada"; return; }
      // ok
      passPopup.style.display = "none";
      msgTitle.textContent = `✉️ ${currentNote.titulo || "Nota"}`;
      msgMeta.textContent  = `por ${currentNote.autor || "—"} — ${new Date(currentNote.ts || Date.now()).toLocaleString()}`;
      msgBody.textContent  = texto; // textContent para evitar HTML
      placePopup(msgPopup, parseInt(passPopup.style.left||"40",10), parseInt(passPopup.style.top||"40",10));
    } catch (e) {
      passInfo.textContent = "Contraseña equivocada";
    }
  });
  msgClose.addEventListener("click", () => { msgPopup.style.display = "none"; });

  // ---------- Puente para editor (popup.js) ----------
  window._guardarNota = async (nota) => {
    await guardarItem(nota);
    await cargarDatos();
  };

  // lifecycle
  function init() {
    resizeCanvas();
    initWorldIfNeeded();
    buildEmojiGrid();
    setModo("leer");
    cargarDatos();
  }
  window.addEventListener("resize", () => { resizeCanvas(); dibujar(); });
  init();
})();