# Tracking

App para registrar el peso corporal, los entrenamientos de gimnasio (rutinas, series, descansos, récords e importación desde Hevy) y la dieta (comidas con varias opciones, calorías y macros, metabolismo basal y objetivos). Es una web app instalable (PWA): funciona en Android y iPhone, sin tiendas y sin conexión.

**Tus datos se guardan solo en tu móvil.** Este repositorio contiene únicamente el programa, nunca tus pesos.

## Instalar
- **Android (Chrome):** abre la dirección de la app → menú ⋮ → *Instalar app* (o *Añadir a pantalla de inicio*).
- **iPhone (Safari):** abre la dirección de la app → botón Compartir → *Añadir a pantalla de inicio*.

## Copias de seguridad
Ajustes → *Exportar copia completa* (pesos, entrenos y rutinas en un `.json`). Para restaurar: *Importar archivo*. Los pesos también se pueden copiar y pegar como texto (`21-02-2026 88,8`, una línea por registro).

## Importar desde Hevy
En Hevy: Perfil → Ajustes → Exportar e importar datos → Exportar entrenamientos. En Tracking: Ajustes → *Importar archivo* y elige el CSV. Se procesa en el móvil; nada se sube a ningún sitio.

## Publicar una nueva versión
1. Cambia los archivos.
2. Sube el número de versión en `sw.js` (`VERSION`) y en `app.js` (`APP_VERSION`).
3. Al abrir la app aparecerá «Nueva versión disponible · Actualizar».

## Dieta y alimentos
- Los cálculos (macros, edad, TMB, GET, objetivos) están en `nutri.js`, separados de la interfaz, con tests: `npm test`.
- Los alimentos salen de la base **USDA SR28** (dominio público) y funcionan sin conexión:
  - `foods-db.js`: lista básica en español. Se define en `tools/foods-es.txt` (nombre en español → alimento del USDA).
  - `foods-usda.js`: base completa en inglés (8.789 alimentos), búsqueda opcional.
  - Para regenerarlas tras editar la lista: `npm install` y `npm run build:foods`.
- Lo que no esté en la base se crea a mano desde el buscador de ingredientes («Crear alimento a mano»).
- `foods.js` deja las fuentes de alimentos detrás de una interfaz (`Foods.addSource`) para poder añadir otras sin tocar la pantalla.
