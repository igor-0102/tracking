// Claude: valida búsqueda local, sin acentos y sin depender de la red.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const catalog = require('../exercise-catalog.js');

test('el catálogo local incluye una base amplia sin depender de red', () => {
  assert.ok(catalog.exercises.length >= 80);
  assert.equal(new Set(catalog.exercises.map(item => item.id)).size, catalog.exercises.length);
});

test('buscar press devuelve variantes de barra, mancuerna y máquina', () => {
  const results = catalog.search('press');
  assert.ok(results.length >= 15);
  assert.ok(results.some(item => /barra/i.test(item.name)));
  assert.ok(results.some(item => /mancuerna/i.test(item.name)));
  assert.ok(results.some(item => /máquina/i.test(item.name)));
});

test('la búsqueda incremental y sin tildes encuentra sentadilla y sus variantes', () => {
  assert.ok(catalog.search('s').length > catalog.search('se').length);
  assert.ok(catalog.search('sentadilla').some(item => item.name === 'Sentadilla con barra'));
  assert.ok(catalog.search('bulgara').some(item => item.id === 'sentadilla-bulgara'));
});

test('se puede filtrar por músculo, material y alias en inglés', () => {
  assert.ok(catalog.search('row', { muscle: 'Espalda' }).some(item => item.id === 'remo-barra'));
  assert.ok(catalog.search('', { equipment: 'Máquina' }).every(item => item.equipment === 'Máquina'));
  const chestPresses = catalog.search('press', { muscle: 'Pecho' });
  assert.ok(chestPresses.length > 0);
  assert.ok(chestPresses.every(item => item.muscle === 'Pecho'));
});
