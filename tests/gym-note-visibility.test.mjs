// Regresión de notas: ocultarlas en el editor nunca debe borrar su contenido persistido.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../gym-note-visibility.js', import.meta.url), 'utf8');
const context = vm.createContext({ window: {} });
vm.runInContext(source, context);
const notes = context.window.GymNotes;

test('las notas antiguas siguen visibles y las vacías permanecen ocultas', () => {
  assert.equal(notes.isVisible({ notes: 'Ajustar el asiento' }), true);
  assert.equal(notes.isVisible({ notes: '' }), false);
});

test('ocultar y volver a mostrar conserva el texto de la nota', () => {
  const exercise = { notes: 'No bloquear los codos' };
  assert.equal(notes.toggleVisibility(exercise), false);
  assert.equal(exercise.notes, 'No bloquear los codos');
  assert.equal(notes.isVisible(exercise), false);
  assert.equal(notes.toggleVisibility(exercise), true);
  assert.equal(exercise.notes, 'No bloquear los codos');
  assert.equal(notes.isVisible(exercise), true);
});

test('permite abrir una nota vacía y dejarla lista para editar', () => {
  const exercise = { notes: '' };
  assert.equal(notes.toggleVisibility(exercise), true);
  assert.equal(notes.isVisible(exercise), true);
});
