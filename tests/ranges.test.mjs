// Tests de los periodos del gráfico. Ejecutar con: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const R = createRequire(import.meta.url)('../ranges.js');

test('días de cada periodo', () => {
  assert.equal(R.presetDays({ n: 1, u: 'w' }), 7);
  assert.equal(R.presetDays({ n: 1, u: 'm' }), 30);
  assert.equal(R.presetDays({ n: 3, u: 'm' }), 91);
  assert.equal(R.presetDays({ n: 6, u: 'm' }), 183);
  assert.equal(R.presetDays({ n: 1, u: 'y' }), 365);
  assert.equal(R.presetDays({ n: 10, u: 'd' }), 10);
});
test('nombre de cada botón', () => {
  assert.equal(R.presetLabel({ n: 1, u: 'w' }), 'Semana');
  assert.equal(R.presetLabel({ n: 1, u: 'm' }), 'Mes');
  assert.equal(R.presetLabel({ n: 3, u: 'm' }), '3M');
  assert.equal(R.presetLabel({ n: 2, u: 'w' }), '2S');
  assert.equal(R.presetLabel({ n: 1, u: 'y' }), 'Año');
  assert.equal(R.presetLabel({ n: 45, u: 'd' }), '45D');
  assert.equal(R.presetLabel({ n: 1, u: 'm' }, true), '1M');
});
test('por defecto: Semana, Mes y 3M en el pequeño; 1M, 3M y 6M en pantalla completa', () => {
  const d = R.normalizePresets(null);
  assert.deepEqual(d.small.map(p => R.presetLabel(p)), ['Semana', 'Mes', '3M']);
  assert.deepEqual(d.full.map(p => R.presetLabel(p, true)), ['1M', '3M', '6M']);
});
test('configuración inválida → vuelve a los de siempre, sin tocar el otro gráfico', () => {
  const mine = { small: [{ n: 2, u: 'w' }, { n: 2, u: 'm' }, { n: 1, u: 'y' }], full: [{ n: 0, u: 'm' }, { n: 3, u: 'm' }, { n: 6, u: 'm' }] };
  const r = R.normalizePresets(mine);
  assert.deepEqual(r.small, mine.small);
  assert.deepEqual(r.full, R.DEFAULTS.full);
  assert.deepEqual(R.normalizePresets({ small: [{ n: 1, u: 'x' }] }).small, R.DEFAULTS.small);
  assert.equal(R.validPreset({ n: 1.5, u: 'm' }), false);
  assert.equal(R.validPreset({ n: 100, u: 'd' }), false);
});
test('el botón elegido en versiones anteriores se conserva', () => {
  assert.equal(R.migrateRange('1w'), 0);
  assert.equal(R.migrateRange('1m'), 1);
  assert.equal(R.migrateRange('3m'), 2);
  assert.equal(R.migrateRange('6m'), 2);
  assert.equal(R.migrateRange('all'), 'all');
  assert.equal(R.migrateRange(1), 1);
  assert.equal(R.migrateRange(undefined), 2);
});
