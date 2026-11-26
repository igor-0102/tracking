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
1. [?] Celebración al marcar un nuevo peso más cercano al objetivo (animación + mensaje). — Codex (v2.6.0)
2. [?] Dieta: «comida trampa» con calorías extra preseleccionadas (el valor más común) y editables. — Codex (v2.6.0)
3. [~] Base de alimentos más grande con platos típicos preparados; al tocarlos, desglose de ingredientes editable. — Codex hizo 7 platos (v2.6.0); falta ampliar la base de alimentos y más platos
4. [~] Base de ejercicios con imagen del grupo muscular trabajado y pestaña con explicación breve de cómo se hace. — Codex hizo una guía por patrones con silueta (v2.6.0); falta una base ejercicio por ejercicio
5. [?] Exportar los pesos a Excel (`.xlsx`) con hoja de datos y gráfico de líneas nativo. — Codex (v2.6.0); falta abrirlo en Excel real
6. [ ] Fotos de progreso con carpeta elegida por el usuario + calendario de fotos (nativo, APK nuevo). — Claude
7. [ ] Strava (necesita un servidor pequeño para la clave secreta: decidir alojamiento) y mapa de carreras. — Usuario decide, luego Claude

## Deuda técnica
- [ ] Tests de interfaz (`app.js`, `gym.js`, `diet.js`). — Claude
- [ ] Partir funciones de más de 50 líneas (dibujo del gráfico, importación de Hevy…). — Claude
- [ ] Reducir `app.js` (≈1550 líneas) y `diet.js` (≈885) por debajo de 800. — Claude

## Entregas de Codex
Última entrega revisada: **2026-11-26** · `sha256 e72d803e955798a3018e4eda3e638d66dc6b787283bdd71df9dabc466a8bb9df` · rama `handoff/codex-primera-entrega`.

### 2026-11-26 · primera entrega (tareas 1–5)
- Base correcta (`ef9cefb`, 2.5.5). `git apply --check` sin conflictos. 46/46 tests al aplicarla.
- Integrada con correcciones de Claude en la rama `codex/primera-entrega` (PR):
  1. Código nuevo sacado de `app.js` y `diet.js` (ya pasan de 800 líneas) a `weight-extras.js`, `body.js` y `prepared-foods.js`.
  2. Platos preparados: ingredientes por nombre exacto de la lista básica (antes un alimento propio parecido podía sustituirlos).
  3. Guía de ejercicios: vista de espaldas para espalda, tríceps y glúteos (antes se iluminaba el pecho); grupos musculares raros de copias importadas ya no rompen la guía. +2 tests.
  4. Excel verificado: ZIP y XML válidos y leídos con openpyxl; falta abrirlo en Excel real.
- Nota para Codex: entregar en `main` (carpeta `CODEX_HANDOFF/`) o avisar de la rama; no pudo ejecutar `npm test`.
Al revisar una, anotar aquí: fecha · huella `sha256` de `changes.patch` · resultado (integrada en PR #… / rechazada y por qué).
