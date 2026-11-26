# Tracking

PWA (y app Android con Capacitor) para registrar peso, entrenamientos de gimnasio y dieta.
Los datos viven solo en el móvil (IndexedDB). Sin servidor ni backend.

## Preferencias
- Antes de implementar algo no trivial, hazme preguntas de aclaración. Prefiero muchas preguntas a que supongas.
- En cada pregunta: 2-4 opciones, la recomendada primero y marcada "(Recomendada)", con una explicación breve de cada opción (ventajas e inconvenientes) y por qué recomiendas esa.
- Explica las cosas en español y en lenguaje sencillo. Los textos de la app, en español.

## Stack y comandos
- JavaScript sin framework ni bundler: `index.html`, `styles.css` y scripts sueltos.
- Tests: `npm test` (node:test, archivos en `tests/`).
- Regenerar alimentos: `npm install && npm run build:foods` (fuente: `tools/foods-es.txt`).
- Android: `npm run sync` (copia a `www/` con `tools/build-www.mjs`); el APK se compila en GitHub Actions.

## Estructura
- `app.js` peso, ajustes, copias de seguridad · `gym.js` entrenos, rutinas, importación Hevy
- `diet.js` interfaz de dieta · `nutri.js` cálculos (macros, TMB, GET), lógica pura con tests
- `foods.js` interfaz de fuentes de alimentos · `foods-db.js` / `foods-usda.js` datos generados (no editar a mano)
- `sw.js` service worker · `android/`, `native/`, `capacitor.config.json` parte nativa

## Convenciones
- Al publicar: sube `VERSION` en `sw.js` y `APP_VERSION` en `app.js` (mismo número).
- Si añades un archivo web nuevo: inclúyelo en `ASSETS` de `sw.js` y en `files` de `tools/build-www.mjs`.
- Nunca rompas los datos guardados de versiones anteriores: migra, no borres.
- La lógica pura va separada de la interfaz y con tests (como `nutri.js`).

## Reglas de código
- Funciones de menos de 50 líneas; archivos nuevos de menos de 800 (no hagas crecer más los que ya lo superan).
- Sin secretos en el código ni en el repo (claves de firma solo en secretos de GitHub).
- Sin errores silenciados (`catch {}` vacío) ni `console.log` de depuración.
- Escapa siempre el texto del usuario o de archivos importados antes de meterlo en `innerHTML`.

## Commits
- Conventional Commits en español: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:`.
- Si el usuario pide una actualización o un cambio concreto, impleméntalo, haz commit y súbelo **sin pedir confirmación**.
- Para cualquier otra modificación (lo que propongas tú, limpiezas, cambios no pedidos): explica qué quieres hacer y espera su confirmación antes del commit.

## Entregas de Codex (becario)
Claude es el responsable del proyecto; Codex hace tareas sueltas y las entrega en `CODEX_HANDOFF/` (formato en `AGENTS.md`).
**Antes de cualquier tarea**, comprueba si hay una entrega nueva en `CODEX_HANDOFF/` (compara la huella `sha256` de
`changes.patch` con la última anotada en `docs/TAREAS.md`). Si la hay:
1. Lee `REPORT.md` y `BASELINE.md`.
2. Inspecciona `changes.patch` entero; no te fíes solo del informe.
3. Comprueba que el parche parte de la versión adecuada (commit y `APP_VERSION` de `BASELINE.md`).
4. Verifica que se aplica sin conflictos (`git apply --check`).
5. Revisa calidad del código y seguridad (reglas de este archivo).
6. Aplícalo en una rama aparte (`codex/<tarea>`), nunca en `main`.
7. Ejecuta `npm test` y prueba la app.
8. Corrige los errores y documenta cada corrección.
9. Actualiza `docs/ESTADO.md`, `docs/TAREAS.md` (anota la entrega revisada) y esta memoria si hace falta.
10. Prepara una Pull Request con el resultado.
No integres nada que no hayas podido verificar. Si hay conflictos, errores o incompatibilidades, no fuerces el parche: informa.

## Equipo de agentes
- Agentes en `.claude/agents/`: arquitecto (Opus), programador (Sonnet), revisor (Opus),
  explorador (Haiku), arreglador (Sonnet), documentador (Sonnet), seguridad (Opus).
- Comandos: `/manager`, `/equipo`, `/plan`, `/revisar`, `/cerrar`, `/punto`, `/seguridad`, `/portfolio`.
- Memoria: estado en `docs/ESTADO.md` (lo carga el hook de inicio), tareas en `docs/TAREAS.md`, plan activo en `docs/plan/PLAN.md`.
- `/manager`: activa el modo manager para todo el chat (elige y lanza agentes sin pedir permiso). Sin él, trabaja normal.
