// Comprueba los filtros del historial con fechas locales y nombres de ejercicio.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../gym-history-tools.js', import.meta.url), 'utf8');
const root = { addEventListener() {} };
const context = vm.createContext({ window: {}, document: { querySelector: () => root }, G: { workouts: [], exercises: [] },
  renderGymHistory() {}, histLimit: 30, GymPortability: { exportWorkouts() {} }, localISO: () => '2026-11-28', esc: value => value });
vm.runInContext(source, context);
const matches = context.window.GymHistoryTools.matchesWorkout;
const exercises = [{ id: 'e1', name: 'Press banca' }, { id: 'e2', name: 'Remo sentado' }];
const workout = { title: 'Día A', start: 1795860000000, exercises: [{ exId: 'e2' }] };

test('busca entrenos por ejercicio aunque no aparezca en el resumen de cuatro ejercicios', () => {
  assert.equal(matches(workout, 'REMO sentado', '', '', exercises), true);
  assert.equal(matches(workout, 'sentadilla', '', '', exercises), false);
});

test('aplica intervalos de fechas inclusivos y tolera búsquedas sin acentos', () => {
  assert.equal(matches(workout, 'dia a', '2026-11-28', '2026-11-28', exercises), true);
  assert.equal(matches(workout, '', '2026-11-29', '', exercises), false);
  assert.equal(matches(workout, '', '', '2026-11-27', exercises), false);
});
