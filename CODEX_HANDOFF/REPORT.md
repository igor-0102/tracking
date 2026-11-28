# Informe para Claude

## Tarea

Se completan las tareas **C1, C2 y C3** asignadas a Codex en `docs/TAREAS.md`, junto con las mejoras viables solicitadas por la usuaria a partir de su lista de comentarios públicos de Hevy y Strava. Se mantiene la aplicación local y offline, sin dependencias externas ni llamadas de red. No se modificaron `docs/ESTADO.md` ni `docs/TAREAS.md`, que son responsabilidad de Claude.

Se prepararon dos formas de revisión: `changes.patch` contiene el diff frente al commit de partida; `REEMPLAZOS/` contiene copias completas de cada archivo fuente, integración y prueba cambiado o nuevo. Claude puede revisar el parche y, si lo valida, copiar esas versiones completas a la rama de integración. La carpeta de reemplazos conserva los subdirectorios `tools/` y `tests/`.

## Cambios

### C1 — Platos preparados

- `prepared-foods.js`: catálogo ampliado de 7 a **32 platos**, con 25 opciones nuevas y cantidades por ración. Se mantiene la resolución por nombre exacto de `FOODS_ES`, evitando que un alimento creado por la persona sustituya a un alimento USDA.
- `tests/prepared-foods.test.mjs`: verifica el número de platos, nombres no duplicados y que cada ingrediente existe por nombre exacto en el `foods-db.js` actual.

### C2 — Lista de alimentos

- `tools/foods-es.txt`: **68 entradas nuevas**, hasta 307 alimentos configurados, incluyendo embutidos, quesos, panes, conservas, legumbres, salsas y productos habituales. Se mantienen el formato, las porciones y las reglas de selección USDA.
- `tests/foods-list.test.mjs`: ensayo del selector del generador contra `foods-usda.js`; comprueba que cada fila encuentra un registro y que no se asigna el mismo código dos veces.
- **No se regeneraron `foods-db.js` ni `foods-usda.js`**: `node_modules/` no existe y `npm` no está disponible en el terminal. El test de simulación sí encuentra coincidencia para las 307 filas. Claude debe regenerar los archivos con `npm install` y `npm run build:foods` en un entorno con dependencias, revisar el resultado y no sustituir los archivos generados basándose solo en la simulación. Las 32 recetas sí se validan con nombres que ya están presentes en el `foods-db.js` actual.

### C3 — Guía ejercicio por ejercicio

- `exercise-guide.js`: **38 guías locales** con colocación, movimiento, error habitual y músculos secundarios; incluye mapas SVG originales de frente/espalda. La referencia a MuscleWiki es de organización pedagógica; no se descargaron ni copiaron imágenes o texto de ese sitio.
- `gym-exercise-enhancements.js`: búsqueda y filtros locales por nombre, músculo, equipamiento y favoritos; edición persistente de guías propias con instrucciones, músculos principales/secundarios, notas y equipamiento.
- `tests/exercise-guide.test.mjs` y `tests/gym-exercise-enhancements.test.mjs`: cobertura de alias, instrucciones, músculos, favoritos, filtros y escape de contenido propio.

### Mejoras de entrenamiento y portabilidad

- `gym-active-backup.js` y `app.js`: las copias JSON incluyen la sesión en curso; la importación solo la restaura si no existe otra activa, la estructura es válida y todos los ejercicios siguen existiendo. `app.js` cuenta esa sesión al detectar datos y explica el conflicto de restauración.
- `gym-note-visibility.js`, `gym.js`: ocultar notas ya no borra su texto.
- `gym-rest-state.js`, `gym-plus.js`, `index.html` y `styles.css`: pausa, reanudación y reinicio para temporizador/cronómetro, con ajuste del tiempo restante y estado persistido durante el entreno.
- `gym-units.js`, `gym.js`, `gym-plus.js`: selector configurable kg/lb para cargas y km/mi para distancias de cardio. La app guarda las cargas como kg, las distancias como km y las duraciones como segundos; la conversión se aplica al mostrar y editar. **El cambio se limita al gimnasio**, no al peso corporal ni a la dieta.
- `gym-history-tools.js`: búsqueda del historial por entreno/ejercicio, intervalo inclusivo de fechas, exportación CSV y carga de todos los resultados filtrados sin el límite visual normal.
- `gym-exercise-history.js`: sesiones antiguas de cada ejercicio cargadas en tandas de 40, sin un máximo fijo.
- `gym-portability.js`: CSV de entrenos con una fila por serie y resumen de texto con vista previa para compartir; ambos omiten notas privadas. Los campos CSV protegen fórmulas y caracteres de nueva línea antes de abrirlos en hojas de cálculo.
- `gym-summary-comparison.js`: el resumen muestra deltas de volumen, series y duración frente a una sesión anterior por título, rutina o conjunto completo de ejercicios; no compara sesiones por el mero hecho de compartir uno.
- `gym-motivation.js`: permite apagar avisos positivos de récord/progreso sin apagar errores, temporizadores o notificaciones nativas.
- `gym-workout-layout.js`, `index.html` y `styles.css`: ajustes plegados para ocultar los datos previos, las sugerencias de progresión o las notas sin borrar sus datos. Los interruptores se sincronizan con la configuración cargada.
- `index.html`: informa de qué contienen la copia JSON, el Excel, el CSV y el resumen compartido.

