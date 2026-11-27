// Simulación de integración: verifica que cada receta se resuelve con Foods.search y se añade a la opción.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const context = vm.createContext({ window: {} });
vm.runInContext(await read('../nutri.js'), context);
vm.runInContext(await read('../foods-db.js'), context);
vm.runInContext(await read('../foods.js'), context);
vm.runInContext(await read('../prepared-foods.js'), context);
const meals = context.window.PREPARED_MEALS;
const foods = new Set(context.window.FOODS_ES.map(row => row[1]));

test('hay 25 platos con nombres únicos', () => {
  assert.equal(meals.length, 25);
  assert.equal(new Set(meals.map(meal => meal.name)).size, meals.length);
});

test('todos los ingredientes existen en la lista básica y tienen cantidad por ración', () => {
  const missing = [];
  for (const meal of meals) for (const [name, grams] of meal.items) {
    if (!foods.has(name)) missing.push(`${meal.name}: ${name}`);
    assert.ok(Number.isFinite(grams) && grams > 0 && grams <= 1000, `${meal.name}: cantidad no válida para ${name}`);
  }
  assert.deepEqual(missing, []);
});

test('las 25 recetas se pueden añadir usando Foods.search sin perder ingredientes', async () => {
  let nextId = 0;
  context.toast = () => {};
  context.uid = () => `recipe-${++nextId}`;
  for (const meal of meals) {
    context.selectedMeal = meal.name;
    context.actionSheet = async (_title, options) => options.find(item => item.value === context.selectedMeal)?.value;
    context.simulatedOption = { items: [] };
    const added = await vm.runInContext('addPreparedMeal(simulatedOption)', context);
    const items = JSON.parse(JSON.stringify(context.simulatedOption.items));
    assert.equal(added, true, `${meal.name}: no se pudo resolver la receta`);
    assert.equal(items.length, meal.items.length, `${meal.name}: faltan ingredientes`);
    assert.ok(items.every(item => item.key.startsWith('u:') && item.qty > 0 && item.unit === 'g'), meal.name);
  }
});
