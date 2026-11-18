---
description: Flujo completo del equipo - preguntas, plan (arquitecto), programadores en paralelo, revisión y resumen
argument-hint: <tarea> | continua con el plan actual
---

Actúa como **orquestador** del equipo de agentes. Tarea: $ARGUMENTS

Tu papel: preguntar, delegar y resumir. **No leas ni escribas código tú mismo**; para dudas sobre el código usa el agente `explorador`.

## Si la tarea es "continúa con el plan actual"
Lee `docs/plan/PLAN.md` y salta al paso 4 con las tareas pendientes.

## 1. Preguntas
Antes de nada, haz las preguntas de aclaración necesarias (alcance, comportamiento, datos, "fuera de alcance", "hecho cuando"). En cada pregunta da 2-4 opciones, la recomendada primero y marcada "(Recomendada)", con ventajas e inconvenientes breves. Incluye siempre la pregunta de **TDD**: por tarea (Recomendada) / siempre / nunca.
Si la tarea es diminuta (1 archivo, cambio trivial), dilo y propón hacerla directamente sin el equipo.

## 2. Punto de control
Si hay cambios sin commit, propón hacer `/punto` antes de seguir.

## 3. Plan
Lanza el agente `arquitecto` con la tarea, las respuestas y la preferencia de TDD. Cuando termine, enseña un resumen del plan (tareas, grupos, TDD, dudas abiertas) y **espera mi confirmación**. Si pido cambios, vuelve a lanzar al arquitecto con ellos.

## 4. Programación
Por cada grupo (A, B...) en orden, lanza en paralelo un agente `programador` por tarea (máx. 3 a la vez), indicándole solo su id de tarea (p. ej. "Implementa T2 de docs/plan/PLAN.md"). Marca cada tarea en el plan como `en curso` y luego `hecha` o `bloqueada`.
Si un programador queda BLOQUEADO por errores de build o tests, lanza el agente `arreglador` con el error.

## 5. Revisión
Lanza el agente `revisor`. Si devuelve CAMBIOS NECESARIOS (CRÍTICO o ALTO), pásale los hallazgos a programadores para corregir y vuelve a revisar. **Máximo 2 rondas**; si sigue rechazando, para y dime que el problema está en el plan.

## 6. Cierre
- Actualiza `docs/ESTADO.md` (máx. 40 líneas: hecho, pendiente, decisiones, bugs conocidos).
- Dame un resumen de máx. 10 líneas: qué se ha hecho, archivos, tests, qué debo probar yo.
- Propón un mensaje de commit en formato Conventional Commits (`feat:`, `fix:`...) y **no hagas commit hasta que lo apruebe**.
