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
Leer antes `CLAUDE.md` → «Codex (becario): cómo trabaja». Una tarea por entrega.

- [ ] **C1 · Más platos preparados.** Ampliar `prepared-foods.js` de 7 a unos 25 platos típicos españoles
  (macarrones con tomate, paella, cocido, salmorejo, pisto, revuelto de setas, pechuga a la plancha con ensalada,
  yogur con avena y fruta, tostada con tomate y aceite…). Cada ingrediente con el **nombre exacto** de la lista
  básica (`tools/foods-es.txt`) y cantidades realistas por ración. Añadir un test que compruebe que todos los
  ingredientes existen en `foods-db.js`.
- [ ] **C2 · Ampliar la lista básica de alimentos.** Añadir a `tools/foods-es.txt` unos 60 alimentos habituales en
  España que falten (embutidos, quesos, pan, bollería, conservas, legumbres en bote, salsas…), con su búsqueda en el
  USDA y porciones típicas. Si no puede ejecutar `npm run build:foods`, entregar solo `tools/foods-es.txt` y avisarlo:
  Claude regenera `foods-db.js`.
- [ ] **C3 · Guía ejercicio por ejercicio.** En `exercise-guide.js`, añadir instrucciones propias (2–3 frases:
  colocación, movimiento, error típico) y músculos secundarios para los ~40 ejercicios del usuario (los de su
  historial de Hevy: press de banca, remo sentado con cable, jalón al pecho, sentadilla, peso muerto, curl de pierna,
  extensión de pierna, aducción de cadera, elevaciones laterales, press de hombros, curls de bíceps, tríceps en
  polea…). Mantener el resto de patrones como respaldo. Con tests.

## Tareas para Claude
- [ ] Fotos de progreso con carpeta elegida por el usuario + calendario de fotos (nativo, APK nuevo).
- [ ] Revisar e integrar las entregas de Codex (C1–C3).
- [ ] Deuda técnica: reducir `app.js` (≈1550 líneas) y `diet.js` (≈890) por debajo de 800, moviendo partes a archivos nuevos.
- [ ] Deuda técnica: partir funciones de más de 50 líneas (dibujo del gráfico, importación de Hevy, editor de opciones…).
- [ ] Deuda técnica: tests de interfaz (pantallas de peso, entreno y dieta) con el navegador de pruebas.

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
