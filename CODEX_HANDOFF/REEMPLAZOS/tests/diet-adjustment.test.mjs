// Claude: comprueba conversiones GET, el ejemplo de déficit y los rangos de grasa.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const adjustment = require('../diet-adjustment.js');

test('convierte de porcentaje a kcal y de kcal a porcentaje con el mismo GET', () => {
  const difference = adjustment.caloriesForAdjustment(2400, -20);
  assert.equal(difference, -480);
  assert.equal(adjustment.percentForAdjustment(2400, difference), -20);
});

test('parsea decimales con coma y signos menos tipográficos', () => {
  assert.equal(adjustment.parseNumber('−800,5'), -800.5);
  assert.equal(adjustment.parseNumber('no es un número'), null);
});

test('convierte la recomendación de grasa de la OMS a g/kg para el perfil actual', () => {
  const range = adjustment.fatRangePerKg(2000, 80);
  assert.equal(range.min, 2000 * 0.15 / 9 / 80);
  assert.equal(range.max, 2000 * 0.30 / 9 / 80);
  assert.equal(adjustment.fatRangePerKg(0, 80), null);
});

test('el ejemplo solicitado de 80 kg calcula 0,8 kg por semana y 800 kcal al día', () => {
  assert.deepEqual(adjustment.aggressiveDeficitExample(80), {
    maxWeeklyLossKg: 0.8, weeklyDeficit: 5600, dailyDeficit: 800,
  });
});
