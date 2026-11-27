# Recomendaciones para Claude

Este documento propone mejoras; no cambia la pantalla de Inicio ni implementa las recomendaciones de interfaz.

## Simplificar Inicio

1. Mantener las dos acciones principales —**Añadir peso** y **Empezar entrenamiento**— como el foco visual de la primera pantalla.
2. Debajo, mostrar como máximo un resumen compacto del estado de hoy (por ejemplo, peso registrado y entrenamiento activo); evitar duplicar gráficos, totales de dieta y accesos que ya existen en sus pestañas.
3. Reducir las tarjetas de dieta y acciones rápidas a una sola línea con un botón claro para abrir **Dieta**; desplegar el detalle bajo demanda.
4. Hacer que los avisos secundarios, como el recordatorio de copia, ocupen menos espacio y no compitan visualmente con las acciones principales.
5. Usar estados vacíos con una sola siguiente acción: añadir primer peso, crear primera rutina o crear primera dieta.
6. Revisar la pantalla en móvil estrecho y aumentar el espacio entre secciones; la prioridad visual debe ser evidente en pocos segundos.

## Hacer la app más intuitiva

1. Añadir un recorrido inicial breve y opcional: registrar peso, elegir si quiere entrenar y configurar dieta. Permitir saltar cualquier paso.
2. Unificar los nombres y verbos de los botones entre Inicio, pestañas y diálogos; indicar siempre qué se guarda y qué ocurre al confirmar.
3. Tras acciones importantes, mostrar confirmación con una opción de deshacer cuando sea seguro (borrar registro, editar rutina, importar o combinar datos).
4. Hacer más visible la búsqueda de ejercicios, sus alias y grupos musculares; mostrar primero las coincidencias locales aunque no haya conexión.
5. Mantener una jerarquía consistente en formularios: etiqueta, unidad, ayuda breve y validación junto al campo que tiene el problema.
6. Añadir estados de carga, error y éxito para importar, exportar, guardar y sincronizar; evitar mensajes genéricos si se puede explicar cómo continuar.
7. Comprobar accesibilidad móvil: áreas táctiles, foco visible, contraste, tamaño de letra y nombres accesibles para iconos y gráficos.

## Mejoras priorizadas para planificar

### P0 — Integrar las entregas preparadas

1. Integrar las ramas `handoff/c1-platos-preparados`, `handoff/c2-alimentos-basicos`, `handoff/c3-guia-ejercicios`, `handoff/c4-exportar-peso-excel` y `handoff/c5-ayuda-ajuste-get` en una rama de trabajo. Resolver el solapamiento de `package.json` combinando todas las pruebas en el script `test`.
2. Tras integrar C2, ejecutar `npm run build:foods` para regenerar las bases derivadas; revisar los 60 alimentos nuevos contra sus correspondencias USDA antes de publicar.
3. Integrar `handoff/c6-guion-tutorial` después de validar las pantallas finales; grabar el MP4 con datos ficticios y comprobar que el flujo Excel abre en Excel móvil/escritorio.

### P1 — Verificación antes de publicar

4. Ejecutar la suite completa (`npm test`) y `node --check` para los módulos afectados en un entorno con Node/npm; añadir un resultado reproducible al informe de integración.
5. Probar importación, exportación, persistencia, restauración y gráficos en Android real y en un navegador de escritorio; comprobar fechas, grandes historiales y cancelación del diálogo Compartir.
6. Revisar los nombres importados de Hevy que no coincidan con los 46 ejercicios guiados; priorizar los ejercicios más usados y dejar fallback claro para los demás.

### P2 — Tareas pendientes del plan original

7. Implementar las fotos de progreso nativas con permisos claros, almacenamiento local, eliminación y comprobación en un teléfono real.
8. Refactorizar gradualmente los módulos grandes (`app.js`, `gym.js`, `diet.js`) en piezas pequeñas con límites claros, preservando el comportamiento y añadiendo pruebas de lógica antes de mover cada bloque.
9. Añadir pruebas de interfaz para los flujos críticos: primer registro de peso, finalizar entreno, editar dieta, exportar e importar copia. Mantener ensayos manuales en Android para notificaciones y permisos.
10. Mantener Strava pendiente hasta que se decidan alojamiento, alcance de sincronización y manejo de credenciales; esa decisión no está tomada.

## Orden de integración sugerido

1. C1 → C2 → C3 → C4 → C5.
2. Regenerar alimentos y ejecutar pruebas completas.
3. C6 (guion) y C7 (este listado de recomendaciones).
4. Continuar con tareas nativas, refactorización y pruebas de interfaz.
