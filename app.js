// app.js — leer | escribir | decorar
// mundo x10, orografía visible, viento en el mundo (ráfagas), responsive y UI en minúsculas

(() => {
  const API_URL = window.API_URL || "http://localhost:3000/mensajes";

  // --- mundo/viewport ---
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
  const emojiRow = document.getElementById("emojiRow");
  const emojiSize = document.getElementById("emojiSize");
  const emojiSizeVal = document.getElementById("emojiSizeVal");
  const emojiPreviewBig = document.getElementById("emojiPreviewBig");

  // datos
  let notas = [];
  let decoraciones = [];

  const GROUPS = [
    ["🌳", "🌲", "🌴", "🪾"],
    ["⛰️", "🏔️", "🌋", "🗻"],
    ["🐇", "🐈‍⬛", "🦔", "🐁"],
    ["🌼", "🌸", "🌻", "🌺"],
    ["⛩️", "⛲", "⛺", "🚗"],
  ];
  let activeEmoji = null;

  // --- input ---
  let pointerActive = false,
    isPanning = false,
    touchMoved = false;
  let panStart = { x: 0, y: 0 },
    viewStart = { x: 0, y: 0 };

  function resizeCanvas() {
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = window.innerWidth,
      h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    markBgDirty();
  }
  function initWorldIfNeeded() {
    if (!worldW || !worldH) {
      worldW = Math.round(window.innerWidth * WORLD_SCALE);
      worldH = Math.round(window.innerHeight * WORLD_SCALE);
      const r = canvas.getBoundingClientRect();
      view.x = Math.max(0, (worldW - r.width) / 2);
      view.y = Math.max(0, (worldH - r.height) / 2);
      markBgDirty();
    }
  }

  const screenToWorld = (x, y) => ({ x: view.x + x, y: view.y + y });
  const worldToScreen = (x, y) => ({ x: x - view.x, y: y - view.y });
  const normFromWorld = (x, y) => ({ x: x / worldW, y: y / worldH });
  const worldFromNorm = (nx, ny) => ({ x: nx * worldW, y: ny * worldH });

  // --- storage ---
  async function cargarDatos() {
    try {
      const r = await fetch(API_URL, { mode: "cors" });
      if (!r.ok) throw new Error("get " + r.status);
      const arr = await r.json();
      notas = [];
      decoraciones = [];
      for (const it of arr) {
        const tipo =
          it.tipo ||
          (it.ciphertext ? "nota" : it.emoji ? "decoracion" : "nota");
        (tipo === "nota" ? notas : decoraciones).push(it);
      }
      needItemsRedraw = true;
    } catch {
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
        needItemsRedraw = true;
      } catch {
        notas = [];
        decoraciones = [];
        needItemsRedraw = true;
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
      if (!r.ok) throw new Error("post " + r.status);
      return r.json().catch(() => ({}));
    } catch (e) {
      if (retries > 0) {
        await new Promise((r) => setTimeout(r, 250));
        return guardarItem(item, retries - 1);
      }
      throw e;
    }
  }

  // --- fondo: orografía ---
  const bg = document.createElement("canvas");
  const bgCtx = bg.getContext("2d", { willReadFrequently: true });
  let bgDirty = true;
  function markBgDirty() {
    bgDirty = true;
  }
  const SEED = 1337;
  function rnd(i, j) {
    const s = Math.sin(i * 127.1 + j * 311.7 + SEED) * 43758.5453;
    return s - Math.floor(s);
  }
  const smooth = (t) => t * t * (3 - 2 * t);
  function valueNoise(x, y) {
    const x0 = Math.floor(x),
      y0 = Math.floor(y);
    const xf = x - x0,
      yf = y - y0;
    const v00 = rnd(x0, y0),
      v10 = rnd(x0 + 1, y0),
      v01 = rnd(x0, y0 + 1),
      v11 = rnd(x0 + 1, y0 + 1);
    const u = smooth(xf),
      v = smooth(yf);
    const a = v00 * (1 - u) + v10 * u;
    const b = v01 * (1 - u) + v11 * u;
    return a * (1 - v) + b * v;
  }
  function fbm(x, y) {
    let f = 0,
      amp = 0.5,
      freq = 1;
    for (let o = 0; o < 4; o++) {
      f += amp * valueNoise(x * freq, y * freq);
      amp *= 0.5;
      freq *= 2;
    }
    return f;
  }
  function lerp(a, b, t) {
    return a + (b - a) * t;
  }
  const LOW = [0xe9, 0xff, 0xf5],
    HIGH = [0xe8, 0xf0, 0xff],
    PEAK = [0xff, 0xff, 0xff];
  const ORO_SCALE = 220,
    ORO_OFFSET = 0.28,
    ORO_RANGE = 0.55,
    ORO_GAMMA = 0.85,
    PEAK_START = 0.66,
    PEAK_RANGE = 0.24;

  function redrawBackground() {
    const W = canvas.width,
      H = canvas.height,
      s = 0.5;
    const w = Math.max(2, Math.round(W * s)),
      h = Math.max(2, Math.round(H * s));
    if (bg.width !== w || bg.height !== h) {
      bg.width = w;
      bg.height = h;
    }
    const img = bgCtx.createImageData(w, h),
      data = img.data;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const wx = view.x + x * (W / w),
          wy = view.y + y * (H / h);
        const n = fbm(wx / ORO_SCALE, wy / ORO_SCALE);
        let t = (n - ORO_OFFSET) / ORO_RANGE;
        t = Math.max(0, Math.min(1, t));
        t = Math.pow(t, ORO_GAMMA);
        let m = (n - PEAK_START) / PEAK_RANGE;
        m = Math.max(0, Math.min(1, m));
        const r = Math.round(lerp(LOW[0], HIGH[0], t) * (1 - m) + PEAK[0] * m);
        const g = Math.round(lerp(LOW[1], HIGH[1], t) * (1 - m) + PEAK[1] * m);
        const b = Math.round(lerp(LOW[2], HIGH[2], t) * (1 - m) + PEAK[2] * m);
        const i = (y * w + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
    bgCtx.putImageData(img, 0, 0);
    bgDirty = false;
  }

  // --- viento en coordenadas de mundo ---
  const gusts = [];
  let lastTime = performance.now();
  function fieldAngleWorld(xw, yw, t) {
    const n = fbm((xw + t * 40) / 1200, (yw - t * 30) / 1200); // mundo → 0..1
    return (n * 2 - 1) * Math.PI; // -PI..PI
  }
  function spawnGust() {
    const max = Math.max(
      8,
      Math.round((canvas.width * canvas.height) / 150000)
    );
    if (gusts.length > max) return;
    gusts.push({
      xw: view.x + Math.random() * canvas.width,
      yw: view.y + Math.random() * canvas.height,
      life: 0,
      maxLife: 1.2 + Math.random() * 1.6,
      path: [], // puntos en mundo
    });
  }
  function updateGusts(dt, now) {
    if (Math.random() < 0.25) spawnGust();
    const t = now / 1000;
    const speed = 140; // px/s en mundo
    const xMin = view.x - 200,
      xMax = view.x + canvas.width + 200;
    const yMin = view.y - 200,
      yMax = view.y + canvas.height + 200;

    for (let i = gusts.length - 1; i >= 0; i--) {
      const g = gusts[i];
      g.life += dt;
      const a = fieldAngleWorld(g.xw, g.yw, t);
      g.xw += Math.cos(a) * speed * dt;
      g.yw += Math.sin(a) * speed * dt;

      if (g.xw < xMin || g.xw > xMax || g.yw < yMin || g.yw > yMax) {
        gusts.splice(i, 1);
        continue;
      }

      g.path.push({ xw: g.xw, yw: g.yw });
      if (g.path.length > 30) g.path.shift();
      if (g.life >= g.maxLife) gusts.splice(i, 1);
    }
  }
  function drawGusts() {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const g of gusts) {
      const k = Math.max(0, 1 - g.life / g.maxLife);
      ctx.strokeStyle = `rgba(0,0,0,${0.18 * k})`;
      ctx.lineWidth = 1 + 0.6 * k;
      ctx.beginPath();
      for (let i = 0; i < g.path.length; i++) {
        const p = g.path[i];
        const s = worldToScreen(p.xw, p.yw);
        if (i === 0) ctx.moveTo(s.x, s.y);
        else ctx.lineTo(s.x, s.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // --- items ---
  function drawEnvelope(x, y) {
    ctx.font =
      "20px system-ui, apple color emoji, segoe ui emoji, noto color emoji";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✉️", x, y);
  }

  function drawAll() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);
    drawGusts();

    for (const d of decoraciones) {
      const W = worldFromNorm(d.x, d.y),
        S = worldToScreen(W.x, W.y);
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
      }px system-ui, apple color emoji, segoe ui emoji, noto color emoji`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(d.emoji || "❔", S.x, S.y);
      ctx.restore();
    }
    for (const n of notas) {
      const W = worldFromNorm(n.x, n.y),
        S = worldToScreen(W.x, W.y);
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

  // --- animación ---
  let needItemsRedraw = true;
  function frame(now) {
    const dt = Math.min(0.05, (now - lastTime) / 1000);
    lastTime = now;
    if (bgDirty) redrawBackground();
    updateGusts(dt, now);
    drawAll(); // viento es animación continua
    requestAnimationFrame(frame);
  }

  // --- interacción canvas ---
  function onPointerDown(ev) {
    pointerActive = true;
    const r = canvas.getBoundingClientRect();
    const sx = ev.clientX - r.left,
      sy = ev.clientY - r.top;
    touchMoved = false;
    isPanning = true;
    panStart = { x: sx, y: sy };
    viewStart = { x: view.x, y: view.y };
    canvas.setPointerCapture?.(ev.pointerId);
  }
  function onPointerMove(ev) {
    if (!pointerActive || !isPanning) return;
    const r = canvas.getBoundingClientRect();
    const sx = ev.clientX - r.left,
      sy = ev.clientY - r.top;
    const dx = sx - panStart.x,
      dy = sy - panStart.y;
    if (Math.hypot(dx, dy) > 8) touchMoved = true;
    view.x = Math.max(0, Math.min(worldW - r.width, viewStart.x - dx));
    view.y = Math.max(0, Math.min(worldH - r.height, viewStart.y - dy));
    markBgDirty();
  }
  function onPointerUp(ev) {
    if (!pointerActive) return;
    pointerActive = false;
    const r = canvas.getBoundingClientRect();
    const sx = ev.clientX - r.left,
      sy = ev.clientY - r.top;
    isPanning = false;
    canvas.releasePointerCapture?.(ev.pointerId);

    if (!touchMoved) {
      const W = screenToWorld(sx, sy),
        N = normFromWorld(W.x, W.y);
      if (modo === "escribir") {
        window.abrirEditorAt(N.x, N.y);
        return;
      }
      if (modo === "decorar") {
        if (!activeEmoji) {
          statusEl.textContent = "elige un emoji";
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
            statusEl.textContent = "error guardando decoración";
          });
        return;
      }
      const hit = notas.find((n) => {
        const p = worldFromNorm(n.x, n.y),
          s = worldToScreen(p.x, p.y);
        return Math.hypot(s.x - sx, s.y - sy) < 16;
      });
      if (hit) abrirLectura(hit);
    }
  }
  function onWheel(ev) {
    if (ev.target !== canvas) return;
    ev.preventDefault();
    const r = canvas.getBoundingClientRect(),
      K = 1;
    view.x = Math.max(0, Math.min(worldW - r.width, view.x + ev.deltaX * K));
    view.y = Math.max(0, Math.min(worldH - r.height, view.y + ev.deltaY * K));
    markBgDirty();
  }

  // --- modos ---
  let modo = "leer";
  function setModo(m) {
    if (modo === m) m = "leer";
    modo = m;
    btnLeer.classList.toggle("active", modo === "leer");
    btnEscribir.classList.toggle("active", modo === "escribir");
    btnDecorar.classList.toggle("active", modo === "decorar");
    decorPanel.classList.toggle("open", modo === "decorar");
    document.body.style.cursor = modo === "escribir" ? "crosshair" : "default";
  }
  btnLeer.addEventListener("click", () => setModo("leer"));
  btnEscribir.addEventListener("click", () => setModo("escribir"));
  btnDecorar.addEventListener("click", () => setModo("decorar"));

  // --- UI emojis por grupos (fila horizontal) ---
  function buildEmojiRow() {
    emojiRow.innerHTML = "";
    GROUPS.forEach((group) => {
      const wrap = document.createElement("div");
      wrap.className = "emoji-group";
      group.forEach((e) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "emoji-btn";
        b.textContent = e;
        b.addEventListener("click", () => {
          [...emojiRow.querySelectorAll(".emoji-btn")].forEach((x) =>
            x.classList.remove("active")
          );
          b.classList.add("active");
          activeEmoji = e;
          emojiPreviewBig.textContent = e;
          emojiPreviewBig.style.fontSize = `${emojiSize.value}px`;
        });
        wrap.appendChild(b);
      });
      emojiRow.appendChild(wrap);
    });
    emojiPreviewBig.textContent = "—";
  }
  emojiSize.addEventListener("input", () => {
    emojiSizeVal.textContent = emojiSize.value;
    if (activeEmoji) {
      emojiPreviewBig.style.fontSize = `${emojiSize.value}px`;
    }
  });

  // --- lectura popups ---
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
    passTitle.textContent = `✉️ ${nota.titulo || "nota"}`;
    passClave.value = "";
    passInfo.textContent = "";
    passPopup.style.display = "block";
    passClave.focus();
  }
  passCancel.addEventListener("click", () => {
    passPopup.style.display = "none";
  });
  passOk.addEventListener("click", () => {
    const clave = passClave.value;
    if (!clave) {
      passInfo.textContent = "escribe la contraseña";
      return;
    }
    try {
      const bytes = CryptoJS.AES.decrypt(currentNote.ciphertext, clave);
      const texto = bytes.toString(CryptoJS.enc.Utf8);
      if (!texto) {
        passInfo.textContent = "contraseña equivocada";
        return;
      }
      passPopup.style.display = "none";
      msgTitle.textContent = `✉️ ${currentNote.titulo || "nota"}`;
      msgMeta.textContent = `de ${currentNote.autor || "—"} — ${new Date(
        currentNote.ts || Date.now()
      ).toLocaleString()}`;
      msgBody.textContent = texto;
      msgPopup.style.display = "block";
    } catch {
      passInfo.textContent = "contraseña equivocada";
    }
  });
  msgClose.addEventListener("click", () => {
    msgPopup.style.display = "none";
  });

  // puente para popup.js
  window._guardarNota = async (nota) => {
    await guardarItem(nota);
    await cargarDatos();
  };

  // eventos
  canvas.addEventListener("pointerdown", onPointerDown);
  window.addEventListener("pointermove", onPointerMove);
  window.addEventListener("pointerup", onPointerUp);
  window.addEventListener("wheel", onWheel, { passive: false });

  // init
  function init() {
    resizeCanvas();
    initWorldIfNeeded();
    buildEmojiRow();
    setModo("leer");
    cargarDatos();
    requestAnimationFrame(frame);
  }
  window.addEventListener("resize", () => {
    resizeCanvas();
  });
  init();
})();
