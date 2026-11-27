## Tarea

C1 · Ampliar los platos preparados desde 7 hasta unos 25 y comprobar que cada ingrediente exista en la base local.

## Cambios

- `prepared-foods.js`: ampliado a 25 platos de cocina habitual española. Se usan nombres exactos de `foods-db.js` y cantidades en gramos por ración. Las recetas permanecen locales y sus ingredientes siguen siendo editables en la aplicación.
- `tests/prepared-foods.test.mjs`: prueba la cantidad de platos, nombres únicos, coincidencia exacta de todos los ingredientes con `window.FOODS_ES` y cantidades positivas de hasta 1000 g.
- `package.json`: incluido el test nuevo en `npm test`.

## Pruebas

- Ensayo manual en el runtime JavaScript del proyecto: 25 platos, nombres únicos, cero ingredientes ausentes y cantidades válidas.
- `npm test`: no ejecutado; PowerShell no reconoce `npm` como comando.
- `git diff --check`: sin errores de espacios en los cambios incluidos en el parche.

## Dudas y riesgos

- Las cantidades son referencias aproximadas por ración; se pueden ajustar al añadir el plato.
- No se regeneraron las bases USDA: esta tarea solo consume `foods-db.js` existente y no cambia sus fuentes.
- No se ha podido ejecutar la suite completa por falta de Node/npm en la terminal.
