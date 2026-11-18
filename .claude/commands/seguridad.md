---
description: Auditoría de seguridad completa y, si quieres, corrección de lo CRÍTICO y ALTO
argument-hint: [zona]
---

Lanza el agente `seguridad` para auditar el proyecto. Zona en la que centrarse (si está vacío, todo el proyecto): $ARGUMENTS

1. Enséñame el informe (veredicto y hallazgos CRÍTICO / ALTO / MEDIO).
2. Pregúntame si quiero corregir los CRÍTICOS y ALTOS (opciones: corregir todo (Recomendada) / elegir cuáles / no corregir).
3. Si digo que sí, corrige con agentes `programador` (una tarea por hallazgo, sin compartir archivos en paralelo) y después vuelve a lanzar el agente `seguridad` para confirmarlo.
4. Si hay secretos en el historial de git, avísame de que hay que **rotarlos** y explícame cómo, en pasos sencillos.
