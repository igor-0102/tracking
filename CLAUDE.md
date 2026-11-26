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

## Codex (becario): cómo trabaja
Claude es el responsable del proyecto: decide, revisa, integra y publica. Codex hace **solo** las tareas de
`docs/TAREAS.md` con responsable **Codex**, y entrega su trabajo para que Claude lo revise.

### Antes de empezar
1. Parte siempre del `main` más reciente (`git pull origin main`).
2. Lee este archivo entero, `docs/ESTADO.md` y tu tarea en `docs/TAREAS.md`. No hagas tareas de otros responsables.
3. **Una tarea por entrega.** Si la tarea es grande, entrega una parte que funcione sola y explica qué falta.
4. Si algo de la tarea no está claro, no supongas: haz la versión más sencilla y apunta la duda en el informe.

### Qué puede tocar y qué no
- **Sí:** archivos web (`*.js`, `index.html`, `styles.css`), `tests/`, `tools/foods-es.txt` y archivos nuevos.
- **No:** `main` (ni commits ni push), `android/`, `.github/`, `capacitor.config.json`, claves o secretos,
  `foods-db.js` y `foods-usda.js` a mano (se generan con `npm run build:foods`), `CLAUDE.md`, `AGENTS.md` y `docs/`
  (los mantiene Claude), ni `VERSION` / `APP_VERSION` (los sube Claude al publicar).
- **Sin dependencias nuevas** (npm o CDN) ni llamadas a internet: la app funciona sin conexión y los datos no salen del móvil.

### Cómo programar aquí
- Sigue las **Reglas de código** y **Convenciones** de este archivo. Recordatorio de lo que más se olvida:
  - `app.js`, `gym.js` y `diet.js` pasan de 800 líneas: **no les añadas código**. Pon lo nuevo en un archivo nuevo
    y deja en ellos, como mucho, una línea que lo llame.
  - Funciones de menos de 50 líneas; archivos nuevos de menos de 800.
  - La lógica pura (cálculos, sin pantalla) va en su propio archivo con el patrón de `nutri.js`
    (funciona en el navegador y en Node) y con tests en `tests/<nombre>.test.mjs`, añadidos al script `test` de `package.json`.
  - Escapa con `esc()` todo texto del usuario o importado antes de meterlo en `innerHTML`.
  - Archivo web nuevo → añádelo a `index.html` (en el orden correcto), a `ASSETS` de `sw.js` y a `files` de `tools/build-www.mjs`.
  - Datos guardados: nunca borres ni cambies el formato sin migrar los de versiones anteriores.
  - Textos de la app en español, sencillos. Estilo visual: reutiliza las clases que ya existen (`card`, `btn`, `seg`…).
- Reutiliza lo que ya hay (`openSheet`, `actionSheet`, `openPage`, `toast`, `ask`, `fmtKg`, `fmtD`…) antes de crear nada parecido.

### Antes de entregar (definición de «hecho»)
- `npm test` pasa entero. Si no puedes ejecutarlo, dilo en el informe y explica por qué.
- `node --check` sin errores en cada `.js` que hayas tocado.
- Lo nuevo funciona sin conexión y no rompe lo que ya había (peso, entreno, dieta, copias de seguridad).
- El parche solo contiene cambios de tu tarea.

### Cómo entregar
1. Crea una rama `handoff/<tarea-corta>` desde `main` y súbela a GitHub. Avisa al usuario del nombre de la rama.
2. En esa rama, crea la carpeta `CODEX_HANDOFF/` con:
   - `BASELINE.md`: commit de partida (`git rev-parse HEAD` antes de empezar), rama y `APP_VERSION` de `app.js`.
   - `changes.patch`: `git add -N .` y `git diff <commit-de-partida> -- . ':!CODEX_HANDOFF' > CODEX_HANDOFF/changes.patch`.
   - `REPORT.md`, en español, con estos apartados:
     `## Tarea` (cuál de `docs/TAREAS.md`) · `## Cambios` (archivo por archivo y por qué) ·
     `## Pruebas` (qué has probado y resultado de `npm test`) · `## Dudas y riesgos` (lo que no has podido comprobar).
3. No hagas Pull Request: la prepara Claude tras revisar.

## Claude: cómo revisa una entrega de Codex
**Antes de cualquier tarea**, busca entregas nuevas: carpeta `CODEX_HANDOFF/` en `main` o ramas `handoff/*` en GitHub
(`git ls-remote --heads origin`). Es nueva si la huella `sha256` de `changes.patch` no está anotada en `docs/TAREAS.md`. Si la hay:
1. Lee `REPORT.md` y `BASELINE.md`.
2. Inspecciona `changes.patch` entero; no te fíes solo del informe.
3. Comprueba que el parche parte de la versión adecuada (commit y `APP_VERSION` de `BASELINE.md`).
4. Verifica que se aplica sin conflictos (`git apply --check`).
5. Revisa calidad del código y seguridad (reglas de este archivo y de la sección de Codex).
6. Aplícalo en una rama aparte (`codex/<tarea>`), nunca en `main`.
7. Ejecuta `npm test` y prueba la app.
8. Corrige los errores y documenta cada corrección.
9. Actualiza `docs/ESTADO.md`, `docs/TAREAS.md` (anota la entrega revisada) y esta memoria si hace falta.
10. Prepara una Pull Request con el resultado. Integrarla en `main` necesita el OK del usuario.
No integres nada que no hayas podido verificar. Si hay conflictos, errores o incompatibilidades, no fuerces el parche: informa.

## Equipo de agentes
- Agentes en `.claude/agents/`: arquitecto (Opus), programador (Sonnet), revisor (Opus),
  explorador (Haiku), arreglador (Sonnet), documentador (Sonnet), seguridad (Opus).
- Comandos: `/manager`, `/equipo`, `/plan`, `/revisar`, `/cerrar`, `/punto`, `/seguridad`, `/portfolio`.
- Memoria: estado en `docs/ESTADO.md` (lo carga el hook de inicio), tareas en `docs/TAREAS.md`, plan activo en `docs/plan/PLAN.md`.
- `/manager`: activa el modo manager para todo el chat (elige y lanza agentes sin pedir permiso). Sin él, trabaja normal.
