// Simula la selección USDA para detectar errores antes de que se regenere la lista básica.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const [source, database] = await Promise.all([
  readFile(new URL('../tools/foods-es.txt', import.meta.url), 'utf8'),
  readFile(new URL('../foods-usda.js', import.meta.url), 'utf8'),
]);
const context = vm.createContext({ window: {} });
vm.runInContext(database, context);
const foods = context.window.FOODS_USDA;
const byId = new Map(foods.map(food => [food[0], food]));
const rows = source.split(/\r?\n/).filter(line => line.trim() && !line.startsWith('#')).map(line => {
  const [name, , raw] = line.split('|').map(value => value.trim());
  const spec = raw.split(';').map(value => value.trim().toLowerCase()).filter(Boolean);
  if (/^\d{5}$/.test(raw)) return { name, id: byId.has(raw) ? raw : null };
  const must = spec.filter(value => !value.startsWith('!'));
  const forbidden = spec.filter(value => value.startsWith('!')).map(value => value.slice(1));
  const found = foods.filter(food => must.every(word => food[1].toLowerCase().includes(word))
    && !forbidden.some(word => food[1].toLowerCase().includes(word)))
    .sort((a, b) => a[1].length - b[1].length)[0];
  return { name, id: found && found[0] };
});

test('la lista completa selecciona un alimento USDA por cada nombre', () => {
  assert.deepEqual(rows.filter(row => !row.id).map(row => row.name), []);
});

test('ningún alimento de la lista selecciona dos veces el mismo registro USDA', () => {
  const ids = rows.map(row => row.id).filter(Boolean);
  assert.equal(new Set(ids).size, ids.length);
});
