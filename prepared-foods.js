/* Claude: los platos ampliados usan nombres exactos de la base local USDA para conservar la búsqueda nutricional. */
'use strict';

window.PREPARED_MEALS = [
  { name: 'Pollo con arroz', items: [['Pechuga de pollo, asada', 150], ['Arroz blanco, cocido', 180], ['Aceite de oliva', 5]] },
  { name: 'Lentejas con verduras', items: [['Lentejas, cocidas', 200], ['Zanahoria, cruda', 50], ['Cebolla, cruda', 35], ['Aceite de oliva', 5]] },
  { name: 'Tortilla de patata', items: [['Huevo entero', 110], ['Patata, cocida', 180], ['Cebolla, cruda', 20], ['Aceite de oliva', 8]] },
  { name: 'Ensalada de atún', items: [['Lechuga romana', 70], ['Tomate', 120], ['Atún en lata al natural, escurrido', 80], ['Aceite de oliva', 8]] },
  { name: 'Pasta con tomate y pollo', items: [['Pasta, cocida', 180], ['Pechuga de pollo, asada', 100], ['Salsa de tomate', 80], ['Aceite de oliva', 5]] },
  { name: 'Gazpacho', items: [['Tomate', 250], ['Pepino', 80], ['Pimiento verde, crudo', 35], ['Cebolla, cruda', 15], ['Aceite de oliva', 8]] },
  { name: 'Merluza con patata', items: [['Merluza o pescadilla, cruda', 180], ['Patata, cocida', 180], ['Aceite de oliva', 8]] },
  { name: 'Macarrones con tomate', items: [['Pasta, cocida', 220], ['Salsa de tomate', 100], ['Queso curado (tipo parmesano)', 10], ['Aceite de oliva', 5]] },
  { name: 'Arroz con pollo y verduras', items: [['Arroz blanco, cocido', 180], ['Pechuga de pollo, asada', 120], ['Guisantes congelados', 50], ['Pimiento rojo, crudo', 40], ['Aceite de oliva', 5]] },
  { name: 'Cocido sencillo', items: [['Garbanzos, cocidos', 160], ['Patata, cocida', 100], ['Zanahoria, cruda', 50], ['Pollo asado con piel', 80]] },
  { name: 'Salmorejo con huevo y jamón', items: [['Tomate', 250], ['Pan blanco de molde', 35], ['Aceite de oliva', 8], ['Huevo cocido', 50], ['Jamón curado (tipo serrano)', 20]] },
  { name: 'Pisto con huevo', items: [['Tomate', 120], ['Calabacín, crudo', 100], ['Berenjena, cruda', 70], ['Pimiento verde, crudo', 40], ['Cebolla, cruda', 30], ['Huevo entero', 55], ['Aceite de oliva', 8]] },
  { name: 'Revuelto de setas', items: [['Champiñones, crudos', 150], ['Huevo entero', 110], ['Aceite de oliva', 5]] },
  { name: 'Pechuga a la plancha con ensalada', items: [['Pechuga de pollo, asada', 150], ['Lechuga romana', 60], ['Tomate', 100], ['Pepino', 60], ['Aceite de oliva', 8]] },
  { name: 'Yogur con avena y fruta', items: [['Yogur natural entero', 125], ['Copos de avena', 35], ['Plátano', 80], ['Fresas', 70]] },
  { name: 'Tostada con tomate y aceite', items: [['Pan de barra', 70], ['Tomate', 80], ['Aceite de oliva', 8]] },
  { name: 'Tostada de tomate y jamón', items: [['Pan de barra', 70], ['Tomate', 60], ['Jamón curado (tipo serrano)', 25], ['Aceite de oliva', 5]] },
  { name: 'Tortilla francesa con queso', items: [['Huevo entero', 110], ['Queso emmental', 20], ['Aceite de oliva', 5]] },
  { name: 'Patata con huevo y pimentón', items: [['Patata, cocida', 220], ['Huevo cocido', 55], ['Aceite de oliva', 5]] },
  { name: 'Lentejas con chorizo', items: [['Lentejas, cocidas', 180], ['Chorizo', 30], ['Zanahoria, cruda', 40], ['Cebolla, cruda', 30], ['Aceite de oliva', 5]] },
  { name: 'Ensalada de garbanzos y atún', items: [['Garbanzos en bote, escurridos', 150], ['Atún en lata al natural, escurrido', 70], ['Tomate', 100], ['Cebolla, cruda', 20], ['Aceite de oliva', 5]] },
  { name: 'Pasta con atún', items: [['Pasta, cocida', 180], ['Atún en lata al natural, escurrido', 80], ['Salsa de tomate', 80], ['Aceite de oliva', 5]] },
  { name: 'Cuscús con verduras y garbanzos', items: [['Cuscús, cocido', 160], ['Garbanzos, cocidos', 80], ['Calabacín, crudo', 60], ['Zanahoria, cruda', 40], ['Aceite de oliva', 5]] },
  { name: 'Quinoa con salmón', items: [['Quinoa, cocida', 150], ['Salmón, crudo', 130], ['Espinacas, crudas', 40], ['Aceite de oliva', 5]] },
  { name: 'Burrito de pollo y alubias', items: [['Tortilla de trigo (wrap)', 60], ['Pechuga de pollo, asada', 90], ['Alubias negras, cocidas', 70], ['Tomate', 40], ['Lechuga romana', 25]] },
  { name: 'Bocadillo de tortilla', items: [['Pan de barra', 80], ['Huevo entero', 110], ['Aceite de oliva', 5]] },
  { name: 'Guisantes con jamón', items: [['Guisantes congelados', 180], ['Jamón curado (tipo serrano)', 30], ['Cebolla, cruda', 25], ['Aceite de oliva', 5]] },
  { name: 'Ensalada de tomate y mozzarella', items: [['Tomate', 180], ['Mozzarella', 80], ['Aceite de oliva', 5]] },
  { name: 'Tortitas de avena y plátano', items: [['Copos de avena', 40], ['Huevo entero', 55], ['Plátano', 80]] },
  { name: 'Tostada de hummus y tomate', items: [['Pan integral', 60], ['Hummus', 45], ['Tomate', 60]] },
  { name: 'Ensalada de pasta mediterránea', items: [['Pasta, cocida', 150], ['Atún en lata al natural, escurrido', 50], ['Tomate', 70], ['Aceitunas', 15], ['Aceite de oliva', 5]] },
  { name: 'Arroz con huevo y verduras', items: [['Arroz blanco, cocido', 180], ['Huevo entero', 55], ['Guisantes congelados', 50], ['Zanahoria, cruda', 40], ['Salsa de soja', 5], ['Aceite de oliva', 5]] },
];

