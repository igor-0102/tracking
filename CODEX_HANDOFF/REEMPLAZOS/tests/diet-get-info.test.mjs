// Comprueba que la ayuda describe el GET y no presenta el 1 % como garantía hormonal.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../diet-get-info.js', import.meta.url), 'utf8');
const window = {};
vm.runInNewContext(source, { window, document: { querySelector: () => null } });

test('el texto explica el ajuste y limita con cautela la referencia del 1 %', () => {
  assert.match(window.DietGetInfo.message, /suma o resta calorías al GET/);
  assert.match(window.DietGetInfo.message, /no como límite universal/);
  assert.match(window.DietGetInfo.message, /no garantiza evitar daño hormonal/);
  assert.match(window.DietGetInfo.message, /disponibilidad energética/);
});
