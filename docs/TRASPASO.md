# Traspaso para un chat nuevo

Pega en el chat nuevo: **«Lee `docs/TRASPASO.md` y haz el ciclo de trabajo.»** Este archivo explica qué es el proyecto,
cómo se trabaja con Codex y cómo se publica. Las normas detalladas están en `CLAUDE.md`, el estado en `docs/ESTADO.md`
y lo pendiente en `docs/TAREAS.md`.

## 1. El proyecto en 30 segundos
- **Tracking**: app en español para registrar peso, entrenos (estilo Hevy) y dieta. PWA + app Android (Capacitor 8).
- Sin servidor: los datos viven solo en el móvil (IndexedDB). JavaScript sin framework ni bundler.
- Repositorio: **`igor-0102/tracking`** (GitHub, cuenta `igor-0102`). No usar ni tocar nunca la otra cuenta del usuario.
- Web: https://igor-0102.github.io/tracking/ (GitHub Pages desde `main`).
- APK: https://github.com/igor-0102/tracking/releases/latest/download/Tracking.apk. Lo compila y firma
  `.github/workflows/android.yml` al subir a `main`. La clave de firma está solo en los secretos de GitHub
  (`KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`): nunca en el repo ni en el chat.
- El APK carga la web de GitHub Pages: los cambios web llegan solos al móvil (banner «Actualizar»). Solo hace falta APK
  nuevo si se toca la parte nativa (`android/`, `native/`, plugins).

## 2. Papeles
- **Usuario**: decide y prueba en su móvil (Xiaomi 14T Pro). Escribe en español sencillo; quiere preguntas con opciones
  (la recomendada primero) antes de cosas no triviales.
- **Claude (tú)**: jefe del proyecto. Revisa, corrige, integra, publica y reparte tareas.
- **Codex**: becario. Solo hace tareas de `docs/TAREAS.md` con responsable Codex y entrega en ramas `handoff/<tarea>`
  con la carpeta `CODEX_HANDOFF/` (`BASELINE.md`, `changes.patch`, `REPORT.md`). Sus instrucciones: `AGENTS.md` → `CLAUDE.md`.

## 3. El ciclo de trabajo (lo que se hace casi siempre)
1. **Buscar entregas nuevas de Codex**
   ```bash
   cd tracking && git fetch origin && git ls-remote --heads origin 'handoff/*'
   ```
   Una entrega es nueva si la huella `sha256sum CODEX_HANDOFF/changes.patch` no está en `docs/TAREAS.md` → «Entregas de Codex».
   Ramas antiguas ya vistas: `handoff/codex-primera-entrega`, `handoff/mejoras-opiniones`, `handoff/c1…c7`, `handoff/claude-ready`.
2. **Auditar sin tocar nada** (el usuario suele pedir primero solo el informe):
   - Copia de trabajo aparte: `git worktree add --detach <scratchpad>/rev origin/handoff/<rama>`.
   - Leer `REPORT.md` y `BASELINE.md`. **Ojo:** Codex a veces pone como base un commit suyo y no `main`. Compara siempre
     toda la rama con main: `git diff origin/main...origin/handoff/<rama> --stat`.
   - Leer el diff entero. Comprobar las normas: archivos prohibidos, `gym.js`, `app.js` y `diet.js` sin crecer,
     `esc()` en `innerHTML`, sin `catch {}` vacío, scripts nuevos en `index.html`, `sw.js` y `tools/build-www.mjs`.
   - `npm test` y `node --check` de cada `.js`.
   - **Probar la app en el navegador** (ver punto 5). Es imprescindible: en la última entrega, 100/100 tests pasaban
     y la app se colgaba al abrirla.
   - Informe al usuario con 6 apartados: bien hecho · errores y gravedad · arquitectura · pruebas · qué corregir ·
     qué es seguro. Luego **esperar su OK**.
3. **Publicar solo lo bueno** (cuando el usuario lo pide):
   - Rama `codex/<tarea>` desde `main`; traer solo los archivos buenos: `git checkout origin/handoff/<rama> -- <archivos>`.
   - Quitar lo que dependa de partes no publicadas (por ejemplo, botones cuyo código no viene). Corregir y documentar.
   - Si cambia `tools/foods-es.txt`: `npm install && npm run build:foods` y comprobar que `foods-db.js` sale igual.
   - Añadir los tests nuevos al script `test` de `package.json`. `npm test` y prueba en el navegador.
   - Subir versión: `VERSION` en `sw.js` (`tracking-X.Y.Z`), `APP_VERSION` en `app.js` y `version` en `package.json`.
