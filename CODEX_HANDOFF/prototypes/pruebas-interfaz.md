# Guion prototipo de pruebas de interfaz

Preparado para que Claude lo convierta en pruebas de navegador cuando el repositorio tenga un runner de UI aprobado. La app no incorpora Playwright ni otra dependencia nueva. Ejecutar cada caso con una base de datos temporal y nunca con el perfil de la usuaria.

## Peso

1. Crear un registro con fecha y peso válidos; comprobar que la tarjeta y el gráfico lo reflejan tras recargar.
2. Intentar fecha duplicada y peso fuera de rango; comprobar que no se duplica ni se pierde el registro anterior.
3. Cambiar periodo del gráfico, cerrar con Atrás y comprobar que el filtro y la vista vuelven al estado esperado.
4. Exportar el Excel; comprobar dos columnas (fecha, peso), fechas ordenadas y gráfico visible en Excel y Sheets.

## Entrenamiento

1. Abrir Entreno sin sesiones y comprobar el estado vacío «Tu último entreno».
2. Crear rutina; escribir `s`, `se` y `sentadilla` en el selector; comprobar que cada carácter reduce resultados y que aparece el ejercicio esperado.
3. Añadir y guardar el ejercicio; comprobar grupo muscular, material e instrucciones.
4. Registrar una sesión temporal y volver a Entreno; comprobar resumen, volumen, series y marcas, y abrir el análisis de un ejercicio.
5. Confirmar mapa frontal/espalda, músculo principal/secundario y lectura por lector de pantalla.

## Dieta y ajustes

1. Abrir ayuda de TMB y GET; comprobar que el ejemplo de 80 kg aclara que 800 kcal/día es una conversión teórica, no una prescripción individual.
2. Cambiar ajuste de porcentaje a kcal/día y viceversa; verificar equivalencia, redondeo, persistencia y recalculado del objetivo.
3. Abrir las ayudas de proteína y grasa; comprobar unidades, rangos y texto breve.
4. Cerrar/abrir cada grupo de ajustes; verificar que no se pierden valores ni se desplaza el foco.

## Sin conexión y regresión

- Activar modo avión, abrir Inicio/Peso/Entreno/Dieta/Ajustes y buscar ejercicios/alimentos.
- Probar las pantallas anteriores con datos vacíos, con datos previos y con texto importado que contenga `<` y `&`.
- Al terminar, borrar únicamente el perfil temporal de prueba; conservar los datos reales.

## Estado de este ensayo

La suite lógica pasa 100/100. El navegador local mostró Inicio; la automatización no pudo completar el cambio a Entreno por una restricción de identificación fiable de la URL local. Por eso los pasos de interfaz anteriores siguen pendientes de ejecución y no se marcan como verificados.
