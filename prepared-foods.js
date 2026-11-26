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
