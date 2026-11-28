// La carga incremental no pierde sesiones ni impone un total máximo.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../gym-exercise-history.js', import.meta.url), 'utf8');
const context = vm.createContext({ window: {}, document: { addEventListener() {}, querySelectorAll: () => [] },
  openExercise() {}, exHist: new Map() });
vm.runInContext(source, context);
const tools = context.window.GymExerciseHistory;

test('recorre listas grandes en tandas contiguas y completas', () => {
  const sessions = Array.from({ length: 123 }, (_, i) => i);
  assert.deepEqual(Array.from(tools.nextBatch(sessions, 0)), Array.from({ length: 40 }, (_, i) => i));
  assert.deepEqual(Array.from(tools.nextBatch(sessions, 40)), Array.from({ length: 40 }, (_, i) => i + 40));
  assert.deepEqual(Array.from(tools.nextBatch(sessions, 120)), [120, 121, 122]);
});
