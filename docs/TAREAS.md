# Lista de tareas

Lista viva de lo pendiente. La mantiene Claude (jefe del proyecto); Codex (becario) solo hace las tareas
que tengan asignado **Codex** y entrega su trabajo en `CODEX_HANDOFF/` (ver `AGENTS.md`).

Estados: `[ ]` pendiente · `[~]` en curso · `[x]` hecha · `[?]` hecha, falta probar en móvil real.
Responsable: **Claude** · **Codex** · **Usuario** (pruebas o decisiones).

## Por probar en móvil real
- [?] Notificación del entreno con botón «Hecha» (Android, APK 2.5.2). — Usuario
- [?] Widget de peso con «+ Peso». — Usuario
- [?] Recordatorio diario para pesarse (Ajustes → Peso). — Usuario
- [?] Fecha de nacimiento sin bucle del calendario (iPhone, web). — Usuario
- [x] Botón «atrás» de Android cierra lo abierto. — Usuario lo confirmó

## Próximas funciones
1. [ ] Celebración al marcar un nuevo peso más cercano al objetivo (animación + mensaje). — Claude
2. [ ] Dieta: «comida trampa» con calorías extra preseleccionadas (el valor más común) y editables. — Claude
3. [ ] Base de alimentos más grande con platos típicos preparados; al tocarlos, desglose de ingredientes editable. — Claude
4. [ ] Base de ejercicios con imagen del grupo muscular trabajado y pestaña con explicación breve de cómo se hace. — Claude
5. [ ] Exportar los pesos a Excel (`.xlsx`) con hoja de datos y gráfico de líneas nativo. — Claude
6. [ ] Fotos de progreso con carpeta elegida por el usuario + calendario de fotos (nativo, APK nuevo). — Claude
7. [ ] Strava (necesita un servidor pequeño para la clave secreta: decidir alojamiento) y mapa de carreras. — Usuario decide, luego Claude

## Deuda técnica
- [ ] Tests de interfaz (`app.js`, `gym.js`, `diet.js`). — Claude
- [ ] Partir funciones de más de 50 líneas (dibujo del gráfico, importación de Hevy…). — Claude
- [ ] Reducir `app.js` (≈1550 líneas) y `diet.js` (≈885) por debajo de 800. — Claude

## Entregas de Codex
Última entrega revisada: **ninguna**.
Al revisar una, anotar aquí: fecha · huella `sha256` de `changes.patch` · resultado (integrada en PR #… / rechazada y por qué).
