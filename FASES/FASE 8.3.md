Fase 8.3 — Eliminar mock restante y activar usuarios reales

Objetivo:
Eliminar por completo usuarios fantasma, contenido demo y mocks restantes en AURA. Todo lo visible en Match, Círculo, Explorar, historias y chat debe venir de usuarios reales y backend real.

Reglas:
- Ahorrar tokens.
- Leer solo archivos relacionados con:
  Match, ZonaMatch, CitaDoble, chat de match, historias, círculo, explorar, layout lateral y store.
- No refactor masivo.
- No tocar PWA.
- No tocar pagos, SMS ni videollamadas.
- No inventar datos demo.
- Si una función no existe en backend, mostrar estado vacío real o crear backend mínimo.

Problemas actuales:
1. Siguen apareciendo usuarios mock/fantasma:
   @LunaSecreta, @DuetoNoct..., @HiloDePlata, etc.
2. Match todavía muestra conversación demo.
3. Círculo/Explorar muestran perfiles e historias fake.
4. Crear historia dice “próximamente”.
5. Queremos usuarios reales registrados, no contenido demo.

Tareas:
1. Buscar y eliminar arrays/mock data de usuarios, historias, círculos, explorar, match y chat.
2. Conectar Match únicamente a:
   - GET /api/match/candidates
   - POST /api/match/like/:targetUserId
   - POST /api/match/pass/:targetUserId
   - GET /api/match/matches
3. Conectar chat de match únicamente a conversaciones/mensajes reales del backend.
4. Si no hay candidatos reales, mostrar:
   “Aún no hay personas disponibles. Invita amigos para crear comunidad.”
5. Si no hay matches reales, mostrar:
   “Todavía no tienes matches reales.”
6. Crear historias reales mínimas si no existen:
   Backend:
   - tabla stories
   - POST /api/stories
   - GET /api/stories
   - GET /api/stories/following o /circle si aplica
   - upload de imagen usando sistema actual de uploads
   Frontend:
   - botón Crear historia funcional
   - subir imagen/texto
   - mostrar historias reales
7. Si no se implementa follow/circle todavía, usar feed real de historias públicas de usuarios reales.
8. Quitar nombres/perfiles demo de:
   - Tu Círculo
   - Explorar
   - historias
   - match
   - chat
9. Revisar que src/lib/store.js no siga generando usuarios locales fake.
10. Revisar que al apagar backend no aparezca ningún dato demo.

Criterios de aceptación:
1. Registro usuario A y usuario B reales.
2. Usuario A ve a B en Match.
3. Usuario B ve a A en Match.
4. Like recíproco crea match real.
5. Chat del match no tiene mensajes demo.
6. Historias muestran solo contenido real.
7. Crear historia funciona.
8. No aparece @LunaSecreta ni ningún usuario fantasma.
9. Si no hay datos reales, se muestra estado vacío, no mock.
10. Build sin errores.

Entregar solo:
- archivos modificados
- mocks eliminados encontrados
- endpoints nuevos si hubo
- comandos:
  docker compose down
  docker compose build
  docker compose up -d
  docker compose logs -f backend