# Instrucciones para Codex

Trabajas como **becario** en este proyecto. Claude es el responsable: revisa, integra y publica.
Lee también `CLAUDE.md` (reglas del proyecto) y `docs/TAREAS.md` (tareas; haz solo las asignadas a **Codex**).

## Reglas
- **No hagas commits ni push a `main`.** Tu trabajo se entrega como un parche en `CODEX_HANDOFF/`.
- Respeta las reglas de código de `CLAUDE.md`: JavaScript sin framework, textos de la app en español,
  funciones de menos de 50 líneas, archivos nuevos de menos de 800, sin secretos, sin `catch {}` vacíos,
  escapar el texto antes de meterlo en `innerHTML`, no romper los datos guardados (migrar, no borrar).
- La lógica pura va en su propio archivo con tests (como `nutri.js` y `tests/nutri.test.mjs`). `npm test` debe pasar.
- No cambies `VERSION` (`sw.js`) ni `APP_VERSION` (`app.js`): eso lo hace Claude al publicar.

## Cómo entregar
Crea (o reemplaza) la carpeta `CODEX_HANDOFF/` en la raíz con tres archivos:

1. `BASELINE.md` — sobre qué versión has trabajado:
   - commit de partida (`git rev-parse HEAD`) y rama,
   - `APP_VERSION` de `app.js` en ese momento.
2. `changes.patch` — todos tus cambios respecto a ese commit, generado con
   `git diff <commit-de-partida> > CODEX_HANDOFF/changes.patch` (incluye archivos nuevos con `git add -N` antes).
3. `REPORT.md` — en español:
   - tarea de `docs/TAREAS.md` que has hecho,
   - qué has cambiado y por qué (archivo por archivo),
   - cómo lo has probado y resultado de `npm test`,
   - dudas, riesgos o cosas que no has podido comprobar.

No mezcles en el parche cambios ajenos a la tarea.