// Busca el ingrediente por su nombre exacto en la lista básica (no en «Mis alimentos»,
// para que un alimento propio con nombre parecido no sustituya al de la receta).
function preparedFood(name) {
  const row = (window.FOODS_ES || []).find(r => r[1] === name);
  return row ? Foods.search(row[1], { limit: 60 }).find(f => f.key === 'u:' + row[0]) : null;
}
// Añade los ingredientes de un plato a la opción. Devuelve true si se añadió.
async function addPreparedMeal(opt) {
  const recipes = window.PREPARED_MEALS;
  const name = await actionSheet('Platos preparados', recipes.map(r => ({ label: r.name, sub: `${r.items.length} ingredientes`, value: r.name })));
  const recipe = recipes.find(r => r.name === name);
  if (!recipe) return false;
  const foods = recipe.items.map(([food]) => preparedFood(food));
  const missing = recipe.items.filter((_, i) => !foods[i]).map(([food]) => food);
  if (missing.length) { toast(`No encuentro en la base: ${missing.join(', ')}`); return false; }
  opt.items.push(...foods.map((f, i) => ({ id: uid(), key: f.key, name: f.name, qty: recipe.items[i][1], unit: 'g', per100: { ...f.per100 }, portions: f.portions || [] })));
  toast('Plato añadido; puedes ajustar cada ingrediente');
  return true;
}
