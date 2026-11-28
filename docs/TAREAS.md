# Lista de tareas

Lista viva de lo pendiente. La mantiene Claude (jefe del proyecto); Codex (becario) solo hace las tareas
de la sección «Tareas para Codex» y entrega como explica `CLAUDE.md` → «Codex (becario): cómo trabaja».

Estados: `[ ]` pendiente · `[~]` en curso · `[x]` hecha · `[?]` hecha, falta probar en móvil real.
Responsable: **Claude** · **Codex** · **Usuario** (pruebas o decisiones).

## Por probar (Usuario)
- [?] Notificación del entreno con botón «Hecha» (Android, APK 2.5.2).
- [?] Widget de peso con «+ Peso».
- [?] Recordatorio diario para pesarse (Ajustes → Peso).
- [?] Fecha de nacimiento sin bucle del calendario (iPhone, web).
- [?] v2.6.0: celebración al acercarte al objetivo, comida trampa, platos preparados, guía de ejercicios.
- [?] v2.6.0: abrir el Excel de pesos en Excel / Google Sheets y comprobar que sale el gráfico.
- [x] Botón «atrás» de Android cierra lo abierto.

## Tareas para Codex
Leer antes `CLAUDE.md` → «Codex (becario): cómo trabaja». **Una tarea por entrega**: rama `handoff/<tarea>` desde el
`main` más reciente y **Pull Request hacia `main`** con la plantilla rellena (ya no se usa `CODEX_HANDOFF/`).
Antes de subir: `npm test`, `npm run check` y `npm run smoke`; GitHub lo repite en la PR y debe salir en verde.

Las tareas C4–C10 salen de la entrega `handoff/mejoras-opiniones`: el código ya existe en esa rama, pero no se pudo
publicar por errores. Para cada una: copia de esa rama **solo** los archivos de la tarea, corrige lo indicado y entrégala
sola. No toques `docs/`, `tools/build-foods.mjs` ni hagas crecer `gym.js`, `app.js` o `diet.js`.

**Obligatorio en todas:** `npm run smoke` en verde (abre la app, importa entrenos de ejemplo y recorre las pestañas).
Los dos fallos críticos de la última entrega (app colgada y pantalla rota) pasaban todos los tests: los tests no bastan.

**Normas de diseño nuevas:**
- No sustituyas funciones globales en cadena (`renderGymSettings = …` en tres archivos distintos). Si necesitas un
  enganche, deja en el archivo grande una única línea que llame a tu módulo (`if (window.X) X.algo()`).
- Un `MutationObserver` no puede modificar el mismo árbol que vigila sin desconectarse antes (provoca bucle infinito).
- Nada puede ser más ancho que la pantalla del móvil (412 px): revisa los botones `btn-block` con márgenes.

- [ ] **C4 · Pantalla «Último entreno» y comparación con el anterior.** Archivos: `gym-training-dashboard.js`,
  `gym-summary-comparison.js`, `gym-dashboard-analysis.js` (+ tests y CSS). 🔴 Corregir: `gym-summary-comparison.js`
  no exporta `comparisonCard` y `gym-training-dashboard.js` la llama → con dos entrenos comparables se rompe el pintado
  de toda la app (la importación de Hevy se queda en «Importando…»).
- [ ] **C5 · Ajuste de dieta en % o en kcal + ayudas (GET, proteína, grasa).** Archivos: `diet-adjustment.js`,
  `diet-adjustment-ui.js`, `diet-get-info.js`, `ui-info-hints.js` (+ tests). 🔴 Corregir: el `MutationObserver` de
  `diet-adjustment-ui.js` modifica lo que vigila → **la app se cuelga al abrirla**. Revisar igual `diet-get-info.js` y
  `ui-info-hints.js`.
- [ ] **C6 · Unidades kg/lb y km/mi + series de cardio (distancia y minutos).** Archivos: `gym-units.js` y los cambios
  de `gym.js` / `gym-plus.js`. Funciona, pero corregir: `gym.js` creció 8 líneas (no puede crecer); en libras las
  sugerencias salen sin redondear («77,16 lb»: redondear a 0,5 lb o a la carga más cercana); un peso con 3 decimales se
  borra sin avisar; el «1RM» del detalle sale sin unidad y sin convertir; el campo de repeticiones admite decimales que
  luego descarta; quitar el `? x : x` repetido en `exCardHTML`.
- [ ] **C7 · Pausar y reiniciar el descanso.** Archivos: `gym-rest-state.js`, cambios del descanso en `gym-plus.js`,
  botones en `index.html`. Funciona; corregir que la notificación del móvil no muestra el descanso en pausa
  (`native.js` mira solo `restEnd`).
- [ ] **C8 · Copia de seguridad con el entreno en curso.** Archivo: `gym-active-backup.js` y el cambio de `app.js`.
  Probado y funciona; entregarlo solo, sobre `main`.
- [ ] **C9 · Buscador de ejercicios con catálogo, filtros, «Editar mi guía» y favoritos.** Archivos:
  `gym-exercise-picker.js`, `gym-exercise-enhancements.js`. `exercise-catalog.js` ya está en `main` (solo lo usan los
  tests): cárgalo en `index.html`, `sw.js` y `tools/build-www.mjs`. Los botones «Editar mi guía» y «Favorito» se
  quitaron de `exercise-guide.js` al publicar C3; vuelve a añadirlos junto con el código que los hace funcionar.
