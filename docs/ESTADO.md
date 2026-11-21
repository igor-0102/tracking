# Estado del proyecto

Versión actual: **2.5.0** (`sw.js`, `app.js` y `package.json`). Tests: `npm test` → 36/36 en verde.

## Hecho
- 1.0 Registro de peso (PWA instalable, sin conexión, datos en IndexedDB).
- 2.0 Entrenamientos: rutinas, series, descansos, récords, importación CSV de Hevy y gráfico libre.
- 2.1 App Android con Capacitor; copia automática `tracking-auto.json` en la carpeta privada.
- APK compilado y firmado en GitHub Actions (`.github/workflows/android.yml`), publicado en Releases.
- 2.2 Pestaña Dieta con base de alimentos local (USDA SR28: lista en español + base completa).
- 2.3 Seguimiento de la dieta.
- 2.4 Entreno: descanso con temporizador o cronómetro (Ajustes), salto a la siguiente serie al marcar (Intro del teclado marca), superseries (también al importar de Hevy), sugerencia de progresión, gráfico de ejercicio como el de peso (pantalla completa), calendario con racha y series por grupo muscular. Peso: medidas corporales. Dieta: macros por kg de peso. Lógica pura en `gymcalc.js` con tests; interfaz nueva en `gym-plus.js` y `body.js`.
- Equipo de agentes de Claude Code instalado en `.claude/` (7 agentes, 8 comandos con `/manager`, 2 hooks).

## Pendiente / siguientes pasos
- 2.5 (nuevo APK): notificación de entreno tipo Hevy con botón «Hecha» (plugin propio `TrackingNativePlugin.java`), recordatorio diario para pesarse (`@capacitor/local-notifications`), widget de peso (`WeightWidget.java`). Lógica web en `native.js`. Gráfico de peso con Semana/Mes/Todo/Auto; Inicio muestra el peso del día. **Pendiente: probar en un móvil real.**
- Fase posterior: fotos de progreso con carpeta elegida + calendario de fotos, integración con Strava, mapa de carreras.
- Solo `nutri.js` tiene tests; `app.js`, `gym.js` y `diet.js` no.

## Decisiones
- Sin servidor: los datos nunca salen del móvil (privacidad y funcionamiento sin conexión).
- El APK carga la web desde GitHub Pages: los cambios web llegan sin reinstalar.
- Alimentos del USDA (dominio público) generados con `npm run build:foods`.

## Bugs conocidos
- Ninguno registrado.
