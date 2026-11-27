/* Platos preparados sencillos; cada ingrediente usa la base nutricional local USDA. */
'use strict';

window.PREPARED_MEALS = [
  { name: 'Pollo con arroz', items: [['Pechuga de pollo, asada', 150], ['Arroz blanco, cocido', 180], ['Aceite de oliva', 5]] },
  { name: 'Lentejas con verduras', items: [['Lentejas, cocidas', 200], ['Zanahoria, cruda', 50], ['Cebolla, cruda', 35], ['Aceite de oliva', 5]] },
  { name: 'Tortilla de patata', items: [['Huevo entero', 110], ['Patata, cocida', 180], ['Cebolla, cruda', 20], ['Aceite de oliva', 8]] },
  { name: 'Ensalada de atún', items: [['Lechuga romana', 70], ['Tomate', 120], ['Atún en lata al natural, escurrido', 80], ['Aceite de oliva', 8]] },
  { name: 'Pasta con tomate y pollo', items: [['Pasta, cocida', 180], ['Pechuga de pollo, asada', 100], ['Salsa de tomate', 80], ['Aceite de oliva', 5]] },
  { name: 'Gazpacho', items: [['Tomate', 250], ['Pepino', 80], ['Pimiento verde, crudo', 35], ['Cebolla, cruda', 15], ['Aceite de oliva', 8]] },
  { name: 'Merluza con patata', items: [['Merluza o pescadilla, cruda', 180], ['Patata, cocida', 180], ['Aceite de oliva', 8]] },
  { name: 'Macarrones con tomate', items: [['Pasta, cocida', 200], ['Salsa de tomate', 100], ['Aceite de oliva', 5], ['Queso curado (tipo parmesano)', 10]] },
  { name: 'Paella de pollo y gambas', items: [['Arroz blanco, cocido', 200], ['Pechuga de pollo, asada', 80], ['Gambas o langostinos, crudos', 60], ['Guisantes congelados', 30], ['Pimiento rojo, crudo', 30], ['Aceite de oliva', 5]] },
  { name: 'Cocido de garbanzos', items: [['Garbanzos, cocidos', 150], ['Repollo, crudo', 60], ['Zanahoria, cruda', 40], ['Patata, cocida', 120], ['Pechuga de pollo, asada', 80], ['Chorizo', 20]] },
  { name: 'Salmorejo con huevo y jamón', items: [['Tomate', 250], ['Pan de barra', 40], ['Aceite de oliva', 10], ['Huevo cocido', 50], ['Jamón curado (tipo serrano)', 20]] },
  { name: 'Pisto manchego', items: [['Tomate', 150], ['Calabacín, crudo', 100], ['Berenjena, cruda', 70], ['Pimiento verde, crudo', 50], ['Cebolla, cruda', 40], ['Aceite de oliva', 8]] },
  { name: 'Revuelto de champiñones y jamón', items: [['Champiñones, crudos', 150], ['Huevo entero', 110], ['Jamón curado (tipo serrano)', 20], ['Aceite de oliva', 5]] },
  { name: 'Pollo a la plancha con ensalada', items: [['Pechuga de pollo, asada', 130], ['Lechuga romana', 80], ['Tomate', 100], ['Aceite de oliva', 8]] },
  { name: 'Yogur con avena y fruta', items: [['Yogur natural entero', 125], ['Copos de avena', 35], ['Plátano', 80], ['Manzana', 80]] },
  { name: 'Tostada de tomate y jamón', items: [['Pan de barra', 60], ['Tomate', 60], ['Aceite de oliva', 5], ['Jamón curado (tipo serrano)', 25]] },
  { name: 'Ensaladilla rusa', items: [['Patata, cocida', 160], ['Zanahoria, cruda', 40], ['Guisantes congelados', 30], ['Huevo cocido', 50], ['Mayonesa', 15]] },
  { name: 'Merluza con judías verdes', items: [['Merluza o pescadilla, cruda', 180], ['Judías verdes, crudas', 150], ['Aceite de oliva', 8]] },
  { name: 'Garbanzos con espinacas', items: [['Garbanzos, cocidos', 160], ['Espinacas, crudas', 100], ['Tomate triturado en lata', 80], ['Aceite de oliva', 5]] },
  { name: 'Alubias blancas con chorizo', items: [['Alubias blancas, cocidas', 180], ['Chorizo', 30], ['Cebolla, cruda', 30], ['Tomate triturado en lata', 60]] },
  { name: 'Tortilla francesa con jamón', items: [['Huevo entero', 110], ['Jamón cocido (york)', 30], ['Aceite de oliva', 4]] },
  { name: 'Salmón con cuscús', items: [['Salmón, crudo', 150], ['Cuscús, cocido', 150], ['Aceite de oliva', 5]] },
  { name: 'Bocadillo de jamón y queso', items: [['Pan de barra', 90], ['Jamón cocido (york)', 30], ['Queso curado (tipo parmesano)', 15], ['Tomate', 40]] },
  { name: 'Wrap de atún', items: [['Tortilla de trigo (wrap)', 60], ['Atún en lata al natural, escurrido', 80], ['Tomate', 40], ['Lechuga romana', 30], ['Mayonesa', 10]] },
  { name: 'Arroz con ternera y verduras', items: [['Arroz blanco, cocido', 180], ['Carne picada de ternera (5 % grasa), cruda', 100], ['Pimiento verde, crudo', 50], ['Salsa de tomate', 60], ['Aceite de oliva', 5]] },
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
