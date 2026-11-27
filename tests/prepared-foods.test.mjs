import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const read = path => readFile(new URL(path, import.meta.url), 'utf8');
const context = vm.createContext({ window: {} });
vm.runInContext(await read('../foods-db.js'), context);
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
