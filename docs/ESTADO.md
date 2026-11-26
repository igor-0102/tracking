# Estado del proyecto

Versión actual: **2.5.5** (`sw.js`, `app.js` y `package.json`). APK instalado en el móvil: 2.5.2 (trae todo lo nativo). Tests: `npm test` → 42/42 en verde.

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
- 2.5.1 Arreglo: la fecha de nacimiento ya no reabre el calendario en bucle en iPhone.
- 2.5.2 Gráfico de peso: botones de periodo configurables (✎ junto a los botones; por defecto Semana/Mes/3M/Todo y en pantalla completa 1M/3M/6M/Todo + Auto). Botón «atrás» de Android cierra lo abierto (necesita el APK nuevo, plugin `@capacitor/app`).
- 2.5.3 Arreglo: la app detectaba mal sus plugins nativos (usaba `isPluginAvailable`, que solo funciona con `@capacitor/core`); ahora usa `Capacitor.PluginHeaders`. Recordatorio también en Ajustes → Peso.
- 2.5.4–2.5.5 Botones del gráfico: recuadro deslizable con «Todo» y ✎ dentro; de 0 a 10 botones por gráfico. Botón ⓘ en «Dieta cumplida» que explica el gasto real.
- Probado por el usuario: botón atrás de Android funciona. Pendiente de confirmar en móvil real: notificación de entreno, widget, recordatorio; calendario de fecha de nacimiento en iPhone.

### Ideas para próximas versiones
1. Celebración al marcar un nuevo peso más cercano al objetivo (animación + mensaje).
2. Dieta: «comida trampa» (cheat meal) con calorías extra preseleccionadas al valor más común, editables.
3. Base de alimentos más grande con platos típicos preparados; al tocarlos, desglose de ingredientes editable.
4. Base de datos de ejercicios con la imagen del grupo muscular trabajado y una pestaña con la explicación breve de cómo se hace.
5. Exportar los pesos a Excel con un gráfico (además de copiar al portapapeles).
6. Fotos de progreso con carpeta elegida + calendario de fotos.
7. Strava (necesita un servidor pequeño para la clave secreta) y mapa de carreras.
8. Deuda técnica: tests de interfaz; partir funciones de más de 50 líneas; `app.js` (≈1550) y `diet.js` (≈885) por encima de 800 líneas.

## Decisiones
- Sin servidor: los datos nunca salen del móvil (privacidad y funcionamiento sin conexión).
- El APK carga la web desde GitHub Pages: los cambios web llegan sin reinstalar.
- Alimentos del USDA (dominio público) generados con `npm run build:foods`.

## Bugs conocidos
- Ninguno registrado.
