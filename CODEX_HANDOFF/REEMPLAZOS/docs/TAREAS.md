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
- [?] Revisar visualmente la nueva navegación de Entreno, el buscador incremental, los mapas musculares y el selector GET en un móvil real.
- [x] Botón «atrás» de Android cierra lo abierto.

## Tareas para Codex
Leer antes `CLAUDE.md` → «Codex (becario): cómo trabaja». Una tarea por entrega.

- [~] **C1 · Más platos preparados.** Implementado: `prepared-foods.js` contiene 32 platos; el test valida todos los ingredientes por nombre exacto en `foods-db.js`. Pendiente de revisión de Claude.
- [~] **C2 · Ampliar la lista básica de alimentos.** Implementado: `tools/foods-es.txt` contiene 307 alimentos; se verificaron las selecciones USDA y se regeneró `foods-db.js` desde el snapshot local. Pendiente de revisión de Claude.
- [~] **C3 · Guía ejercicio por ejercicio.** Implementado: `exercise-guide.js` cubre los 92 ejercicios del catálogo con instrucciones y músculos secundarios; test de cobertura completa. Pendiente de revisión de Claude.

La rama `handoff/mejoras-opiniones` contiene además mejoras de la interfaz solicitadas por el usuario; la entrega ya está
preparada en `CODEX_HANDOFF/` (informe, parche, reemplazos completos y prototipos). Sigue pendiente publicarla en GitHub
y que Claude la revise. Las tareas C1–C3 no se consideran integradas hasta que Claude revise y aplique la entrega.

## Tareas para Claude
- [ ] Fotos de progreso con carpeta elegida por el usuario + calendario de fotos (nativo, APK nuevo).
- [ ] Revisar e integrar las entregas de Codex (C1–C3).
- [ ] Deuda técnica: reducir `app.js` (≈1550 líneas) y `diet.js` (≈890) por debajo de 800, moviendo partes a archivos nuevos.
- [ ] Deuda técnica: partir funciones de más de 50 líneas (dibujo del gráfico, importación de Hevy, editor de opciones…).
- [ ] Deuda técnica: tests de interfaz (pantallas de peso, entreno y dieta) con el navegador de pruebas.
- [ ] Completar una prueba visual en navegador/Android de la nueva pantalla «Último entreno», selección incremental de ejercicios, mapas frontal/espalda, controles GET kcal/% y ayudas TMB/proteína/grasa; el ensayo automatizado local no llegó a completar la navegación de Entreno.
- [ ] Evaluar la antigüedad de USDA SR28 y decidir si conviene actualizar el snapshot local con una fuente más reciente, preservando funcionamiento offline, IDs estables y trazabilidad de nutrientes.
- [ ] Revisar el texto nutricional de pérdida semanal y rangos de macronutrientes con una fuente clínica actual antes de publicar; son orientaciones generales, no recomendaciones individualizadas.

## Esperando decisión del usuario
- [ ] Strava y mapa de carreras: necesita un servidor pequeño para la clave secreta de Strava. Decidir dónde alojarlo.

## Hecho en v2.6.0 (entrega de Codex revisada)
- [x] Celebración al marcar un nuevo peso más cercano al objetivo.
- [x] Comida trampa con calorías extra preseleccionadas y editables.
- [x] 7 platos preparados con ingredientes editables (se amplía en C1).
- [x] Guía de ejercicios con silueta del músculo y explicación (se mejora en C3).
- [x] Exportar los pesos a Excel con gráfico.

## Entregas de Codex
Última entrega revisada: **2026-11-26** · `sha256 e72d803e955798a3018e4eda3e638d66dc6b787283bdd71df9dabc466a8bb9df` · rama `handoff/codex-primera-entrega`.

### 2026-11-26 · primera entrega (tareas 1–5)
- Base correcta (`ef9cefb`, 2.5.5). `git apply --check` sin conflictos. 46/46 tests al aplicarla.
- Integrada con correcciones de Claude en la rama `codex/primera-entrega` (PR #1, integrada en `main` el 2026-11-26):
  1. Código nuevo sacado de `app.js` y `diet.js` (ya pasan de 800 líneas) a `weight-extras.js`, `body.js` y `prepared-foods.js`.
  2. Platos preparados: ingredientes por nombre exacto de la lista básica (antes un alimento propio parecido podía sustituirlos).
  3. Guía de ejercicios: vista de espaldas para espalda, tríceps y glúteos (antes se iluminaba el pecho); grupos musculares raros de copias importadas ya no rompen la guía. +2 tests.
  4. Excel verificado: ZIP y XML válidos y leídos con openpyxl; falta abrirlo en Excel real.
- Nota para Codex: entregar en `main` (carpeta `CODEX_HANDOFF/`) o avisar de la rama; no pudo ejecutar `npm test`.
Al revisar una, anotar aquí: fecha · huella `sha256` de `changes.patch` · resultado (integrada en PR #… / rechazada y por qué).
