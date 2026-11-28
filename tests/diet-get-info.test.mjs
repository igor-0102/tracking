// Comprueba que la ayuda describe el GET y no presenta el 1 % como garantía hormonal.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../diet-get-info.js', import.meta.url), 'utf8');
const window = {};
vm.runInNewContext(source, { window, document: { querySelector: () => null } });

test('el texto contiene el ejemplo de 80 kg y aclara los límites de la regla energética', () => {
  assert.match(window.DietGetInfo.message, /suma o resta calorías al GET/);
  assert.match(window.DietGetInfo.message, /80 kg/);
  assert.match(window.DietGetInfo.message, /0,8 kg\/semana/);
  assert.match(window.DietGetInfo.message, /5600 kcal\/semana/);
  assert.match(window.DietGetInfo.message, /800 kcal\/día/);
  assert.match(window.DietGetInfo.message, /no es un límite universal ni garantiza evitar cambios hormonales/);
});
