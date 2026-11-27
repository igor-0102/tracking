# Archivos completos para sustituir tras la validación

Esta carpeta contiene una copia íntegra de cada archivo de proyecto añadido o modificado. La ruta relativa de cada copia es su ruta de destino: por ejemplo, `REEMPLAZOS/tests/weight-xlsx.test.mjs` sustituye a `tests/weight-xlsx.test.mjs`.

## Procedimiento

1. Revisar `../changes.patch` y `../REPORT.md`.
2. Si se aprueban los cambios, copiar los archivos completos de esta carpeta sobre las rutas equivalentes del proyecto. `index.html` y `package.json` ya reúnen todas las integraciones.
3. No aplicar `changes.patch` después de copiar los reemplazos: ambos formatos representan el mismo conjunto de cambios.
4. Después de aprobar `tools/foods-es.txt`, ejecutar `npm run build:foods` para regenerar las bases derivadas. Los archivos generados no se incluyen porque las instrucciones del proyecto prohíben editarlos manualmente.
5. Ejecutar `npm test` en un entorno con Node y npm y validar la aplicación en navegador y Android.

`LEEME.md` es una guía del paquete; no se copia al código de la aplicación. `package.json` se mantiene como JSON válido: no admite comentarios explicativos dentro del archivo.
