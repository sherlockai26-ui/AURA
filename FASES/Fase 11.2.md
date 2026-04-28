Fase 11.2 — Reparación crítica AURA: cuenta, posts, auth e imágenes

Objetivo:
Corregir bugs críticos antes de seguir agregando funciones.

Reglas:
- No agregar nuevas features grandes.
- No refactor masivo.
- No tocar pagos, SMS real, SPEI ni videollamadas.
- No usar mocks.
- Leer solo archivos relacionados.
- Build OK obligatorio.

Tareas:

1. Eliminar cuenta real:
- Crear/corregir DELETE /api/me.
- Agregar users.deleted_at TIMESTAMPTZ NULL.
- Al eliminar, marcar deleted_at = NOW().
- Login debe rechazar usuarios eliminados.
- Auth middleware debe consultar DB y rechazar tokens de usuarios eliminados.
- Frontend debe llamar DELETE /api/me, limpiar sesión y redirigir a /login.
- Usuario eliminado no debe aparecer en explorar, match, feed ni círculo.

2. Eliminar publicaciones propias:
- Crear DELETE /api/posts/:id.
- Solo el dueño puede borrar.
- Borrar likes/comments asociados si hace falta.
- En PostCard mostrar botón eliminar solo si post.user_id === usuario actual.
- Confirmar antes de borrar.
- Quitar post del feed después de eliminar.

3. Arreglar flujo de imagen en publicaciones:
- Revisar StatusBox.jsx, Feed.jsx, PostComposer y apiCreatePost.
- Asegurar que image_url subida se conserve y se envíe a POST /api/posts.
- Permitir:
  texto solo
  imagen sola
  texto + imagen
- PostCard debe usar image_url real del post.
- Comparar URL de imagen en Feed vs Stories.
- Quitar temporalmente media-watermark si interfiere.
- Imagen debe verse completa, sin zoom ni recorte.

4. Auth real en frontend:
- RequireAuth no debe confiar solo en localStorage/Zustand.
- Debe validar sesión con GET /api/me al entrar.
- Si /api/me falla, limpiar sesión y mandar a /login.

5. Seguridad mínima:
- Si JWT_SECRET es default, backend debe fallar en producción o advertir fuerte.
- Restringir CORS_ORIGIN al dominio real en .env.example.
- Agregar validación frontend de imágenes:
  jpg/png/webp
  tamaño máximo razonable

Criterios:
- Puedo eliminar mi cuenta.
- No puedo volver a iniciar sesión con esa cuenta.
- Token viejo deja de funcionar.
- Puedo eliminar mis publicaciones.
- No puedo eliminar publicaciones ajenas.
- Puedo crear post con imagen y verla completa.
- Feed e historias usan URLs reales.
- Rutas protegidas validan /api/me.
- Build OK.

Entregar:
- archivos modificados
- causa real de cada bug
- endpoints creados/corregidos
- comandos:
  docker compose build --no-cache
  docker compose up -d