- [ ] **C10 · Extras del entreno.** Compartir resumen (`gym-portability.js`), historial por tandas
  (`gym-exercise-history.js`), filtros del historial (`gym-history-tools.js`), motivación (`gym-motivation.js`), notas
  visibles (`gym-note-visibility.js`), pantalla del entreno personalizable (`gym-workout-layout.js`) y Ajustes en grupos
  plegables. Corregir: el botón «Compartir resumen» mide 423 px y hace que el detalle del entreno se salga de la
  pantalla. Si es mucho para una entrega, divídela (C10a, C10b…).

## Tareas para Claude
- [ ] Fotos de progreso con carpeta elegida por el usuario + calendario de fotos (nativo, APK nuevo).
- [ ] Revisar e integrar las entregas de Codex (C4–C10).
- [ ] Deuda técnica: reducir `app.js` (≈1550 líneas) y `diet.js` (≈890) por debajo de 800, moviendo partes a archivos nuevos.
- [ ] Deuda técnica: partir funciones de más de 50 líneas (dibujo del gráfico, importación de Hevy, editor de opciones…).
- [ ] Deuda técnica: tests de interfaz (pantallas de peso, entreno y dieta) con el navegador de pruebas.

## Esperando decisión del usuario
- [ ] Strava y mapa de carreras: necesita un servidor pequeño para la clave secreta de Strava. Decidir dónde alojarlo.

## Hecho en v2.7.0 (de la entrega `handoff/mejoras-opiniones`)
- [x] C1 · 32 platos preparados (antes 7), con test de que todos los ingredientes existen.
- [x] C2 · Lista básica de alimentos: 307 (antes 239). Los 239 anteriores no cambian.
- [x] C3 · Guía propia para 92 ejercicios con músculos secundarios y mapa frontal y de espaldas.

## Hecho en v2.6.0 (entrega de Codex revisada)
- [x] Celebración al marcar un nuevo peso más cercano al objetivo.
- [x] Comida trampa con calorías extra preseleccionadas y editables.
- [x] 7 platos preparados con ingredientes editables (se amplía en C1).
- [x] Guía de ejercicios con silueta del músculo y explicación (se mejora en C3).
- [x] Exportar los pesos a Excel con gráfico.

## Entregas de Codex
Última entrega revisada: **2026-11-28** · `sha256 c67026b4748ca1428670b1e456feb12db51542e76708c6cc9ad3e47298f76252` · rama `handoff/mejoras-opiniones`.

### 2026-11-28 · `handoff/mejoras-opiniones` (C1–C3 + ~10 mejoras no pedidas)
- Problemas de entrega: muchas tareas juntas; `BASELINE.md` apuntaba a un commit propio (`e152561`) y no a `main`, así que
  `changes.patch` no tenía todos los cambios; tocó `docs/TAREAS.md` y `tools/build-foods.mjs`; `gym.js` creció; el informe
  dice que no hizo push y la rama estaba subida. `npm test` 100/100, pero la interfaz no se probó.
- 🔴 La app se colgaba al abrir (bucle de `MutationObserver` en `diet-adjustment-ui.js`) y 🔴 se rompía el pintado con dos
  entrenos comparables (`comparisonCard` sin exportar). 🟠 «Compartir resumen» más ancho que la pantalla.
- **Publicado en v2.7.0** (rama `codex/mejoras-opiniones`): solo C1, C2 y C3. Correcciones de Claude: quitados los botones
  «Editar mi guía» / «Favorito» de la guía (su código va en C9); CSS de la guía traído de la rama, con la leyenda del mismo
  color que el mapa y las etiquetas «vista frontal / de espaldas» debajo de cada figura; `foods-db.js` regenerado por
  Claude (idéntico al de Codex). 55/55 tests y prueba en navegador (guía, platos, Excel, celebración) sin errores.
- **Devuelto a Codex** como tareas C4–C10.

### 2026-11-26 · primera entrega (tareas 1–5)
- Base correcta (`ef9cefb`, 2.5.5). `git apply --check` sin conflictos. 46/46 tests al aplicarla.
- Integrada con correcciones de Claude en la rama `codex/primera-entrega` (PR #1, integrada en `main` el 2026-11-26):
  1. Código nuevo sacado de `app.js` y `diet.js` (ya pasan de 800 líneas) a `weight-extras.js`, `body.js` y `prepared-foods.js`.
  2. Platos preparados: ingredientes por nombre exacto de la lista básica (antes un alimento propio parecido podía sustituirlos).
  3. Guía de ejercicios: vista de espaldas para espalda, tríceps y glúteos (antes se iluminaba el pecho); grupos musculares raros de copias importadas ya no rompen la guía. +2 tests.
  4. Excel verificado: ZIP y XML válidos y leídos con openpyxl; falta abrirlo en Excel real.
- Nota para Codex: entregar en `main` (carpeta `CODEX_HANDOFF/`) o avisar de la rama; no pudo ejecutar `npm test`.
Al revisar una, anotar aquí: fecha · PR (o rama y commit) · resultado (integrada en PR #… / rechazada y por qué).
