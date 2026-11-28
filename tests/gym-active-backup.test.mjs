// Simula las copias para comprobar recuperación segura de una sesión interrumpida.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../gym-active-backup.js', import.meta.url), 'utf8');
const active = { id: 'active-1', title: 'Rutina A', start: 1000, exercises: [{ exId: 'ex-1', sets: [{ kg: 20, reps: 8 }] }] };

function setup(initialActive = null) {
  const writes = [], restoredBars = [];
  const context = vm.createContext({
    window: {}, G: { active: initialActive, exercises: [{ id: 'ex-1' }], routines: [], workouts: [] },
    gymBackupData: () => ({ exercises: [{ id: 'ex-1' }], routines: [], workouts: [] }),
    gymImportBackup: async () => {}, DB: { putKey: async (...args) => writes.push(args) },
    renderActiveBar: () => restoredBars.push(true),
  });
  vm.runInContext(source, context);
  return { context, writes, restoredBars };
}

test('incluye una copia aislada del entreno activo', () => {
  const { context } = setup(active);
  const backup = vm.runInContext('gymBackupData()', context);
  assert.deepEqual(JSON.parse(JSON.stringify(backup.activeWorkout)), active);
  assert.notEqual(backup.activeWorkout, active);
});

test('restaura un entreno válido si no hay otro abierto', async () => {
  const state = setup();
  await vm.runInContext('gymImportBackup({ activeWorkout: incoming })', Object.assign(state.context, { incoming: active }));
  assert.equal(state.context.G.active.id, 'active-1');
  assert.equal(state.writes[0][0], 'active');
  assert.equal(state.restoredBars.length, 1);
});

test('conserva el entreno local si la copia trae otra sesión', async () => {
  const local = { ...active, id: 'local-2' };
  const state = setup(local);
  await vm.runInContext('gymImportBackup({ activeWorkout: incoming })', Object.assign(state.context, { incoming: active }));
  assert.equal(state.context.G.active.id, 'local-2');
  assert.equal(state.writes.length, 0);
});

test('rechaza una sesión mal formada o con ejercicios desconocidos', async () => {
  const malformed = setup();
  await vm.runInContext('gymImportBackup({ activeWorkout: { id: 3 } })', malformed.context);
  assert.equal(malformed.context.G.active, null);
  const unknown = setup();
  const other = { ...active, exercises: [{ exId: 'missing', sets: [] }] };
  await vm.runInContext('gymImportBackup({ activeWorkout: incoming })', Object.assign(unknown.context, { incoming: other }));
  assert.equal(unknown.context.G.active, null);
});
