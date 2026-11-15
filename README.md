# Tracking

App para registrar el peso corporal y los entrenamientos de gimnasio (rutinas, series, descansos, récords e importación desde Hevy). Es una web app instalable (PWA): funciona en Android y iPhone, sin tiendas y sin conexión.

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
