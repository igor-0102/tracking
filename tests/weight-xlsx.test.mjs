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

function unzipStored(bytes) {
  const files = new Map(), view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength), decode = new TextDecoder();
  let offset = 0;
  while (offset + 30 < bytes.length && view.getUint32(offset, true) === 0x04034b50) {
    const size = view.getUint32(offset + 18, true), nameSize = view.getUint16(offset + 26, true), extraSize = view.getUint16(offset + 28, true);
    const name = decode.decode(bytes.slice(offset + 30, offset + 30 + nameSize));
    const start = offset + 30 + nameSize + extraSize;
    files.set(name, decode.decode(bytes.slice(start, start + size)));
    offset = start + size;
  }
  return files;
}

test('genera un XLSX con hoja de pesos y gráfico', async () => {
  const bytes = await workbook([{ date: '2026-01-01', kg: 80.5 }, { date: '2026-01-02', kg: 80 }]);
  const zipText = new TextDecoder().decode(bytes);
  assert.deepEqual([...bytes.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  assert.match(zipText, /xl\/charts\/chart1\.xml/);
  assert.match(zipText, /80\.5/);
  assert.match(zipText, /Progreso de peso/);
});

test('la hoja exportada contiene solo fecha y peso y vincula el gráfico a ambas columnas', async () => {
  const files = unzipStored(await workbook([{ date: '2026-01-01', kg: 80.5 }]));
  const sheet = files.get('xl/worksheets/sheet1.xml');
  assert.equal([...sheet.matchAll(/<c r="[A-Z]+\d+"/g)].length, 4);
  assert.match(sheet, /<drawing r:id="rId1"\/>/);
  assert.match(files.get('xl/charts/chart1.xml'), /'Pesos'!\$A\$2:\$A\$2/);
  assert.match(files.get('xl/charts/chart1.xml'), /'Pesos'!\$B\$2:\$B\$2/);
  assert.match(files.get('[Content_Types].xml'), /Extension="rels" ContentType="application\/vnd\.openxmlformats-package\.relationships\+xml"/);
});

test('escapa valores de fecha al crear la hoja', async () => {
  const bytes = await workbook([{ date: '<test&"', kg: 70 }]);
  assert.match(new TextDecoder().decode(bytes), /&lt;test&amp;&quot;/);
});