### GET, Excel, modo offline y comentarios

- `diet-get-info.js`: botón “i” junto al ajuste del GET. Aclara que el porcentaje suma o resta calorías al gasto estimado y que 0,5–1 % semanal es una referencia usada en pérdida de grasa deportiva, no una regla universal ni una garantía de evitar daño hormonal.
- `weight-xlsx.test.mjs`: el generador existente ya producía las dos columnas requeridas (fecha y peso), con gráfico lineal. Se amplió la prueba para inspeccionar el XLSX almacenado, contar las celdas de esas dos columnas y verificar el rango del gráfico y la relación de la hoja. La generación (`weight-xlsx.js`) no necesitó cambios.
- `index.html`, `sw.js` y `tools/build-www.mjs`: todos los módulos nuevos se cargan, se precargan para uso offline y se copian a `www/` para Capacitor.
- Se añadieron comentarios breves dirigidos a Claude en los módulos y puntos de integración. `package.json` no admite comentarios válidos por su formato JSON.

### Funciones deliberadamente no añadidas

- **Strava** sigue pendiente, según la decisión de la usuaria sobre el alojamiento de su servidor.
- **Red social/grupos** no se implementó: requiere identidad, servidor, moderación, sincronización y decisiones de privacidad incompatibles con la promesa actual de almacenamiento local. Queda como recomendación para Claude, solo si se decide asumir esa infraestructura.
- El tutorial entregado es un guion/storyboard para grabar, no un MP4. La simplificación visual de Inicio y la guía de usabilidad se dejan como recomendaciones para Claude, tal como se pidió.

### Entrega para revisión

- `CODEX_HANDOFF/changes.patch`: cambios relativos al commit de partida, sin archivos del propio handoff.
- `CODEX_HANDOFF/REEMPLAZOS/`: fuente completa de cada archivo editado o creado, lista para sustitución una vez revisada.
- `CODEX_HANDOFF/RECOMENDACIONES-CLAUDE.md`: propuestas ordenadas por prioridad, con riesgos y trabajo pendiente.
- `CODEX_HANDOFF/VIDEO-TUTORIAL.md`: guion y storyboard de grabación.

## Pruebas

- **Suite:** 84 pruebas de `node:test`, 84 aprobadas y 0 fallidas. Se ejecutó el runner integrado disponible en este entorno usando la lista exacta de archivos de `scripts.test` en `package.json`; el comando literal `npm test` no pudo lanzarse porque `npm` y `node` no están en el PATH del terminal.
- **Sintaxis:** los 18 archivos JavaScript cambiados o relacionados pasaron `vm.Script` sin errores; los tests `.mjs` se analizaron al ejecutarlos.
- **Build web:** se ejecutó `tools/build-www.mjs`; generó 35 elementos en `www/`. Se verificaron los 28 `<script src>` del HTML contra `sw.js`, el build y los archivos copiados: ninguno falta.
- **Alimentos:** simulación de las 307 filas contra `FOODS_USDA`; cero filas sin coincidencia y cero códigos repetidos.
- **Excel:** test del paquete ZIP local, dos columnas/celdas por fila, gráfico, referencias a fecha/peso y tipo de relación OOXML.
- **Otros ensayos:** recuperación de entreno, descanso con reloj simulado, notas, filtros, paginación, comparación, unidades, privacidad de resumen, prevención de CSV formula injection y guía de ejercicios.
- La compilación web produjo una carpeta `www/` ignorada por Git; se generó usando el script existente y no se incluye en el parche.

## Dudas y riesgos

- Hace falta regenerar `foods-db.js` y `foods-usda.js` mediante el comando oficial con dependencias instaladas. Hasta entonces, las 68 filas añadidas a `tools/foods-es.txt` no aparecerán en el selector local de alimentos.
- No se pudo abrir el Excel en Excel/Google Sheets ni probar el diálogo nativo de compartir en un teléfono. La prueba inspecciona el paquete OOXML generado, pero no sustituye una apertura real.
- No se probaron teclado, pegado de notas, widgets, notificaciones, restauración tras cerrar el proceso ni selección de archivos en un móvil real. Tampoco se ejecutó una batería automatizada de navegador para las pantallas completas.
- Las guías son educativas y generales; pueden no corresponder al equipo o movilidad de cada persona. El mapa es esquemático, no una referencia anatómica clínica.
- El archivo `gym.js` ya excede las 800 líneas y necesitó puntos de integración para cardio/unidades. Claude debería revisar si desea mover ese código a módulos separados en la integración. `app.js` mantiene sus más de 800 líneas preexistentes y solo recibió cambios pequeños de compatibilidad de copia.
- La comparación del resumen es orientativa: si se entrenó una rutina con nombre igual pero ejercicios o contexto cambiados, puede no representar una comparación perfectamente homogénea.
- La ayuda de pérdida de peso se contrastó con recomendaciones generales de CDC e IOC y un consenso deportivo reciente. El porcentaje de 0,5–1 % se presenta solo como referencia deportiva; no existe un umbral porcentual universal que garantice evitar alteraciones hormonales.
