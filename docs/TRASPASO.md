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
Todo entra en `main` por **Pull Request** (`main` está protegido). Detalle en `CLAUDE.md` → «GitHub» y «Claude: cómo revisa».
1. **Buscar entregas nuevas de Codex**: PR abiertas desde ramas `handoff/*` (herramientas de GitHub:
   `list_pull_requests` en `igor-0102/tracking`) y ramas `handoff/*` sin PR:
   ```bash
   cd tracking && git fetch origin && git ls-remote --heads origin 'handoff/*'
   ```
   Las ya revisadas están en `docs/TAREAS.md` → «Entregas de Codex». Si hay una rama sin PR, ábrela tú con la plantilla.
2. **Auditar sin tocar nada** (el usuario suele pedir primero solo el informe):
   - Mirar las **Comprobaciones** de la PR en GitHub (sintaxis, `npm test`, normas, prueba de la app). Rojo = no se integra así.
   - Leer el diff entero: `git diff origin/main...origin/handoff/<rama>`. No fiarse solo de la descripción.
   - Repetir en local si hace falta: copia de la rama con `git worktree add --detach <scratchpad>/rev origin/handoff/<rama>`;
     dentro de ella `npm test` y `node /home/user/tracking/tools/check-pr.mjs origin/main handoff/<rama>`; y desde el
     repo `npm run smoke -- <scratchpad>/rev`.
   - Probar a mano lo nuevo de la interfaz (punto 5).
   - Informe al usuario con 6 apartados: bien hecho · errores y gravedad · arquitectura · pruebas · qué corregir ·
     qué es seguro. Luego **esperar su OK**.
3. **Publicar** (cuando el usuario lo pide; su pedido ya es el OK):
   - Todo bien → integrar la PR de Codex.
   - Solo una parte vale o hay que corregir → rama `codex/<tarea>`, traer los archivos buenos
     (`git checkout origin/handoff/<rama> -- <archivos>`), corregir, PR nueva y cerrar la de Codex enlazándola.
   - Si cambia `tools/foods-es.txt`: `npm install && npm run build:foods` y comprobar que `foods-db.js` sale igual.
   - En la misma PR: subir versión (`VERSION` de `sw.js` como `tracking-X.Y.Z`, `APP_VERSION` de `app.js` y `version`
     de `package.json`), actualizar `docs/ESTADO.md` y `docs/TAREAS.md`.
   - Esperar las Comprobaciones en verde → integrar la PR → borrar la rama.
4. **Devolver lo malo a Codex**: en `docs/TAREAS.md` → «Tareas para Codex», una tarea por bloque, con los archivos y
   cada error a corregir y su gravedad. Anotar la entrega revisada en «Entregas de Codex».
5. Decirle al usuario qué se publicó, qué volvió a Codex y si necesita APK nuevo.
Los cambios propios de Claude siguen el mismo camino: rama `claude/<tema>` → PR → Comprobaciones → integrar.

## 4. Permisos y confirmaciones
- Si el usuario pide un cambio concreto o «publica» → hazlo, commit y push **sin pedir confirmación**.
- Lo que propongas tú (limpiezas, mejoras no pedidas) → explícalo y espera su OK.
- Si pide solo una auditoría → no modifiques, no integres y no borres nada.
- Nunca: secretos en el repo o el chat, ni datos personales del usuario (sus pesos) en el código.

## 5. Probar la app en el navegador (Playwright ya instalado en la nube)
- `npm run smoke` (o `npm run smoke -- <carpeta>` para otra copia): abre la app en un móvil simulado, comprueba que no
  se cuelga, importa un CSV de Hevy inventado, recorre las pestañas y Ajustes, abre un entreno, empieza una rutina y
  marca una serie, y avisa si algo se sale del ancho de la pantalla o hay errores en consola. Es lo mismo que hace GitHub
  en cada PR (`tools/smoke.cjs`).
- `npm run check` comprueba las normas de `CLAUDE.md` sobre los cambios de la rama (`tools/check-pr.mjs`).
- Para probar algo concreto, copia el patrón de `tools/smoke.cjs` en un script del scratchpad. Nunca uses los datos
  reales del usuario.
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
- Las ramas viejas `handoff/c1…c7`, `handoff/claude-ready`, `handoff/codex-primera-entrega` y `handoff/mejoras-opiniones`
  ya están revisadas (formato antiguo con `CODEX_HANDOFF/`).
- Codex usa la misma cuenta de GitHub: la protección de `main` no pide aprobación de otra persona, solo PR y
  Comprobaciones en verde.

## 7. Última situación (2026-11-28)
- `main` en **v2.7.0**: de la entrega `handoff/mejoras-opiniones` solo se publicaron C1 (32 platos), C2 (307 alimentos)
  y C3 (guía de 92 ejercicios).
- Pendiente de Codex: **C4–C10** (ver `docs/TAREAS.md`), con dos errores críticos que corregir (C4 y C5).
- Pendiente de Claude: fotos de progreso + calendario (nativo), deuda técnica. Pendiente del usuario: decidir lo de
  Strava y probar en el móvil lo marcado con `[?]`.
