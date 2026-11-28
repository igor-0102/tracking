// Evita comparaciones entre fechas incoherentes y calcula deltas solo en series efectivas.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../gym-summary-comparison.js', import.meta.url), 'utf8');
const context = vm.createContext({ window: {}, showSummary() {}, document: { querySelectorAll: () => [] }, G: { workouts: [] }, esc: value => value });
vm.runInContext(source, context);
const tools = context.window.GymSummaryComparison;
const prior = { id: 'old', title: 'Día A', start: 1000, end: 61000, exercises: [{ exId: 'e1', sets: [{ kg: 40, reps: 8 }, { kg: 0, reps: 10, type: 'warmup' }] }] };
const current = { id: 'new', title: 'Día A', start: 70000, end: 190000, exercises: [{ exId: 'e1', sets: [{ kg: 45, reps: 8 }, { kg: 42, reps: 8 }] }] };

test('compara volumen, series y duración con la sesión relacionada anterior', () => {
  const result = tools.comparison(current, [current, prior]);
  assert.equal(result.previous.id, 'old');
  assert.equal(result.volumeDelta, 376);
  assert.equal(result.setDelta, 1);
  assert.equal(result.durationDelta, 60000);
});

test('ignora sesiones posteriores y no inventa una referencia cuando no la hay', () => {
  assert.equal(tools.comparison(current, [{ ...prior, start: 80000 }]), null);
});

test('no considera comparable una sesión distinta por compartir solo un ejercicio', () => {
  const mixed = { ...prior, title: 'Día B', exercises: [...prior.exercises, { exId: 'e2', sets: [{ kg: 10, reps: 10 }] }] };
  assert.equal(tools.comparison(current, [mixed]), null);
});
