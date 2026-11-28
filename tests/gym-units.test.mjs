// Los valores editados convierten de vuelta a la unidad métrica canónica.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../gym-units.js', import.meta.url), 'utf8');
const context = vm.createContext({ window: {}, document: { querySelector: () => null }, S: {},
  fmtN: value => String(Math.round(value * 100) / 100), exById: new Map([['run', { muscle: 'Cardio', name: 'Correr' }]]),
  renderGymSettings() {}, backupData: () => ({ settings: {} }), gymImportBackup: async () => {}, saveSettings: async () => {} });
vm.runInContext(source, context);
const units = context.window.GymUnits;

test('convierte cargas entre kg y lb sin cambiar el valor interno', () => {
  context.S.gymWeightUnit = 'lb';
  assert.equal(units.unitFor('weight'), 'lb');
  assert.equal(units.formatWeight(100), '220.46');
  assert.ok(Math.abs(units.parseWeight('220,46') - 100) < 0.01);
});

test('convierte distancias entre km y mi y minutos a segundos', () => {
  context.S.gymDistanceUnit = 'mi';
  assert.equal(units.formatDistance(5), '3.11');
  assert.ok(Math.abs(units.parseDistance('3,11') - 5) < 0.02);
  assert.equal(units.parseDuration('1,5'), 90);
});

test('reconoce cardio sin depender de red ni de una base externa', () => {
  assert.equal(units.isDistanceExercise('run'), true);
  assert.equal(units.isDistanceExercise('unknown'), false);
});
