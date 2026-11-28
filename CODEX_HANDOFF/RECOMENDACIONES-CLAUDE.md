# Mejoras recomendadas para Claude

Propuestas pendientes o de revisión. Se priorizan privacidad, claridad y estabilidad antes de añadir funciones sociales.

## P0 — Verificar y preparar la integración

1. **Revisar la base de alimentos regenerada.** Esta entrega reconstruye `foods-db.js` con 307 alimentos desde el snapshot USDA local; las pruebas verifican la lista y los platos preparados. Validar una muestra nutricional con criterio de producto y evaluar la antigüedad del snapshot antes de actualizar la fuente.
2. **Probar en móvil y en hojas de cálculo:** abrir el `.xlsx` desde Android en Excel y Google Sheets; comprobar dos columnas y gráfico; probar compartir CSV/resumen, recuperar una sesión y alternar kg/lb y km/mi durante un entreno.
3. **Revisar la integración de `gym.js`:** el archivo ya supera 800 líneas. Separar las adaptaciones de cardio y presentación de unidades antes de integrarlas, si se puede preservar el flujo de importación de Hevy y rutinas.
4. **No dar por probado el daño hormonal a partir de una cifra.** El IOC relaciona REDs con baja disponibilidad energética problemática, prolongada o severa; no establece 1 % de peso semanal como garantía o frontera universal. El consenso ISSN de 2026 presenta 0,5–1 % como orientación para preservar masa magra en población deportiva en déficit, y CDC aconseja una pérdida gradual sin expresarla como porcentaje universal.

## P1 — Simplificar Inicio y facilitar el uso

1. **Inicio menos saturado:** mantener una acción principal (registrar peso o continuar/iniciar entreno, según el contexto); mover gráficos secundarios y datos históricos a sus pestañas; agrupar los indicadores en dos o tres tarjetas resumidas; evitar mostrar módulos vacíos antes de que haya datos.
2. **Jerarquía visual estable:** títulos cortos, una acción primaria por pantalla, acciones secundarias en menús, mismos iconos y vocabulario entre peso, entreno y dieta.
3. **Primer uso guiado:** ejemplos editables, estados vacíos con una acción concreta y una ruta de 3 pasos para crear una rutina, apuntar un entreno y consultar el historial. Permitir cerrar y volver a mostrar la ayuda.
4. **Personalización de la pantalla de entreno:** ya se pueden ocultar datos previos, sugerencias y notas. Después de probarlo, recoger feedback antes de añadir más interruptores o reordenación; las opciones avanzadas deben seguir plegadas.
5. **Gráficos:** conservar la selección actual de rango y métrica; valorar una comparación explícita de dos ejercicios o dos periodos solo si las pruebas con usuarios muestran una necesidad. Incluir etiquetas de unidad y fecha siempre visibles.

## P1 — Robustez y calidad

1. Añadir pruebas de interfaz reproducibles para crear/editar entrenos, notas con teclado/pegado, filtros de historial, importación/exportación y pantallas de peso/dieta.
2. Medir tiempo de renderizado con historiales largos y dispositivos Android modestos; paginar cualquier lista que afecte a scroll/entrada y no precargar XML, alimentos ni gráficos innecesarios.
3. Revisar la gestión de datos dañados o incompletos importados, duplicados de entrenos, permisos de compartir y recuperación ante falta de espacio en IndexedDB.
4. Refactorizar gradualmente `app.js`, `gym.js` y `diet.js`, y dividir funciones largas sin cambiar los formatos persistidos. Mantener migraciones probadas para instalaciones ya existentes.
5. Validar las instrucciones anatómicas con un profesional o fuentes fiables de ejercicio; los mapas incluidos son dibujos esquemáticos propios.

## P2 — Funciones futuras con decisión previa

1. **Strava:** sigue pendiente por la decisión de alojamiento. No incrustar secretos OAuth en la app ni enviar datos hasta definir servidor, consentimiento, revocación y retención.
2. **Compartir en grupos:** no añadir mientras la aplicación sea local/offline. Si la usuaria lo prioriza, diseñar primero backend mínimo, identidad opcional, eliminación de datos y consentimiento por cada publicación.
3. **Fotos de progreso:** implementar solo tras decidir almacenamiento, tamaño/cuotas, exportación, eliminación, permisos de galería y si la selección de carpeta debe funcionar en Android/iOS. Probar recuperación y borrado antes de publicar.

## Fuentes para el texto del GET

- [CDC: pérdida gradual de peso](https://www.cdc.gov/healthy-weight-growth/losing-weight/): referencia general de 1–2 lb semanales y factores individuales.
- [IOC 2023, consenso sobre REDs](https://bjsm.bmj.com/content/57/17/1073): define el síndrome asociado a baja disponibilidad energética problemática y explica que duración, magnitud y respuesta varían; no aporta una garantía endocrina basada en un porcentaje semanal de peso.
- [ISSN 2026, posición sobre pérdida de peso](https://doi.org/10.1080/15502783.2026.2740266): sitúa 0,5–1 % semanal como posible orientación para retener masa magra en deportistas bajo déficit energético. No se debe extrapolar como regla clínica universal.
