// Garantiza CSV de varias series y un resumen compartible sin notas privadas.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../gym-portability.js', import.meta.url), 'utf8');
const context = vm.createContext({ window: {}, document: { addEventListener() {} },
  showSummary() {}, renderDetail() {}, G: { workouts: [], exercises: [] } });
vm.runInContext(source, context);
const tools = context.window.GymPortability;
const exercises = [{ id: 'e1', name: 'Press "banca"' }];
const workout = { id: 'w1', title: 'Día A; fuerza', start: 1795860000000, end: 1795863600000, notes: 'nota privada',
  exercises: [{ exId: 'e1', notes: 'otra nota privada', sets: [{ kg: 40, reps: 8 }, { kg: 42.5, reps: 6 }] }] };

test('el CSV usa una fila por serie, columnas separadas y escapa delimitadores', () => {
  const csv = tools.makeWorkoutCsv([workout], exercises);
  assert.match(csv, /"Fecha";"Entreno";"Ejercicio";"Serie";"Peso \(kg\)";"Repeticiones"/);
  assert.match(csv, /"Día A; fuerza"/);
  assert.match(csv, /"Press ""banca"""/);
  assert.equal(csv.split(/\r?\n/).length, 3);
});

test('la vista previa incluye el trabajo realizado y excluye todas las notas', () => {
  const text = tools.makeShareSummary(workout, exercises);
  assert.match(text, /Día A; fuerza/);
  assert.match(text, /Press "banca": 2 series/);
  assert.match(text, /Volumen: 575 kg/);
  assert.doesNotMatch(text, /nota privada/);
  assert.doesNotMatch(text, /otra nota privada/);
});

test('el CSV neutraliza nombres que una hoja de cálculo podría ejecutar como fórmula', () => {
  const unsafe = { ...workout, title: '=HYPERLINK("https://x")', exercises: [{ exId: 'bad', sets: [{ kg: 1, reps: 1 }] }] };
  const csv = tools.makeWorkoutCsv([unsafe], [{ id: 'bad', name: '+1+1' }]);
  assert.match(csv, /"'=HYPERLINK\(""https:\/\/x""\)"/);
  assert.match(csv, /"'\+1\+1"/);
});

test('al compartir en libras convierte el volumen una sola vez', () => {
  context.window.GymUnits = { unitFor: () => 'lb', formatWeight: value => String(Math.round(value * 2.2046226218)) };
  assert.match(tools.makeShareSummary(workout, exercises), /Volumen: 1268 lb/);
});
