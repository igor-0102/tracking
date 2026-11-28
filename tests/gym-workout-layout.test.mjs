// Comprueba que las preferencias oculten solo la presentación, no los datos guardados.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../gym-workout-layout.js', import.meta.url), 'utf8');
const context = vm.createContext({ window: {}, document: { querySelector: () => null }, S: {},
  wkPage: null, renderWk() {}, renderGymSettings() {}, saveSettings: async () => {} });
vm.runInContext(source, context);

test('por defecto la pantalla muestra los datos útiles existentes', () => {
  assert.deepEqual({ ...context.window.GymWorkoutLayout.preferences({}) }, { previous: true, suggestions: true, notes: true });
});

test('las preferencias permiten ocultar opciones y mantienen valores activados por defecto', () => {
  const result = context.window.GymWorkoutLayout.preferences({ showPreviousSets: false, showWorkoutNotes: false });
  assert.deepEqual({ ...result }, { previous: false, suggestions: true, notes: false });
});
