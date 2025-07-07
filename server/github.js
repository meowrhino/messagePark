const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const owner = "meowrhino"; // ← tu usuario de GitHub
const repo = "messagePark"; // ← el repo donde está mensajes.json
const path = "mensajes.json";
const token = process.env.GITHUB_TOKEN;

// 🧠 Cabecera común para todas las llamadas
const headers = {
  Authorization: `token ${token}`,
  Accept: "application/vnd.github.v3+json",
};

// 📥 Leer contenido de mensajes.json desde el repo
// 📥 Leer contenido de mensajes.json desde el repo
async function leerMensajes() {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/server/${path}`, {
    headers
  });

  if (!res.ok) {
    throw new Error(`Error al leer ${path}: ${res.statusText}`);
  }

  const data = await res.json();

  // Decodifica el contenido base64
  const contenido = Buffer.from(data.content, 'base64').toString('utf-8');

  return {
    contenido: JSON.parse(contenido),
    sha: data.sha
  };
}

// 📤 Guardar nuevo contenido en mensajes.json
async function guardarMensajes(nuevosMensajes) {
  const { sha } = await leerMensajes();

  const contenidoNuevo = Buffer.from(JSON.stringify(nuevosMensajes, null, 2)).toString("base64");

  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
    method: "PUT",
    headers,
    body: JSON.stringify({
      message: "📝 actualizar mensajes",
      content: contenidoNuevo,
      sha,
    }),
  });

  if (!res.ok) {
    throw new Error(`Error al guardar ${path}: ${res.statusText}`);
  }

  const data = await res.json();
  return data;
}

module.exports = { leerMensajes, guardarMensajes };