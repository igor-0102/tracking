# Tracking

App para registrar el peso corporal. Es una web app instalable (PWA): funciona en Android y iPhone, sin tiendas y sin conexión.

**Tus datos se guardan solo en tu móvil.** Este repositorio contiene únicamente el programa, nunca tus pesos.

## Instalar
- **Android (Chrome):** abre la dirección de la app → menú ⋮ → *Instalar app* (o *Añadir a pantalla de inicio*).
- **iPhone (Safari):** abre la dirección de la app → botón Compartir → *Añadir a pantalla de inicio*.

## Copias de seguridad
Ajustes → *Exportar archivo* o *Copiar pesos*. Para restaurar: *Importar archivo* o *Importar pegando texto* (formato `21-02-2026 88,8`, una línea por registro).

## Publicar una nueva versión
1. Cambia los archivos.
2. Sube el número de versión en `sw.js` (`VERSION`) y en `app.js` (`APP_VERSION`).
3. Al abrir la app aparecerá «Nueva versión disponible · Actualizar».
