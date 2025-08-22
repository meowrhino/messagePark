// server/index.js
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const https = require("https");

// --- config ---
const PORT = process.env.PORT || 3000;
// En Render usa un disco montado en /data (ver variable DB_FILE abajo)
const DB_FILE = process.env.DB_FILE
  ? process.env.DB_FILE
  : path.resolve(__dirname, "../mensajes.json");

const app = express();

/**
 * CORS:
 * - Permite GitHub Pages (front separado).
 * - Permite orígenes *.onrender.com (si sirves front+api en Render).
 * - Permite llamadas sin Origin (healthz/curl).
 */
app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // same-origin/healthz/curl
      if (origin === "https://meowrhino.github.io") return cb(null, true);
      if (origin.endsWith(".onrender.com")) return cb(null, true);
      return cb(null, false);
    },
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
    maxAge: 86400,
  })
);

app.options("*", cors()); // responde preflight

app.use(express.json({ limit: "128kb" }));

// Sirve el frontend (index.html, css, js) desde la raíz del repo
app.use(express.static(path.resolve(__dirname, "..")));

// ---------------- util fs (atómico) ----------------
async function ensureFile() {
  try {
    await fsp.access(DB_FILE, fs.constants.F_OK);
  } catch {
    await fsp.mkdir(path.dirname(DB_FILE), { recursive: true }).catch(() => {});
    await fsp.writeFile(DB_FILE, "[]", "utf8");
  }
}

async function readAll() {
  await ensureFile();
  try {
    const txt = await fsp.readFile(DB_FILE, "utf8");
    const arr = JSON.parse(txt);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    // si se corrompe, hacemos backup y reiniciamos
    try {
      await fsp.rename(DB_FILE, DB_FILE + ".bad");
    } catch {}
    await fsp.writeFile(DB_FILE, "[]", "utf8");
    return [];
  }
}

async function writeAll(arr) {
  const tmp = DB_FILE + ".tmp";
  await fsp.writeFile(tmp, JSON.stringify(arr, null, 2), "utf8");
  await fsp.rename(tmp, DB_FILE); // rename en mismo FS es atómico
}

// ---------------- GitHub mirror helpers ----------------
// Env defaults: only GITHUB_TOKEN is required; the rest have sensible defaults.
const GH_TOKEN  = process.env.GITHUB_TOKEN || null;          // required to enable mirror
const GH_REPO   = process.env.GITHUB_REPO  || "meowrhino/messagePark";
const GH_BRANCH = process.env.GITHUB_BRANCH|| "main";
const GH_PATH   = process.env.GITHUB_PATH  || "mensajes.json";

function githubRequest(method, url, body){
  return new Promise((resolve, reject)=>{
    const req = https.request(url, {
      method,
      headers: {
        "User-Agent": "messagepark",
        "Accept": "application/vnd.github+json",
        ...(GH_TOKEN ? { "Authorization": `Bearer ${GH_TOKEN}` } : {}),
        ...(body ? { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } : {})
      }
    }, res=>{
      let data = "";
      res.on("data", d => data += d);
      res.on("end", ()=>{
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ status: res.statusCode, json: data ? JSON.parse(data) : {} });
        } else {
          reject(new Error(`GitHub ${method} ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

async function getGithubFileSha(){
  const url = `https://api.github.com/repos/${GH_REPO}/contents/${encodeURIComponent(GH_PATH)}?ref=${encodeURIComponent(GH_BRANCH)}`;
  try{
    const { json } = await githubRequest("GET", url);
    return json.sha || null;
  }catch(e){
    // 404 → no existe; en ese caso devolvemos null
    if (String(e.message).includes(" 404:")) return null;
    throw e;
  }
}

async function putGithubFile(contentObj, commitMessage){
  if (!GH_TOKEN) return; // mirror desactivado si no hay token
  const sha = await getGithubFileSha(); // puede ser null si el archivo no existe aún
  const contentBase64 = Buffer.from(JSON.stringify(contentObj, null, 2), "utf8").toString("base64");
  const url = `https://api.github.com/repos/${GH_REPO}/contents/${encodeURIComponent(GH_PATH)}`;
  const body = JSON.stringify({
    message: commitMessage || "sync: actualizar mensajes.json",
    content: contentBase64,
    branch: GH_BRANCH,
    ...(sha ? { sha } : {})
  });
  await githubRequest("PUT", url, body);
}

async function mirrorToGithubIfConfigured(arr){
  try{
    await putGithubFile(arr, "sync: actualizar mensajes.json");
  }catch(e){
    console.warn("[GitHub mirror] fallo:", e.message);
  }
}

// ---------------- rutas api ----------------
app.get("/healthz", (_req, res) => res.type("text").send("ok"));

app.get("/mensajes", async (_req, res) => {
  try {
    const arr = await readAll();
    res.json(arr);
  } catch {
    res.status(500).json({ error: "error leyendo mensajes.json" });
  }
});

app.post("/mensajes", async (req, res) => {
  try {
    const b = req.body || {};

    // validación mínima
    const esNota = b.tipo === "nota" || (!!b.ciphertext && !b.emoji);
    const esDeco = b.tipo === "decoracion" || (!!b.emoji && !b.ciphertext);
    if (!esNota && !esDeco) {
      return res.status(400).json({ error: "payload no válido" });
    }

    // normaliza y limita
    b.x = Math.max(0, Math.min(1, Number(b.x)));
    b.y = Math.max(0, Math.min(1, Number(b.y)));
    if (typeof b.titulo === "string" && b.titulo.length > 120)
      b.titulo = b.titulo.slice(0, 120);
    if (typeof b.autor === "string" && b.autor.length > 80)
      b.autor = b.autor.slice(0, 80);
    if (typeof b.ciphertext === "string" && b.ciphertext.length > 10000) {
      return res.status(413).json({ error: "mensaje demasiado largo" });
    }
    if (typeof b.emoji === "string" && b.emoji.length > 8)
      b.emoji = b.emoji.slice(0, 8);
    if (b.size) b.size = Math.max(8, Math.min(256, Number(b.size)));
    b.ts = b.ts || Date.now();
    b.tipo = esNota ? "nota" : "decoracion";

    const arr = await readAll();
    arr.push(b);
    await writeAll(arr);
    // espejo opcional a GitHub si hay token
    await mirrorToGithubIfConfigured(arr);
    res.status(201).json({ ok: true, count: arr.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "error escribiendo mensajes.json" });
  }
});

// Forzar sincronización manual del archivo actual a GitHub (POST /sync-github)
app.post("/sync-github", async (_req, res) => {
  try{
    const arr = await readAll();
    await mirrorToGithubIfConfigured(arr);
    res.json({ ok: true, count: arr.length });
  }catch(e){
    res.status(500).json({ error: "error en sincronización con GitHub" });
  }
});

// Variante GET para probar desde el navegador (GET /sync-github)
app.get("/sync-github", async (_req, res) => {
  try{
    const arr = await readAll();
    await mirrorToGithubIfConfigured(arr);
    res.json({ ok: true, count: arr.length });
  }catch(e){
    res.status(500).json({ error: "error en sincronización con GitHub" });
  }
});

// Fallback: si navegas a /algo, devuelve index.html (excepto endpoints api/health)
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/mensajes") || req.path.startsWith("/healthz"))
    return next();
  res.sendFile(path.resolve(__dirname, "..", "index.html"));
});

// ---------------- start ----------------
app.listen(PORT, () => {
  console.log("listening on", PORT);
  console.log("DB_FILE:", DB_FILE);
});
