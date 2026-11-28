// Claude: prueba selección incremental, coincidencias y ejercicios propios.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const catalogSource = await readFile(new URL('../exercise-catalog.js', import.meta.url), 'utf8');
const pickerSource = await readFile(new URL('../gym-exercise-picker.js', import.meta.url), 'utf8');
const context = vm.createContext({ G: { exercises: [] }, exHist: new Map(), pickExercises() {} });
context.window = context;
vm.runInContext(catalogSource, context);
vm.runInContext(pickerSource, context);

test('el selector de rutinas queda conectado al catálogo al cargar sus módulos', () => {
  assert.equal(typeof context.pickExercises, 'function');
  assert.ok(context.window.GymExercisePicker.pickerItems('sentadilla').catalogRows.some(item => item.name === 'Sentadilla con barra'));
});

test('el selector muestra todas las variantes de press y filtra progresivamente sentadillas', () => {
  const press = context.window.GymExercisePicker.pickerItems('press').catalogRows;
  const s = context.window.GymExercisePicker.pickerItems('s').catalogRows;
  const se = context.window.GymExercisePicker.pickerItems('se').catalogRows;
  const squat = context.window.GymExercisePicker.pickerItems('sentadilla').catalogRows;
  assert.ok(press.length >= 15);
  assert.ok(s.length > se.length);
  assert.ok(squat.some(item => item.name === 'Sentadilla con barra'));
});
