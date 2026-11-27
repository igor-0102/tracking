# Informe de entrega — C5 ayuda del ajuste GET

## Cambios

- Aparece una «i» junto al campo `Ajuste sobre el GET` de Ajustes (`#goal-box`), también después de que se vuelva a pintar el perfil.
- El diálogo explica con ejemplos breves cómo −10 %, 0 % y +10 % cambian el objetivo de calorías frente al GET estimado.
- La guía de peso aclara que 0,5–1 % semanal es una referencia de pérdida gradual para deportistas estudiados, no un límite universal ni garantía de prevenir alteraciones hormonales. La baja disponibilidad energética puede afectar la función hormonal y el riesgo depende de cada persona.
- Sin dependencias ni solicitudes de red.

## Evidencia y ensayos

- La revisión de disponibilidad energética en atletismo cita 0,5–1 % semanal para atletas más delgados y lo relaciona con preservar masa libre de grasa y función hormonal/reproductiva: [World Athletics, Energy Availability in Athletics](https://worldathletics.org/download/download?filename=2d963a63-c730-48c6-8f15-9b7014bc8dda.pdf&urlslug=Energy%2BAvailability%2Bin%2BAthletics%253A%2BHealth%252C%2BPerformance%252C%2Band%2BPhysique).
- El consejo de pérdida gradual del CDC es distinto (aprox. 1–2 lb por semana), lo que refuerza que el porcentaje no debe presentarse como umbral universal: [CDC, Steps for Losing Weight](https://www.cdc.gov/healthy-weight-growth/losing-weight/index.html).
- Ensayo manual con runtime Node: inserción inicial y tras repintado, apertura del diálogo, ejemplos de porcentajes y advertencia de alcance. Resultado: PASS.
- `npm test` no está disponible porque `npm` no se reconoce en PowerShell. Se agregó la prueba a la orden estándar del proyecto para cuando se ejecute en un entorno con Node/npm.
