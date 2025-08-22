// app.js — mundo x10, scroll+drag, modos: Leer / Escribir / Decorar, arranque centrado

(() => {
  const API_URL = window.API_URL || "http://localhost:3000/mensajes";

  // ---- Mundo/Vista ----
  const WORLD_SCALE = 10;
  let worldW = 0,
    worldH = 0;
  let view = { x: 0, y: 0 };

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  // UI
  const btnLeer = document.getElementById("btn-leer");
  const btnEscribir = document.getElementById("btn-escribir");
  const btnDecorar = document.getElementById("btn-decorar");
  const statusEl = document.getElementById("status");
  const decorPanel = document.getElementById("decor-panel");
  const emojiGrid = document.getElementById("emojiGrid");
  const emojiSize = document.getElementById("emojiSize");
  const emojiSizeVal = document.getElementById("emojiSizeVal");
  const emojiPreview = document.getElementById("emojiPreview");

  // datos
  let notas = [];
  let decoraciones = [];

  // 20 emojis fijos
  const EMOJIS = [
    "🌳",
    "🌲",
    "🌴",
    "🪾",
    "⛰️",
    "🏔️",
    "🌋",
    "🗻",
    "🐇",
    "🐈‍⬛",
    "🦔",
    "🐁",
    "🌼",
    "🌸",
    "🌻",
    "🌺",
    "⛩️",
    "⛲",
    "⛺",
    "🚗",
  ];
  let activeEmoji = null;

  // pan/scroll
  let isPanning = false;
  let panStart = { x: 0, y: 0 },
    viewStart = { x: 0, y: 0 };
  let touchMoved = false;

  // HiDPI + centro
  function resizeCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = window.innerWidth,
      h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
  }
  function initWorldIfNeeded() {
    if (!worldW || !worldH) {
      worldW = Math.round(window.innerWidth * WORLD_SCALE);
      worldH = Math.round(window.innerHeight * WORLD_SCALE);
      const rect = canvas.getBoundingClientRect();
      view.x = Math.max(0, (worldW - rect.width) / 2);
      view.y = Math.max(0, (worldH - rect.height) / 2);
    }
  }

  // coords
  const screenToWorld = (x, y) => ({ x: view.x + x, y: view.y + y });
  const worldToScreen = (x, y) => ({ x: x - view.x, y: y - view.y });
  const normFromWorld = (x, y) => ({ x: x / worldW, y: y / worldH });
  const worldFromNorm = (nx, ny) => ({ x: nx * worldW, y: ny * worldH });

  // datos
  async function cargarDatos() {
    try {
      const r = await fetch(API_URL, { mode: "cors" });
      if (!r.ok) throw new Error("GET " + r.status);
      const arr = await r.json();
      notas = [];
      decoraciones = [];
      for (const it of arr) {
        const tipo =
          it.tipo ||
          (it.ciphertext ? "nota" : it.emoji ? "decoracion" : "nota");
        (tipo === "nota" ? notas : decoraciones).push(it);
      }
      dibujar();
    } catch (e) {
      try {
        const r = await fetch("./mensajes.json");
        const arr = await r.json();
        notas = arr.filter(
          (x) => (x.tipo || (x.ciphertext ? "nota" : "decoracion")) === "nota"
        );
        decoraciones = arr.filter(
          (x) =>
            (x.tipo || (x.ciphertext ? "nota" : "decoracion")) === "decoracion"
        );
        dibujar();
      } catch (_) {
        notas = [];
        decoraciones = [];
        dibujar(true);
      }
    }
  }
  async function guardarItem(item, retries = 1) {
    try {
      const r = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
        mode: "cors",
      });
      if (!r.ok) throw new Error("POST " + r.status);
      return r.json().catch(() => ({}));
    } catch (e) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 250));
        return guardarItem(item, retries - 1);
      }
      throw e;
    }
  }

  // dibujo
  function clear() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,.06)";
    const step = 100;
    for (let x = -(view.x % step); x < canvas.width; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = -(view.y % step); y < canvas.height; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }
    ctx.restore();
  }
  function drawEnvelope(x, y) {
    ctx.font =
      "20px system-ui, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✉️", x, y);
  }
  function dibujar(showMsg = false) {
    clear();
    if (showMsg) {
      ctx.fillStyle = "#777";
      ctx.font = "14px system-ui";
      ctx.fillText("Sin datos. Toca/clic para añadir.", 16, 28);
    }
    // decoraciones
    for (const d of decoraciones) {
      const W = worldFromNorm(d.x, d.y);
      const S = worldToScreen(W.x, W.y);
      if (
        S.x < -200 ||
        S.y < -200 ||
        S.x > canvas.width + 200 ||
        S.y > canvas.height + 200
      )
        continue;
      ctx.save();
      ctx.font = `${
        d.size || 48
      }px system-ui, Apple Color Emoji, Segoe UI Emoji, Noto Color Emoji`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(d.emoji || "❔", S.x, S.y);
      ctx.restore();
    }
    // notas
    for (const n of notas) {
      const W = worldFromNorm(n.x, n.y);
      const S = worldToScreen(W.x, W.y);
      if (
        S.x < -60 ||
        S.y < -60 ||
        S.x > canvas.width + 60 ||
        S.y > canvas.height + 60
      )
        continue;
      drawEnvelope(S.x, S.y);
      ctx.fillStyle = "#222";
      ctx.font = "12px system-ui";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText(n.titulo || n.autor || "nota", S.x, S.y + 14);
    }
    statusEl.textContent = `vista ${Math.round(view.x)}/${Math.round(
      view.y
    )} — mundo ${worldW}×${worldH}`;
  }

  // modos
  let modo = "leer"; // leer|escribir|decorar
  function setModo(m) {
    // si pulsas el mismo modo => volver a leer
    if (modo === m) {
      m = "leer";
    }
    modo = m;
    btnLeer.classList.toggle("active", modo === "leer");
    btnEscribir.classList.toggle("active", modo === "escribir");
    btnDecorar.classList.toggle("active", modo === "decorar");
    decorPanel.classList.toggle("open", modo === "decorar");
    document.body.style.cursor = modo === "escribir" ? "crosshair" : "default";
  }
  function buildEmojiGrid() {
    emojiGrid.innerHTML = "";
    EMOJIS.forEach((e) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "emoji-btn";
      b.textContent = e;
      b.addEventListener("click", () => {
        [...emojiGrid.children].forEach((x) => x.classList.remove("active"));
        b.classList.add("active");
        activeEmoji = e;
        emojiPreview.textContent = e;
        emojiPreview.style.fontSize = `${emojiSize.value}px`;
      });
      emojiGrid.appendChild(b);
    });
    emojiPreview.textContent = "—";
  }

  // popups util
  function centerPopup(el) {
    el.style.display = "block"; /* ya centrado por CSS */
  }
  function closePopup(el) {
    el.style.display = "none";
  }

  // interacción canvas
  function onPointerDown(ev) {
    const rect = canvas.getBoundingClientRect();
    const sx = ev.clientX - rect.left,
      sy = ev.clientY - rect.top;
    touchMoved = false;
    isPanning = true;
    panStart = { x: sx, y: sy };
    viewStart = { x: view.x, y: view.y };
    canvas.setPointerCapture?.(ev.pointerId);
  }
  function onPointerMove(ev) {
    if (!isPanning) return;
    const rect = canvas.getBoundingClientRect();
    const sx = ev.clientX - rect.left,
      sy = ev.clientY - rect.top;
    const dx = sx - panStart.x,
      dy = sy - panStart.y;
    if (Math.hypot(dx, dy) > 8) touchMoved = true;
    view.x = Math.max(0, Math.min(worldW - rect.width, viewStart.x - dx));
    view.y = Math.max(0, Math.min(worldH - rect.height, viewStart.y - dy));
    dibujar();
  }
  function onPointerUp(ev) {
    const rect = canvas.getBoundingClientRect();
    const sx = ev.clientX - rect.left,
      sy = ev.clientY - rect.top;
    isPanning = false;
    canvas.releasePointerCapture?.(ev.pointerId);

    // tap (sin arrastre) => acción de modo
    if (!touchMoved) {
      const W = screenToWorld(sx, sy),
        N = normFromWorld(W.x, W.y);

      if (modo === "escribir") {
        window.abrirEditorAt(N.x, N.y);
        return;
      }
      if (modo === "decorar") {
        if (!activeEmoji) {
          statusEl.textContent = "Elige un emoji";
          return;
        }
        const deco = {
          tipo: "decoracion",
          emoji: activeEmoji,
          size: Number(emojiSize.value) || 48,
          x: N.x,
          y: N.y,
          ts: Date.now(),
        };
        guardarItem(deco)
          .then(cargarDatos)
          .catch((err) => {
            console.error(err);
            statusEl.textContent = "Error guardando decoración";
          });
        return;
      }
      // leer: hit-test nota
      const hit = notas.find((n) => {
        const p = worldFromNorm(n.x, n.y),
          s = worldToScreen(p.x, p.y);
        return Math.hypot(s.x - sx, s.y - sy) < 16;
      });
      if (hit) abrirLectura(hit);
    }
  }
  function onWheel(ev) {
    ev.preventDefault();
    const rect = canvas.getBoundingClientRect(),
      K = 1;
    view.x = Math.max(0, Math.min(worldW - rect.width, view.x + ev.deltaX * K));
    view.y = Math.max(
      0,
      Math.min(worldH - rect.height, view.y + ev.deltaY * K)
    );
    dibujar();
  }

  // botones
  btnLeer.addEventListener("click", () => setModo("leer"));
  btnEscribir.addEventListener("click", () => setModo("escribir"));
  btnDecorar.addEventListener("click", () => setModo("decorar"));
  emojiSize.addEventListener("input", () => {
    emojiSizeVal.textContent = emojiSize.value;
    if (activeEmoji) {
      emojiPreview.style.fontSize = `${emojiSize.value}px`;
    }
  });

  // canvas events
  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  // lectura
  const passPopup = document.getElementById("popup-pass");
  const passTitle = document.getElementById("passTitle");
  const passClave = document.getElementById("passClave");
  const passInfo = document.getElementById("passInfo");
  const passCancel = document.getElementById("passCancel");
  const passOk = document.getElementById("passOk");

  const msgPopup = document.getElementById("popup-msg");
  const msgTitle = document.getElementById("msgTitle");
  const msgMeta = document.getElementById("msgMeta");
  const msgBody = document.getElementById("msgBody");
  const msgClose = document.getElementById("msgClose");

  let currentNote = null;
  function abrirLectura(nota) {
    currentNote = nota;
    passTitle.textContent = `✉️ ${nota.titulo || "Nota"}`;
    passClave.value = "";
    passInfo.textContent = "";
    centerPopup(passPopup);
    passClave.focus();
  }
  passCancel.addEventListener("click", () => closePopup(passPopup));
  passOk.addEventListener("click", () => {
    const clave = passClave.value;
    if (!clave) {
      passInfo.textContent = "Escribe la contraseña";
      return;
    }
    try {
      const bytes = CryptoJS.AES.decrypt(currentNote.ciphertext, clave);
      const texto = bytes.toString(CryptoJS.enc.Utf8);
      if (!texto) {
        passInfo.textContent = "Contraseña equivocada";
        return;
      }
      closePopup(passPopup);
      msgTitle.textContent = `✉️ ${currentNote.titulo || "Nota"}`;
      msgMeta.textContent = `por ${currentNote.autor || "—"} — ${new Date(
        currentNote.ts || Date.now()
      ).toLocaleString()}`;
      msgBody.textContent = texto;
      centerPopup(msgPopup);
    } catch {
      passInfo.textContent = "Contraseña equivocada";
    }
  });
  msgClose.addEventListener("click", () => closePopup(msgPopup));

  // puente para popup editor
  window._guardarNota = async (nota) => {
    await guardarItem(nota);
    await cargarDatos();
  };

  // init
  function init() {
    resizeCanvas();
    initWorldIfNeeded();
    buildEmojiGrid();
    setModo("leer");
    cargarDatos();
  }
  window.addEventListener("resize", () => {
    resizeCanvas();
    dibujar();
  });
  init();
})();
