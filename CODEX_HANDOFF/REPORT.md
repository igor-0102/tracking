# Informe detallado para Claude — paquete `claude-ready`

## Cómo usar este paquete

La rama `handoff/claude-ready` contiene el conjunto integrado de cambios. Para facilitar la validación se preparan **dos versiones** del mismo trabajo:

1. `CODEX_HANDOFF/changes.patch`: diferencias respecto al baseline para revisar exactamente qué líneas cambian.
2. `CODEX_HANDOFF/REEMPLAZOS/`: copias completas de cada archivo de proyecto modificado o añadido, conservando debajo de esa carpeta su ruta relativa original. Si Claude valida el cambio, puede copiar cada archivo de ahí sobre la misma ruta del proyecto.

Las copias completas ya integran las tareas que comparten archivo: `index.html` incluye los dos scripts nuevos y `package.json` recoge las pruebas de todas las tareas. El parche sirve para revisar; la carpeta de reemplazos sirve para sustituir. **No se deben aplicar ambos formatos a la vez**, porque duplicaría los mismos cambios.

Los informes y ramas C1–C7 originales siguen disponibles para revisar cada tarea por separado. `CODEX_HANDOFF/REEMPLAZOS/LEEME.md` enumera el procedimiento de copia y aclara las excepciones.

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

Cada ruta de la tabla tiene en `CODEX_HANDOFF/REEMPLAZOS/` su archivo completo, no un fragmento. Las rutas de esa carpeta corresponden a las rutas de destino del repositorio. En particular, usar el `index.html` y `package.json` completos evita perder una de las integraciones.

**Excepción deliberada:** no se sustituyen `foods-db.js` ni `foods-usda.js`. Son archivos generados y las instrucciones del proyecto prohíben editarlos directamente. C2 entrega la fuente `tools/foods-es.txt`; tras sustituirla, ejecutar `npm run build:foods` y revisar los archivos generados.

## Instrucciones del proyecto consideradas

- Respetar `CLAUDE.md` y `AGENTS.md`: no añadir dependencias, llamadas de red ni cambios a `android/`, `docs/`, archivos generados o versiones de servicio.
- Mantener los cambios fuera de `main` hasta que Claude los revise e integre.
- El script `npm test` ya incluye las pruebas añadidas; también debe ejecutarse `node --check` en un entorno con Node.
- No se abrió PR. El proyecto define entrega mediante ramas `handoff/...` con baseline, diff e informe.
- Se dejó `main` intacta y se mantuvo la entrega en la rama de handoff indicada.
- Los comentarios explicativos para Claude se añadieron al código JavaScript, CSS, HTML, pruebas y fuente de alimentos. `package.json` es JSON y no admite comentarios sin dejar de ser válido; su propósito y el script integrado se explican aquí.

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

- C1: recorrido de las 25 recetas mediante el `Foods.search()` real del proyecto; se añadieron 106 ingredientes en total y cada ingrediente conservó su clave local, cantidad y unidad. PASS.
- C2: verificación de las 60 entradas nuevas contra `foods-usda.js`; todos los IDs existen. Además, se corrigieron etiquetas que antes atribuían una descripción aproximada o un estado de escurrido incorrectos. PASS. Falta reconstruir los ficheros generados después de que Claude apruebe la fuente.
- C3: recorrido de los 198 alias de los 46 ejercicios, mapas frontal/posterior, músculos secundarios y escape de texto importado. PASS.
- C4: XLSX generado en simulación; incluye cabeceras Fecha/Peso (kg) y el gráfico, con registros ordenados. Se rechazaron fechas imposibles (31 de febrero y 29 de febrero de 2025) y se aceptó el día bisiesto válido de 2024. Se simularon la descarga web y las llamadas Android de escritura en caché/compartir. PASS.
- C5: simulación de `#goal-box`, inserción y repintado del botón «i», captura del clic y apertura de la explicación. PASS.
- Mejora de calidad adicional: `tests/prepared-foods.test.mjs` ahora cubre la integración real entre las recetas y la búsqueda local, además de comprobar el catálogo estático.
- Suite del proyecto: se ejecutaron con el runner integrado `node:test` los mismos siete archivos que enumera el script `npm test`; resultado **60/60 pruebas aprobadas, 0 fallos**. El comando `npm test` como tal no se pudo invocar porque PowerShell no reconoce `npm`.
- `git diff --check` del código del paquete (excluyendo `changes.patch`, cuyos prefijos de espacio forman parte del formato unified diff): limpio.
- No se pudo probar en un teléfono físico ni abrir el Excel con Microsoft Excel real; el flujo Android se simuló con sustitutos del puente nativo.

## Salud: formulación comprobada

El 0,5–1 % de pérdida semanal se presenta en la ayuda como referencia para ciertos deportistas, no como umbral universal ni garantía de evitar daño hormonal. Una revisión de atletismo relaciona ese ritmo gradual en atletas más delgados con preservar masa libre de grasa y función hormonal/reproductiva; el CDC comunica una pauta general distinta, de pérdida gradual de alrededor de 1–2 lb semanales. Fuentes: [World Athletics, revisión sobre disponibilidad energética](https://worldathletics.org/download/download?filename=2d963a63-c730-48c6-8f15-9b7014bc8dda.pdf&urlslug=Energy%2BAvailability%2Bin%2BAthletics%253A%2BHealth%252C%2BPerformance%2Band%2BPhysique) y [CDC, pasos para perder peso](https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html).

## Pendiente después de la revisión

1. Ejecutar `npm run build:foods`, revisar `foods-db.js`/`foods-usda.js` generados y correr toda la suite.
2. Probar importación/exportación, persistencia y gráficos en Android y navegador; abrir el XLSX en Excel real.
3. Grabar el tutorial tras integrar las rutas mostradas.
4. Según `docs/TAREAS.md`, Claude mantiene fotos de progreso nativas, refactorización y pruebas de interfaz.
5. Strava continúa pendiente por decisión del usuario.

## Hallazgos corregidos en la última simulación

- La exportación aceptaba fechas que solo parecían ISO, pero no existían en el calendario. Ahora filtra el calendario gregoriano real, incluidos los años bisiestos.
- La prueba de integración de los platos solo comprobaba que los ingredientes aparecían en el catálogo; ahora también ejecuta cada receta con el buscador real y comprueba el resultado añadido.
- Se afinaron etiquetas de alimentos ligadas a IDs USDA aproximados o a descripciones con líquido: chistorra aparece como aproximación de salchicha italiana cruda, la salchicha cocinada indica cerdo y ternera, el bagel especifica salvado de avena y las alubias rojas del ID 16034 ya no se presentan como escurridas.
- La simulación inicial detectó dos expectativas de prueba obsoletas: una frase de la guía y el orden cronológico esperado de los pesos. Se ajustaron las pruebas al contenido y orden reales de la aplicación; después la suite completa pasó.

La simulación cubre de forma reproducible los flujos descritos, pero no permite afirmar que no exista ningún otro defecto en toda la aplicación: falta la suite formal y la validación en dispositivos reales.
