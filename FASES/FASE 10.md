Fase 10 — Correcciones de feed, círculo, perfiles y notificaciones

Objetivo:
Corregir comportamiento real de usuarios: separación entre círculo y explorar, navegación a perfiles y base de notificaciones.

Reglas:
- No usar mock.
- No refactor masivo.
- Leer solo archivos relacionados con feed, stories, match, chat y usuarios.
- Mantener backend actual.
- No romper endpoints existentes.

Problemas a corregir:

1. Usuarios desconocidos aparecen en "Tu Círculo"
2. El nombre de usuario no es clickeable
3. No hay notificaciones en mensajes o matches
4. Falta separación lógica entre:
   - círculo (relaciones reales)
   - explorar (desconocidos)

---

Tareas:

### 1. Separar "Tu Círculo" vs "Explorar"

Reglas:
- "Tu Círculo" debe mostrar SOLO:
  - matches
  - contactos (si existen)
  - relaciones mutuas

- "Explorar" debe mostrar:
  - usuarios que NO tienen relación contigo

Backend:
- Usar matches como base del círculo
- Si no hay matches → mostrar estado vacío

Frontend:
- StoriesRow.jsx
- Feed.jsx
- separar fuentes de datos

---

### 2. Nombre de usuario clickeable

En:
- PostCard.jsx
- Stories
- Chat
- cualquier vista de usuario

Cambiar:
- username → botón o link

Ruta:
- /profile/:userId

Si no existe:
- crear vista simple de perfil público:
  - avatar
  - username
  - bio
  - posts del usuario

---

### 3. Notificaciones básicas (MVP)

Sin WebSockets todavía.

Backend:
Crear endpoint:
- GET /api/notifications

Eventos a registrar:
- nuevo match
- nuevo mensaje

Guardar en tabla simple:
notifications:
- id
- user_id
- type (match | message)
- reference_id
- created_at
- read (boolean)

Frontend:
- icono de campana
- contador simple
- fetch cada 10–15s (polling)

---

### 4. Feed limpio

- No mezclar usuarios random
- Solo mostrar:
  - tus posts
  - posts de matches (opcional)

Si no hay:
→ estado vacío:
"Aún no hay contenido en tu círculo"

---

### 5. Validaciones UX

- No mostrar usuarios sin relación en círculo
- No mostrar datos inconsistentes
- No duplicar usuarios

---

Criterios de aceptación:

- Usuario A no ve a usuario B en círculo si no hay relación
- Usuario A sí ve a B en explorar
- Click en username abre perfil
- Match genera notificación
- Mensaje genera notificación
- Feed muestra solo contenido válido
- No hay usuarios “fantasma”
- Build OK

---

Entregar solo:
- archivos modificados
- endpoints creados
- lógica usada para círculo vs explorar
- comandos docker:
  docker compose build
  docker compose up -d