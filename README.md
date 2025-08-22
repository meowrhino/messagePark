# 🎨 MessagePark

MessagePark es un pequeño **muro colaborativo** donde cualquiera puede dejar notas cifradas o decoraciones con emojis sobre un fondo compartido.  
El frontend vive en **GitHub Pages** y el backend en **Render**, con almacenamiento en disco y copia automática en este repositorio (`mensajes.json`).

---

## 🚀 Cómo funciona

- **Frontend** → desplegado en GitHub Pages:  
  [https://meowrhino.github.io/messagePark](https://meowrhino.github.io/messagePark)

- **Backend** → API Node.js/Express en Render:  
  `https://messagepark.onrender.com`

- **Datos** → se guardan en un archivo `mensajes.json` en el servidor de Render.  
  Con cada inserción se hace *mirror* opcional a este repositorio (si está configurado `GITHUB_TOKEN`).

---

## 📦 Endpoints de la API

- `GET /healthz` → comprueba que el servidor está vivo (`ok`).  
- `GET /mensajes` → devuelve todos los mensajes actuales en JSON.  
- `POST /mensajes` → añade un mensaje (nota o emoji).  
- `POST /sync-github` → fuerza la sincronización manual de los mensajes a GitHub.

---

## 📝 Añadir un mensaje (ejemplo con curl)

```bash
# Decoración (emoji)
curl -X POST https://messagepark.onrender.com/mensajes \
  -H "Content-Type: application/json" \
  -d '{"tipo":"decoracion","emoji":"🌼","size":90,"x":0.5,"y":0.5,"ts":1755886814156}'

# Nota cifrada
curl -X POST https://messagepark.onrender.com/mensajes \
  -H "Content-Type: application/json" \
  -d '{"tipo":"nota","titulo":"hello","autor":"manu","ciphertext":"...texto cifrado...","x":0.5,"y":0.53}'