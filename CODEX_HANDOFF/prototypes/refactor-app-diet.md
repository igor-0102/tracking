# Prototipo de refactorización gradual

Claude mantiene `app.js` y `diet.js`. Esta propuesta no cambia los dos archivos grandes: separa primero las responsabilidades con límites visibles y conserva las funciones globales que ya consumen los otros scripts.

## `app.js` (1.500+ líneas)

| Módulo propuesto | Bloque aproximado | Contrato a conservar |
| --- | --- | --- |
| `weight-chart.js` | `niceStep`, `chartPoints` y dibujo/configuración del gráfico | Recibe historial/rangos; devuelve/renderiza SVG; no escribe IndexedDB. |
| `weight-history.js` | `renderAverages`, `renderHistory`, edición y borrado | Sigue usando `DB`, `fmtKg`, `fmtD` y los eventos actuales. |
| `weight-backup.js` | copias automáticas, exportación, `parseBackup`, importación y restauración | Validar forma/datos antes de guardar; mantener compatibilidad con backups existentes. |
| `app-dialogs.js` | `openSheet`, `ask`, `toast`, capas y cierre con botón Atrás | Mantener una única pila y evitar listeners duplicados. |
| `app-settings.js` | ajustes, tema y actualización/service worker | No cambiar `APP_VERSION`; Claude la sube al publicar. |

## `diet.js` (≈900 líneas)

| Módulo propuesto | Bloque aproximado | Responsabilidad |
| --- | --- | --- |
| `diet-profile.js` | carga, `profileCalc`, TMB/GET, objetivos y guardado | Estado del perfil y cálculos; continuar usando `Nutri` como fuente pura. |
| `diet-dashboard.js` | `dietRenderAll`, barras, resumen y tarjeta «Dieta cumplida» | Render de pestaña y explicaciones; no duplicar cálculos. |
| `diet-editor.js` | creación/duplicado de dieta, comidas y opciones | CRUD de plantillas, manteniendo IDs y datos de IndexedDB. |
| `diet-food-editor.js` | búsqueda, cantidades, alimentos propios y favoritos | Conservar los escapes de importaciones y las claves `u:`/`c:`. |
| `diet-shopping.js` | lista de la compra y exportación | Derivar de las comidas elegidas y no guardar cantidades derivadas como fuente primaria. |

## Secuencia segura

1. Añadir primero una prueba de comportamiento para cada bloque que se vaya a mover.
2. Extraer una responsabilidad por PR/entrega, dejando en el archivo original solo una función puente.
3. Mantener el orden de scripts de `index.html`, `sw.js` y `tools/build-www.mjs`.
4. Ejecutar toda la suite y comparar exportación/importación de backups antes y después.
5. Probar navegación Atrás, estado de filtros, tema y datos existentes en una copia aislada.

No conviene empezar por importación/exportación: es el bloque con más riesgo de compatibilidad de datos. El prototipo prioriza un módulo puro y aislable (gráfico o cálculos de perfil) para reducir el riesgo.