4. **Devolver lo malo a Codex**: en `docs/TAREAS.md` → «Tareas para Codex», una tarea por bloque, con los archivos y
   cada error a corregir y su gravedad. Anotar la entrega revisada en «Entregas de Codex» (fecha, `sha256`, resultado).
5. **Actualizar `docs/ESTADO.md`**, hacer commit (Conventional Commits en español), integrar en `main` y subir:
   ```bash
   git checkout main && git merge --no-ff codex/<tarea> -m "feat: …" && git push origin main codex/<tarea>
   ```
   Luego decirle al usuario qué se publicó, qué volvió a Codex y si necesita APK nuevo.

## 4. Permisos y confirmaciones
- Si el usuario pide un cambio concreto o «publica» → hazlo, commit y push **sin pedir confirmación**.
- Lo que propongas tú (limpiezas, mejoras no pedidas) → explícalo y espera su OK.
- Si pide solo una auditoría → no modifiques, no integres y no borres nada.
- Nunca: secretos en el repo o el chat, ni datos personales del usuario (sus pesos) en el código.

## 5. Probar la app en el navegador (Playwright ya instalado)
En la sesión en la nube, `require('playwright')` funciona sin instalar nada. La app se sirve desde disco con una ruta
falsa (no hace falta servidor). Script mínimo (guárdalo en el scratchpad, no en el repo):
```js
const { chromium, devices } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = process.argv[2] || '/home/user/tracking';
(async () => {
  const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['Pixel 7'], locale: 'es-ES' });
  await ctx.route('http://localhost:8766/**', r => { const f = new URL(r.request().url()).pathname.slice(1) || 'index.html';
    const full = path.join(ROOT, f); if (!fs.existsSync(full)) return r.fulfill({ status: 404, body: '' });
    r.fulfill({ status: 200, contentType: { html: 'text/html', css: 'text/css', js: 'text/javascript' }[f.split('.').pop()] || 'application/octet-stream', body: fs.readFileSync(full) }); });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  p.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p.goto('http://localhost:8766/'); await p.waitForTimeout(1000);
  const vivo = await Promise.race([p.evaluate(() => 'ok'), new Promise(r => setTimeout(() => r('COLGADA'), 5000))]);
  console.log('app:', vivo);
  if (vivo !== 'ok') { await b.close(); process.exit(1); }
  for (const t of ['peso', 'entreno', 'dieta', 'ajustes']) { await p.click(`[data-tab="${t}"]`); await p.waitForTimeout(300); }
  console.log('ancho:', await p.evaluate(() => document.documentElement.scrollWidth), '(debe ser 412) · errores:', errs);
  await b.close();
})();
```
- Para datos de entreno de prueba, genera un CSV sintético con las columnas de Hevy (`title, start_time, end_time,
  description, exercise_title, superset_id, exercise_notes, set_index, set_type, weight_kg, reps, distance_km,
  duration_seconds, rpe`) e impórtalo con `p.setInputFiles('#file-input', 'hevy.csv')` y `p.click('[data-h="go"]')`.
  Nunca uses los datos reales del usuario.
- Los Ajustes van en grupos plegables (`details`); en las pruebas, ábrelos antes de pulsar dentro.
- Si la página se cuelga, pausa con el depurador (CDP `Debugger.pause`) para ver la línea exacta.
- Para la parte nativa (notificación, widget, recordatorio) hay que simular `window.Capacitor` o que el usuario lo
  pruebe en su móvil.

## 6. Trampas conocidas
- Los plugins nativos se detectan con `Capacitor.PluginHeaders`, no con `isPluginAvailable`.
- `npm run build:foods` necesita `npm install` (paquete de datos USDA). Sin él no se puede regenerar.
- La herramienta de seguridad del entorno puede bloquear comandos que modifican el repo cuando el usuario solo pidió
  revisar; en ese caso no insistas: es lo correcto.
- `app.js` (~1550 líneas), `gym.js` (~1280) y `diet.js` (~890) superan las 800: no se les añade código (deuda técnica
  pendiente en `docs/TAREAS.md`).
- Los scripts antiguos de prueba vivían en el scratchpad de otra sesión: no existen en un chat nuevo. Usa el del punto 5.

## 7. Última situación (2026-11-28)
- `main` en **v2.7.0**: de la entrega `handoff/mejoras-opiniones` solo se publicaron C1 (32 platos), C2 (307 alimentos)
  y C3 (guía de 92 ejercicios).
- Pendiente de Codex: **C4–C10** (ver `docs/TAREAS.md`), con dos errores críticos que corregir (C4 y C5).
- Pendiente de Claude: fotos de progreso + calendario (nativo), deuda técnica. Pendiente del usuario: decidir lo de
  Strava y probar en el móvil lo marcado con `[?]`.
