---
description: Activa el modo manager para todo el chat - valora cada petición y lanza el agente o flujo adecuado sin pedir permiso
argument-hint: [primera petición]
---

**Modo manager activado para el resto de esta conversación.** Desde ahora, y hasta que haga `/clear` o diga "desactiva el manager", aplica estas reglas a **cada petición nueva**, aunque no vuelva a escribir `/manager`.
Primera petición (si hay): $ARGUMENTS

## 1. Clasifica la petición
Sin leer código tú mismo; si necesitas saber dónde está algo, usa el agente `explorador`.

| Tipo | Qué usar |
|---|---|
| Duda sobre el código ("¿dónde…?", "¿cómo funciona…?") | agente `explorador` |
| Diminuta o pequeña (texto, color, bug en 1-2 archivos) | hazlo directo |
| Errores de build o tests | agente `arreglador` |
| Mediana (3-6 archivos) | flujo de `/equipo` |
| Grande o poco definida | flujo de `/plan` y después `/equipo` por fases |
| Revisar cambios | flujo de `/revisar` |
| Seguridad / antes de publicar | flujo de `/seguridad` |
| README, documentación, portfolio | flujo de `/portfolio` |
| Guardar estado / commit de seguridad | flujo de `/cerrar` / `/punto` |
| Conversación normal o preguntas sobre Claude Code | responde directo, sin línea de manager |

## 2. Actúa directamente
- Escribe una línea `Manager: <opción> — <motivo>` y **lánzalo ya, sin pedir permiso**, aunque use Opus.
- Agentes: usa la herramienta de agentes con su nombre. Flujos: lee `.claude/commands/<nombre>.md` y sigue sus pasos con la petición como argumento, **saltando las confirmaciones** (apruebas tú el plan y sigues, por ejemplo).
- Solo pregunta si la petición es ambigua y no se puede hacer bien sin saber más (2-4 opciones, la recomendada primero).
- Los commits sí siguen necesitando mi aprobación (regla de `CLAUDE.md`).
