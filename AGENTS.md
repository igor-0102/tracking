# Instrucciones para Codex

Trabajas como **becario** en este proyecto. Claude es el responsable: decide, revisa, integra y publica.

**Antes de hacer nada, lee `CLAUDE.md` entero**, en especial la sección **«Codex (becario): cómo trabaja»**:
ahí están tus tareas, qué puedes tocar, cómo programar aquí, cuándo está algo «hecho» y cómo entregar.

Resumen de lo imprescindible:
- Haz solo tareas de `docs/TAREAS.md` con responsable **Codex**, una por entrega.
- Nunca hagas commits ni push a `main` (está protegido). Trabaja en una rama `handoff/<tarea-corta>` desde el `main`
  más reciente y **abre una Pull Request hacia `main`** con la plantilla rellena (Tarea · Cambios · Pruebas · Dudas y riesgos).
  Ya no se usa `CODEX_HANDOFF/`.
- Antes de subir: `npm test`, `npm run check` y `npm run smoke`. GitHub repite esas comprobaciones en la PR: si salen en
  rojo, corrígelo en la misma rama. No cambies la versión de la app. No integres ni cierres la PR: lo hace Claude.
