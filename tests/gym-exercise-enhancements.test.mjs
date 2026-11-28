// Comprueba búsqueda segura, filtro por favoritos, músculo y equipamiento.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../gym-exercise-enhancements.js', import.meta.url), 'utf8');
const context = vm.createContext({ window: {}, document: { querySelector: () => null, addEventListener() {} } });
vm.runInContext(source, context);
const matches = context.window.GymExerciseTools.matches;
const exercise = { name: 'Press banca', muscle: 'Pecho', favorite: true, guide: { equipment: 'Barra' } };

test('encuentra por nombre y grupo muscular ignorando mayúsculas y acentos', () => {
  assert.equal(matches(exercise, 'PECHO'), true);
  assert.equal(matches(exercise, 'bánca'), true);
  assert.equal(matches(exercise, 'remo'), false);
});

test('aplica los filtros de favorito, músculo y equipamiento', () => {
  assert.equal(matches(exercise, '', { favorite: true, muscle: 'Pecho', equipment: 'Barra' }), true);
  assert.equal(matches(exercise, '', { favorite: true, muscle: 'Espalda' }), false);
  assert.equal(matches({ ...exercise, favorite: false }, '', { favorite: true }), false);
  assert.equal(matches(exercise, '', { equipment: 'Polea' }), false);
});
