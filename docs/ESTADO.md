# Estado del proyecto

Versión actual: **2.3.0** (`sw.js` y `app.js`). Tests: `npm test` → 24/24 en verde.

## Hecho
- 1.0 Registro de peso (PWA instalable, sin conexión, datos en IndexedDB).
- 2.0 Entrenamientos: rutinas, series, descansos, récords, importación CSV de Hevy y gráfico libre.
- 2.1 App Android con Capacitor; copia automática `tracking-auto.json` en la carpeta privada.
- APK compilado y firmado en GitHub Actions (`.github/workflows/android.yml`), publicado en Releases.
- 2.2 Pestaña Dieta con base de alimentos local (USDA SR28: lista en español + base completa).
- 2.3 Seguimiento de la dieta.
- Equipo de agentes de Claude Code instalado en `.claude/` (7 agentes, 8 comandos con `/manager`, 2 hooks).

## Pendiente / siguientes pasos
- (Por definir: añade aquí la siguiente funcionalidad antes de lanzar `/equipo`.)
- `package.json` sigue en 2.2.0 aunque la app está en 2.3.0.
- Solo `nutri.js` tiene tests; `app.js`, `gym.js` y `diet.js` no.

## Decisiones
- Sin servidor: los datos nunca salen del móvil (privacidad y funcionamiento sin conexión).
- El APK carga la web desde GitHub Pages: los cambios web llegan sin reinstalar.
- Alimentos del USDA (dominio público) generados con `npm run build:foods`.

## Bugs conocidos
- Ninguno registrado.
