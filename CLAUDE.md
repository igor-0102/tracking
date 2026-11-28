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

## GitHub: todo entra en `main` por Pull Request
- `main` está protegido: **nadie sube directo** (ni Claude ni Codex). Cada cambio va en una rama y una Pull Request (PR).
- Ramas: `claude/<tema>` (Claude), `handoff/<tarea>` (Codex), `codex/<tarea>` (Claude corrigiendo o publicando
  parte del trabajo de Codex).
- Cada PR pasa sola las **Comprobaciones** (`.github/workflows/checks.yml`): sintaxis de los `.js`, `npm test`,
  normas de este archivo (`npm run check` → `tools/check-pr.mjs`) y prueba de la app en un navegador de móvil
  (`npm run smoke` → `tools/smoke.cjs`: que abra, no se cuelgue, importe, recorra las pestañas y quepa en la pantalla).
- La descripción de la PR sigue la plantilla `.github/pull_request_template.md` (Tarea · Cambios · Pruebas · Dudas y riesgos).
- **Quién integra:** Claude, con las comprobaciones en verde y el OK del usuario. Si el usuario pidió el cambio
  («haz…», «publica…»), ese pedido ya es el OK. Método: «Squash and merge» o «Merge» desde GitHub; luego se borra la rama.
- Al integrar en `main` se publica la web (GitHub Pages) y, si cambian archivos nativos o `package.json`, se compila el APK.

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
- **No:** `main` (ni commits ni push), `.claude/`, `tools/` (salvo `tools/foods-es.txt` y la lista `files` de `tools/build-www.mjs`), `android/`, `.github/`, `capacitor.config.json`, claves o secretos,
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
- La PR solo contiene cambios de tu tarea y las Comprobaciones de GitHub salen en verde.

### Cómo entregar (Pull Request)
1. Trabaja en una rama `handoff/<tarea-corta>` creada desde el `main` más reciente. **Una tarea por rama.**
2. Antes de subir, ejecuta `npm test`, `npm run check` y, si tienes Playwright, `npm run smoke`.
3. Sube la rama y **abre una Pull Request hacia `main`** rellenando la plantilla (Tarea · Cambios · Pruebas ·
   Dudas y riesgos). Ya **no** se usa la carpeta `CODEX_HANDOFF/` ni `changes.patch`.
4. Espera a las **Comprobaciones** de GitHub. Si salen en rojo, corrígelo en la misma rama (sube más commits).
5. No integres la PR ni la cierres: la revisa e integra Claude. Si Claude pide cambios en la PR, corrígelos en la misma rama.
6. Si no puedes abrir la PR, sube la rama y avisa al usuario del nombre: Claude la abrirá.

## Claude: cómo revisa una entrega de Codex
**Antes de cualquier tarea**, busca entregas nuevas: Pull Requests abiertas de ramas `handoff/*` y ramas `handoff/*`
sin PR (`git ls-remote --heads origin`). Las revisadas se anotan en `docs/TAREAS.md` → «Entregas de Codex» (PR o rama y commit).
Si hay una nueva:
1. Si es una rama sin PR, ábrela tú (plantilla) para que pasen las Comprobaciones.
2. Lee la descripción y **el diff completo** de la PR (`git diff origin/main...origin/handoff/<rama>`); no te fíes solo del informe.
3. Mira las **Comprobaciones** de GitHub (tests, normas, prueba de la app). En rojo = no se integra así.
4. Revisa calidad, seguridad e integración con lo que ya existe; prueba la app tú también si toca la interfaz.
5. Informa al usuario: bien hecho · errores y gravedad · arquitectura · pruebas · qué corregir · qué es seguro.
6. Según lo que decida el usuario:
   - **Todo bien** → integrar la PR de Codex tal cual.
   - **Fallos pequeños** → rama `codex/<tarea>` desde la de Codex, corregir (cada corrección documentada en la
     descripción), PR nueva y cerrar la de Codex enlazando la nueva. No subas commits a la rama de Codex.
   - **Solo una parte vale** → rama `codex/<tarea>` desde `main` con solo los archivos buenos; lo demás pasa a
     `docs/TAREAS.md` como tareas nuevas de Codex, con cada error a corregir.
   - **No vale** → comentar en la PR qué falla, cerrarla y pasar la tarea corregida a `docs/TAREAS.md`.
7. Antes de integrar: subir versión (`VERSION`, `APP_VERSION`, `package.json`), actualizar `docs/ESTADO.md` y
   `docs/TAREAS.md` en la misma PR, y comprobaciones en verde.
No integres nada que no hayas podido verificar. Si hay conflictos, errores o incompatibilidades, no fuerces nada: informa.

## Equipo de agentes
- Agentes en `.claude/agents/`: arquitecto (Opus), programador (Sonnet), revisor (Opus),
  explorador (Haiku), arreglador (Sonnet), documentador (Sonnet), seguridad (Opus).
- Comandos: `/manager`, `/equipo`, `/plan`, `/revisar`, `/cerrar`, `/punto`, `/seguridad`, `/portfolio`.
- Memoria: estado en `docs/ESTADO.md` (lo carga el hook de inicio), tareas en `docs/TAREAS.md`, plan activo en `docs/plan/PLAN.md`.
- Traspaso entre chats: `docs/TRASPASO.md` (contexto completo y el ciclo de trabajo con Codex). Léelo al empezar un chat nuevo.
- `/manager`: activa el modo manager para todo el chat (elige y lanza agentes sin pedir permiso). Sin él, trabaja normal.
