// Los avisos positivos pueden desactivarse sin tocar las demás funciones.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../gym-motivation.js', import.meta.url), 'utf8');
const calls = [];
const control = { checked: true, addEventListener: (name, fn) => { control.change = fn; } };
const context = vm.createContext({ window: {}, document: { querySelector: () => control }, S: {},
  weightSavedToast: () => calls.push('weight'), livePR: () => calls.push('record'), renderGymSettings() {}, saveSettings: async () => {}, toast() {} });
vm.runInContext(source, context);

test('por defecto conserva las celebraciones existentes y permite desactivarlas', async () => {
  context.weightSavedToast(); context.livePR();
  assert.deepEqual(calls, ['weight', 'record']);
  control.checked = false;
  await control.change();
  context.weightSavedToast(); context.livePR();
  assert.deepEqual(calls, ['weight', 'record']);
  assert.equal(context.S.motivation, false);
});
