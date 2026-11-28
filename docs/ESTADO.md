# Estado del proyecto

Versión actual: **2.7.0** (`sw.js`, `app.js` y `package.json`). APK instalado en el móvil: 2.5.2 o posterior (trae todo lo nativo). Tests: `npm test` → 55/55 en verde.

**Chat nuevo:** lee primero `docs/TRASPASO.md` (cómo se trabaja: revisar a Codex, publicar lo bueno, devolverle lo malo).

## Hecho
- 1.0 Registro de peso (PWA instalable, sin conexión, datos en IndexedDB).
- 2.0 Entrenamientos: rutinas, series, descansos, récords, importación CSV de Hevy y gráfico libre.
- 2.1 App Android con Capacitor; copia automática `tracking-auto.json` en la carpeta privada.
- APK compilado y firmado en GitHub Actions (`.github/workflows/android.yml`), publicado en Releases.
- 2.2 Pestaña Dieta con base de alimentos local (USDA SR28: lista en español + base completa).
- 2.3 Seguimiento de la dieta.
- 2.4 Entreno: descanso con temporizador o cronómetro (Ajustes), salto a la siguiente serie al marcar (Intro del teclado marca), superseries (también al importar de Hevy), sugerencia de progresión, gráfico de ejercicio como el de peso (pantalla completa), calendario con racha y series por grupo muscular. Peso: medidas corporales. Dieta: macros por kg de peso. Lógica pura en `gymcalc.js` con tests; interfaz nueva en `gym-plus.js` y `body.js`.
- Equipo de agentes de Claude Code instalado en `.claude/` (7 agentes, 8 comandos con `/manager`, 2 hooks).

## Pendiente / siguientes pasos
- 2.5.1 Arreglo: la fecha de nacimiento ya no reabre el calendario en bucle en iPhone.
- 2.5.2 Gráfico de peso: botones de periodo configurables (✎ junto a los botones; por defecto Semana/Mes/3M/Todo y en pantalla completa 1M/3M/6M/Todo + Auto). Botón «atrás» de Android cierra lo abierto (necesita el APK nuevo, plugin `@capacitor/app`).
- 2.5.3 Arreglo: la app detectaba mal sus plugins nativos (usaba `isPluginAvailable`, que solo funciona con `@capacitor/core`); ahora usa `Capacitor.PluginHeaders`. Recordatorio también en Ajustes → Peso.
- 2.5.4–2.5.5 Botones del gráfico: recuadro deslizable con «Todo» y ✎ dentro; de 0 a 10 botones por gráfico. Botón ⓘ en «Dieta cumplida» que explica el gasto real.
- Probado por el usuario: botón atrás de Android funciona. Pendiente de confirmar en móvil real: notificación de entreno, widget, recordatorio; calendario de fecha de nacimiento en iPhone.

- 2.6.0 (en `main`) Primera entrega de Codex revisada e integrada con correcciones (PR #1): celebración al acercarte al objetivo, comida trampa, 7 platos preparados, guía de ejercicios con silueta, exportar pesos a Excel. Detalle en `docs/TAREAS.md`.

- 2.7.0 (en `main`) De la segunda entrega de Codex (`handoff/mejoras-opiniones`) solo se publicó lo que estaba bien: 32 platos preparados, 307 alimentos y guía propia de 92 ejercicios. El resto (con dos fallos críticos) volvió a Codex como tareas C4–C10.

La lista completa de tareas pendientes está en `docs/TAREAS.md`.

## Decisiones
- Claude dirige el proyecto; Codex hace tareas asignadas y entrega con una Pull Request (ver `AGENTS.md`). Nada de Codex entra sin revisión.
- Todo entra en `main` por Pull Request con Comprobaciones automáticas (tests, normas y prueba de la app en el navegador); `main` protegido.
- Sin servidor: los datos nunca salen del móvil (privacidad y funcionamiento sin conexión).
- El APK carga la web desde GitHub Pages: los cambios web llegan sin reinstalar.
- Alimentos del USDA (dominio público) generados con `npm run build:foods`.

## Bugs conocidos
- Ninguno registrado.
