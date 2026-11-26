import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../weight-xlsx.js', import.meta.url), 'utf8');
async function workbook(entries) {
  const window = {};
  vm.runInNewContext(source, { window, Blob, TextEncoder });
  return new Uint8Array(await window.createWeightWorkbook(entries).arrayBuffer());
}

test('genera un XLSX con hoja de pesos y gráfico', async () => {
  const bytes = await workbook([{ date: '2026-01-01', kg: 80.5 }, { date: '2026-01-02', kg: 80 }]);
  const zipText = new TextDecoder().decode(bytes);
  assert.deepEqual([...bytes.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  assert.match(zipText, /xl\/charts\/chart1\.xml/);
  assert.match(zipText, /80\.5/);
  assert.match(zipText, /Progreso de peso/);
});

test('escapa valores de fecha al crear la hoja', async () => {
  const bytes = await workbook([{ date: '<test&"', kg: 70 }]);
  assert.match(new TextDecoder().decode(bytes), /&lt;test&amp;&quot;/);
});
