# Informe detallado para Claude — paquete `claude-ready`

## Cómo usar este paquete

La rama `handoff/claude-ready` contiene el conjunto integrado de cambios y los **archivos completos**, ya puestos en sus rutas normales del proyecto. Claude puede sustituir cada archivo en `main` por el archivo del mismo nombre y ruta de esta rama, o usar esta rama como base para integrar el trabajo. En particular, `index.html` y `package.json` ya reúnen las aportaciones de varias tareas.

`CODEX_HANDOFF/changes.patch` es una referencia del diff desde el baseline. Si se copian archivos completos, no se debe volver a aplicar el parche encima. Los informes y ramas C1–C7 originales siguen disponibles para revisar cada tarea por separado.

### Archivos completos listos para sustituir

| Ruta dentro del proyecto | Contenido |
| --- | --- |
| `index.html` | Carga conjunta de los módulos de exportación Excel y ayuda GET. |
| `package.json` | Script de pruebas con todas las pruebas nuevas incluidas. |
| `prepared-foods.js` | Catálogo de 25 platos. |
| `tools/foods-es.txt` | Fuente de alimentos ampliada con 60 entradas. |
| `exercise-guide.js` | Catálogo de ejercicios, explicación y mapas musculares. |
| `styles.css` | Estilos integrados para las dos vistas musculares. |
| `weight-export.js` | Manejador de exportación `.xlsx`. |
| `get-adjustment-help.js` | Botón y explicación del ajuste GET dentro de Ajustes. |
| `tests/prepared-foods.test.mjs` | Pruebas del catálogo de platos. |
| `tests/exercise-guide.test.mjs` | Pruebas del catálogo y sus alias. |
| `tests/weight-xlsx.test.mjs` | Pruebas del libro, el botón y compartir en Android. |
| `tests/get-adjustment-help.test.mjs` | Pruebas de inserción y diálogo GET. |
| `VIDEO_TUTORIAL.md` | Guion y storyboard para grabar. |
| `RECOMMENDATIONS_FOR_CLAUDE.md` | Recomendaciones y plan de trabajo, sin cambios de interfaz. |

Cada ruta de la tabla tiene en esta rama su archivo completo, no un fragmento para copiar. En particular, usar el `index.html` y `package.json` de esta rama evita perder una de las integraciones.

**Excepción deliberada:** no se sustituyen `foods-db.js` ni `foods-usda.js`. Son archivos generados y las instrucciones del proyecto prohíben editarlos directamente. C2 entrega la fuente `tools/foods-es.txt`; tras sustituirla, ejecutar `npm run build:foods` y revisar los archivos generados.

## Instrucciones del proyecto consideradas

- Respetar `CLAUDE.md` y `AGENTS.md`: no añadir dependencias, llamadas de red ni cambios a `android/`, `docs/`, archivos generados o versiones de servicio.
- Mantener los cambios fuera de `main` hasta que Claude los revise e integre.
- El script `npm test` ya incluye las pruebas añadidas; también debe ejecutarse `node --check` en un entorno con Node.
- No se abrió PR. El proyecto define entrega mediante ramas `handoff/...` con baseline, diff e informe.

## Cambios incluidos

### C1 — platos preparados

- `prepared-foods.js`: catálogo local ampliado a 25 platos con cantidades de ingredientes ajustables.
- `tests/prepared-foods.test.mjs`: comprueba el número de platos, nombres únicos, pertenencia exacta de ingredientes al catálogo disponible y cantidades válidas.
- `package.json`: integra esta prueba en `npm test`.

### C2 — alimentos básicos

- `tools/foods-es.txt`: añade 60 alimentos de uso común organizados en carnes/embutidos, quesos, panes/bollería, conservas/legumbres y salsas. Usa IDs fijos presentes en la base local USDA SR28.
- Comprobación manual previa: los IDs nuevos existen en la fuente USDA local, son únicos y no colisionan con el catálogo básico actual.
- Los ficheros generados quedan pendientes de `npm run build:foods`, que no se pudo ejecutar en este entorno.

### C3 — guía local de ejercicios

