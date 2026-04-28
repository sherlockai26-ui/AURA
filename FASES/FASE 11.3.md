Fase 11.3 — Corregir soft delete y registro/login

Problema:
Después de eliminar una cuenta, al intentar registrarla de nuevo aparece:
“El correo o handle ya está en uso.”

Causa probable:
La cuenta se marca como eliminada con deleted_at, pero las queries de registro/login siguen considerando usuarios eliminados. También puede haber UNIQUE(email) o UNIQUE(handle) bloqueando reutilización.

Reglas:
- No refactor masivo.
- No tocar frontend salvo si hace falta.
- Leer solo:
  backend/src/routes/auth.js
  backend/src/routes/me.js
  backend/src/middleware/auth.js
  backend/src/schema.sql
  backend/src/db.js
- Mantener soft delete, no borrar físicamente usuarios.
- Build OK.

Tareas:

1. Registro:
En POST /api/auth/register, al validar duplicados, excluir usuarios eliminados:
WHERE (email = $1 OR handle = $2)
AND deleted_at IS NULL

2. Login:
En POST /api/auth/login, impedir login si deleted_at IS NOT NULL.

3. Auth middleware:
Al validar JWT, consultar DB y rechazar si:
- usuario no existe
- deleted_at IS NOT NULL
- status = 'deleted' si existe

4. Schema:
Revisar tabla users.
Si existen UNIQUE(email) o UNIQUE(handle) normales, reemplazarlos por índices únicos parciales:
CREATE UNIQUE INDEX IF NOT EXISTS users_email_active_unique
ON users (lower(email))
WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS users_handle_active_unique
ON users (lower(handle))
WHERE deleted_at IS NULL;

Si hay constraints UNIQUE antiguos que bloquean, eliminarlos de forma segura.

5. DELETE /api/me:
Confirmar que solo hace soft delete:
deleted_at = NOW()
status = 'deleted' si existe

6. Frontend:
Confirmar que al eliminar cuenta:
- llama DELETE /api/me
- limpia token/localStorage/store
- redirige a /login

Criterios de aceptación:
- Elimino una cuenta.
- No puedo iniciar sesión con esa cuenta eliminada.
- Puedo registrar una cuenta nueva usando el mismo email o handle.
- Token viejo de la cuenta eliminada deja de funcionar.
- Usuarios eliminados no aparecen en explorar, match, círculo ni feed.
- Build OK.

Entregar:
- archivos modificados
- queries cambiadas
- cambios de schema/índices
- comandos:
  docker compose build --no-cache
  docker compose up -d