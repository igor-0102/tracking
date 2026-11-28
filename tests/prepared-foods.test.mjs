// Asegura que las recetas puedan usar solo alimentos de la base local generada.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const foodsSource = await readFile(new URL('../foods-db.js', import.meta.url), 'utf8');
const recipesSource = await readFile(new URL('../prepared-foods.js', import.meta.url), 'utf8');
const context = vm.createContext({ window: {} });
vm.runInContext(foodsSource, context);
vm.runInContext(recipesSource, context);
const meals = context.window.PREPARED_MEALS;
const names = new Set(context.window.FOODS_ES.map(row => row[1]));

test('hay al menos 25 platos preparados locales', () => {
  assert.ok(meals.length >= 25);
  assert.equal(new Set(meals.map(meal => meal.name)).size, meals.length);
});

test('todos los ingredientes de los platos existen por nombre exacto en foods-db.js', () => {
  const missing = meals.flatMap(meal => meal.items.filter(([name]) => !names.has(name)).map(([name]) => `${meal.name}: ${name}`));
  assert.equal(missing.length, 0, missing.join('\n'));
});
