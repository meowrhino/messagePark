# 🗺️ MessagePark — Espacio de notas cifradas

MessagePark es una web interactiva donde puedes dejar mensajes secretos cifrados en un lienzo virtual 10× más grande que tu pantalla. Las notas se cifran completamente en tu navegador (Zero Knowledge) y se colocan donde estés scrolleando. Nadie puede leerlas sin la contraseña.

---

## 🌐 Demo (cuando lo subas)
👉 [messagepark.netlify.app](https://messagepark.netlify.app) (o el dominio de GitHub Pages)

---

## ✨ Funcionalidades

- Lienzo infinito (1000vw × 1000vh)
- Notas flotantes visibles solo con contraseña
- Cifrado en el navegador (AES-GCM + PBKDF2)
- Backend persistente con SQLite
- Navegación libre con scroll, flechas y móvil
- Despliegue fácil con Render

---

## 🧠 Tecnologías usadas

- HTML + CSS + JS (Frontend sin framework)
- Express.js (servidor)
- SQLite3 (base de datos local)
- `crypto.subtle` Web API para cifrado
- Despliegue: GitHub Pages (frontend) + Render (backend)

---

## 🚀 Cómo desplegar

### 🔧 Requisitos
- Node.js ≥ 16
- Cuenta de [GitHub](https://github.com/) y [Render](https://render.com)

### 1. Clona este repositorio

```bash
git clone https://github.com/tuusuario/messagepark.git
cd messagepark