- `exercise-guide.js`: base offline con 46 ejercicios y 198 alias en español e inglés; instrucciones de colocación, movimiento y error común; músculos principales/secundarios; fallback para nombres desconocidos y escape de nombres importados.
- `styles.css`: vistas SVG frontal y posterior, con colores diferenciados para músculo principal y secundarios, adaptadas a móvil.
- `tests/exercise-guide.test.mjs`: verifica cobertura, completitud, los alias, los mapas, los fallbacks y el escape HTML.
- La organización por músculo y la guía paso a paso se inspiran en la biblioteca de [MuscleWiki](https://musclewiki.com/exercises); las ilustraciones son SVG propias, sin imágenes copiadas ni red.

### C4 — exportación Excel

- `weight-export.js`: conecta el botón existente. Filtra pesos inválidos, ordena por fecha y exporta `.xlsx`; Android guarda en caché y abre el diálogo nativo de compartir; el navegador descarga el archivo.
- `index.html`: carga el módulo junto al generador XLSX existente.
- `tests/weight-xlsx.test.mjs`: verifica que la hoja use solo Fecha y Peso (kg), que el gráfico apunte a las filas de datos, que las fechas se escapen y que el botón gestione el caso sin registros y el flujo nativo.
- Causa del fallo anterior: el generador del libro existía, pero el botón no tenía un manejador conectado.

### C5 — explicación del ajuste GET

- `get-adjustment-help.js`: inserta una «i» accesible junto al porcentaje de `#goal-box` en Ajustes y la conserva después de repintar el perfil. No modifica `diet.js`.
- El diálogo explica −10 %, 0 % y +10 % frente al GET estimado y matiza el ritmo semanal.
- `tests/get-adjustment-help.test.mjs`: verifica la inserción, el repintado, el diálogo y el texto.
- `index.html` y `package.json` incluyen el módulo y la prueba; ambos archivos contienen también las integraciones C4/C1.

### C6 y C7 — materiales para Claude

- `VIDEO_TUTORIAL.md`: storyboard por escenas, voz en off continua y pautas de grabación. Es un guion listo para grabar, no un archivo MP4. Recomienda integrar C1–C5 antes de filmar.
- `RECOMMENDATIONS_FOR_CLAUDE.md`: recomendaciones ordenadas para simplificar Inicio y hacer la app más intuitiva, además de un plan de integración y validación. **No se cambió el diseño de Inicio.**

## Ensayos y resultados

- C1: validación manual de 25 platos, unicidad, ingredientes y cantidades. PASS.
- C2: validación manual de las 60 entradas y sus IDs locales. PASS; falta reconstruir la salida generada.
- C3: validación manual de 46 entradas/198 alias, mapa frontal/posterior, secundarios, fallback y escape. PASS.
- C4: inspección del XLSX ZIP: 10 partes, dos columnas, orden cronológico y referencias del gráfico. Flujo Android simulado de base64/caché/compartir. PASS.
- C5: simulación de `#goal-box`, repintado y apertura de la explicación. PASS.
- `git diff --check`: limpio en las entregas individuales y en el paquete.
- `npm test` no se pudo ejecutar: PowerShell no reconoce `npm`. Las pruebas añadidas deben ejecutarse durante la integración en un entorno con Node/npm.
- No se pudo probar en un teléfono físico; el flujo Android de Excel solo se ensayó con sustitutos del puente nativo.

## Salud: formulación comprobada

El 0,5–1 % de pérdida semanal se presenta en la ayuda como referencia para ciertos deportistas, no como umbral universal ni garantía de evitar daño hormonal. Una revisión de atletismo relaciona ese ritmo gradual en atletas más delgados con preservar masa libre de grasa y función hormonal/reproductiva; el CDC comunica una pauta general distinta, de pérdida gradual de alrededor de 1–2 lb semanales. Fuentes: [World Athletics, revisión sobre disponibilidad energética](https://worldathletics.org/download/download?filename=2d963a63-c730-48c6-8f15-9b7014bc8dda.pdf&urlslug=Energy%2BAvailability%2Bin%2BAthletics%253A%2BHealth%252C%2BPerformance%2Band%2BPhysique) y [CDC, pasos para perder peso](https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html).

## Pendiente después de la revisión

1. Ejecutar `npm run build:foods`, revisar `foods-db.js`/`foods-usda.js` generados y correr toda la suite.
2. Probar importación/exportación, persistencia y gráficos en Android y navegador; abrir el XLSX en Excel real.
3. Grabar el tutorial tras integrar las rutas mostradas.
4. Según `docs/TAREAS.md`, Claude mantiene fotos de progreso nativas, refactorización y pruebas de interfaz.
5. Strava continúa pendiente por decisión del usuario.
