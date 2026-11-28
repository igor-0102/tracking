# Informe de entrega para Claude

## Tarea

Completar C1, C2 y C3 de `docs/TAREAS.md`, las correcciones de interfaz solicitadas por la usuaria y preparar prototipos de apoyo para tareas asignadas a Claude. La rama de trabajo es `handoff/mejoras-opiniones`; el punto de partida queda registrado en `BASELINE.md`.

## Cambios

- `prepared-foods.js` ya contiene 32 platos preparados con ingredientes identificados por nombre exacto de la lista local. `tests/prepared-foods.test.mjs` comprueba que todos existen en `foods-db.js`.
- `tools/foods-es.txt` contiene 307 alimentos. `tests/foods-list.test.mjs` simula la selección sobre el snapshot USDA y comprueba coincidencias y códigos únicos.
- `tools/build-foods.mjs` ahora puede reconstruir la lista española sin `node_modules`, reutilizando el snapshot local `foods-usda.js`. Se regeneró `foods-db.js` con 307 filas; el archivo de la base USDA completa no cambió.
- `exercise-guide.js` dibuja mapas vectoriales originales de frente y espalda, diferencia músculos primarios/secundarios y cubre los 92 ejercicios del catálogo. `tests/exercise-guide.test.mjs` ahora valida cobertura completa.
- `exercise-catalog.js` ofrece un catálogo de 92 ejercicios y búsqueda local sin red; `gym-exercise-picker.js` integra búsqueda incremental en rutinas y sesiones sin tocar `gym.js`.
- `gym-dashboard-analysis.js` añade cálculos puros de volumen, series, marcas y estimación 1RM; `gym-training-dashboard.js` integra el último entreno y análisis por ejercicio.
- `diet-adjustment.js` contiene conversiones puras entre porcentaje y kcal/día, cálculo orientativo de grasa y ejemplo teórico de déficit. `diet-adjustment-ui.js` incorpora el selector de modo y equivalencia visible.
- `diet-get-info.js` explica TMB/GET y el ejemplo de 80 kg. El texto aclara que el 1% semanal y la conversión kcal/kg no son un umbral universal ni predicen exactamente el cambio real de peso.
- `ui-info-hints.js` añade ayudas breves para tecnicismos; `index.html` agrupa ajustes y añade la vista «Último entreno»; `styles.css` da estilo a mapas, ayudas, resumen y selector.
- `sw.js` y `tools/build-www.mjs` incluyen los módulos nuevos para que el modo offline y el paquete Android los copien.
- `package.json` incluye los tests añadidos; en esta revisión se corrigió que faltara `gym-exercise-picker.test.mjs` en el comando de pruebas.
- `docs/TAREAS.md` refleja C1–C3 como implementadas pendientes de revisión y añade comprobaciones visuales/móvil y revisión futura de la antigüedad de USDA SR28.
- `CODEX_HANDOFF/prototypes/` contiene un mock interactivo de fotos (solo memoria), un mapa de extracción de `app.js`/`diet.js` y un guion de pruebas UI. El storyboard de tutorial está en `VIDEO-TUTORIAL.md` y las recomendaciones priorizadas están en `RECOMENDACIONES-CLAUDE.md`; el tutorial está preparado para grabación, no se entrega un MP4 grabado.
- `CODEX_HANDOFF/REEMPLAZOS/` contiene copias completas listas para reemplazar los archivos correspondientes, además del parche con cambios incrementales.

No se modificó `APP_VERSION`, no se añadieron dependencias y la ilustración muscular no reutiliza imágenes de MuscleWiki.

## Pruebas

- **Suite lógica:** 100/100 pruebas aprobadas, 24 archivos. El entorno no expone `node`/`npm` en PATH, así que se ejecutó el runner `node:test` a través del Node REPL; no se pudo invocar literalmente `npm test`.
- **Sintaxis:** módulos JavaScript modificados/nuevos analizados con `vm.Script`; los archivos ESM se cargaron al ejecutar las pruebas o el generador.
- **Base nutricional:** el generador produjo 307 filas desde el snapshot local. Las 307 selecciones USDA tuvieron coincidencia y código único; `foods-usda.js` permaneció idéntico.
- **Build web:** `tools/build-www.mjs` generó los 42 elementos; se verificó que los 35 scripts de `index.html` aparezcan en service worker y build, y que los archivos copiados coincidan con los originales.
- **Interfaz:** la app cargó Inicio en una ventana privada. No se pudo confirmar el cambio a Entreno ni completar el flujo de selector porque el control del navegador local fue detenido por la salvaguarda de URL de Windows. El ensayo UI queda pendiente y está anotado en `docs/TAREAS.md` y `prototypes/pruebas-interfaz.md`.
- **Móvil:** no se probaron funciones que requieren un Android/iPhone real (notificaciones, widget, recordatorio, selector nativo de carpeta o calendario iPhone).

## Dudas y riesgos

- La estimación de 1RM es orientativa y no equivale a un levantamiento medido. Volumen solo se estima si las series incluyen carga y repeticiones válidas.
- El ejemplo de 7.000 kcal/kg es una aproximación estática; NIDDK explica que las adaptaciones metabólicas hacen que reglas calóricas lineales sobrepredigan pérdida de peso. El 0,5–1%/semana proviene de recomendaciones para preparación de culturismo natural, no de un límite clínico universal ni de una garantía hormonal.
- La guía de proteína ISSN es para personas que hacen ejercicio; OMS indica 15–30% de energía total de adultos procedente de grasa. Estas ayudas no sustituyen consejo individual.
- `foods-usda.js` contiene USDA SR28; se añadió a tareas evaluar su actualización manteniendo funcionamiento local, IDs y trazabilidad.
- La tarea de fotos requiere selección/almacenamiento nativo en Android y revisión iOS; el prototipo HTML solo demuestra jerarquía visual y previsualiza una imagen temporal.
- No se ha hecho commit ni push de esta versión local. Claude no verá estos cambios en GitHub hasta publicar la rama y actualizar el handoff.

### Fuentes nutricionales revisadas

- OMS, rango de grasa total en adultos: https://www.who.int/en/news-room/fact-sheets/detail/healthy-diet
- ISSN, proteína para personas que entrenan: https://link.springer.com/article/10.1186/s12970-017-0177-8
- NIDDK, por qué la regla estática de 3.500 kcal/lb sobrepredice el cambio de peso: https://www.niddk.nih.gov/health-information/professionals/diabetes-discoveries-practice/nih-body-weight-planner
- Helms et al., ritmo 0,5–1%/semana en preparación de culturismo natural: https://pubmed.ncbi.nlm.nih.gov/24864135/
