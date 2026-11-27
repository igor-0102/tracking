# Informe de entrega — C3 guía de ejercicios

## Cambios

- El catálogo local ahora incluye 46 ejercicios y 198 alias en español e inglés.
- Cada ejercicio ofrece colocación, movimiento y error frecuente, además de músculos secundarios.
- La tarjeta muestra dos mapas SVG locales, vista frontal y posterior, con color distinto para el músculo principal y los secundarios.
- Los ejercicios nuevos siguen teniendo una guía general de respaldo; los nombres importados se escapan antes de mostrarse.
- La presentación toma como referencia el patrón de navegación por músculo y guía de técnica de MuscleWiki, con ilustraciones SVG propias y sin cargar sus imágenes ni acceder a la red.

## Ensayos y límites

- Ensayo manual con runtime Node: sintaxis del módulo válida; las 46 entradas tienen datos completos y nombres únicos; los 198 alias identifican su grupo principal; vistas frontal y posterior, secundarios, fallback y escape HTML comprobados. Resultado: PASS.
- No se pudo ejecutar `npm test` porque `npm` no está disponible en PowerShell. Se amplió `tests/exercise-guide.test.mjs` para que el conjunto de pruebas normal cubra estos casos al integrarlo.
- Las instrucciones son orientación general de técnica; pueden requerir ajuste individual por movilidad, equipo o indicación profesional.
