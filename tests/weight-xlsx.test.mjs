import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Blob, Buffer } from 'node:buffer';

const source = await readFile(new URL('../weight-xlsx.js', import.meta.url), 'utf8');
const exportSource = await readFile(new URL('../weight-export.js', import.meta.url), 'utf8');
async function workbook(entries) {
  const window = {};
  vm.runInNewContext(source, { window, Blob, TextEncoder });
  return new Uint8Array(await window.createWeightWorkbook(entries).arrayBuffer());
}
function exportAPI(extra = {}) {
  const window = {};
  const listeners = {};
  const document = { addEventListener: (name, handler, capture) => { listeners[name] = { handler, capture }; } };
  vm.runInNewContext(source, { window, Blob, TextEncoder });
  vm.runInNewContext(exportSource, { window, document, ...extra });
  return { window, listeners };
}

test('genera un XLSX con hoja de pesos y gráfico', async () => {
  const bytes = await workbook([{ date: '2026-01-01', kg: 80.5 }, { date: '2026-01-02', kg: 80 }]);
  const zipText = new TextDecoder().decode(bytes);
  assert.deepEqual([...bytes.slice(0, 4)], [0x50, 0x4b, 0x03, 0x04]);
  assert.match(zipText, /xl\/charts\/chart1\.xml/);
  assert.match(zipText, /80\.5/);
  assert.match(zipText, /Progreso de peso/);
  assert.match(zipText, /<t>Fecha<\/t>/);
  assert.match(zipText, /<t>Peso \(kg\)<\/t>/);
  assert.match(zipText, /'Pesos'!\$A\$2:\$A\$3/);
  assert.match(zipText, /'Pesos'!\$B\$2:\$B\$3/);
});

test('escapa valores de fecha al crear la hoja', async () => {
  const bytes = await workbook([{ date: '<test&"', kg: 70 }]);
  assert.match(new TextDecoder().decode(bytes), /&lt;test&amp;&quot;/);
});

test('la exportación conserva solo fecha y peso válidos y los ordena por fecha', () => {
  const { window, listeners } = exportAPI();
  const rows = window.weightRowsForExport([
    { date: '2026-03-02', kg: 80 },
    { date: 'fecha inválida', kg: 81 },
    { date: '2026-03-01', kg: 80.5, note: 'se descarta' },
    { date: '2026-03-03', kg: NaN },
    { date: '2026-03-04', kg: -2 },
  ]);
  assert.deepEqual(JSON.parse(JSON.stringify(rows)), [
    { date: '2026-03-01', kg: 80.5 },
    { date: '2026-03-02', kg: 80 },
  ]);
  assert.equal(listeners.click.capture, true);
});

test('el botón Excel intercepta el clic y explica si no hay registros', () => {
  const messages = [];
  const { listeners } = exportAPI({ entries: [], toast: message => messages.push(message) });
  const event = {
    target: { closest: selector => selector === '[data-action="export-excel"]' ? {} : null },
    preventDefault() { this.prevented = true; },
    stopPropagation() { this.stopped = true; },
    stopImmediatePropagation() { this.immediate = true; },
  };
  listeners.click.handler(event);
  assert.equal(event.prevented && event.stopped && event.immediate, true);
  assert.deepEqual(messages, ['No hay pesos válidos que exportar']);
});

test('la exportación nativa guarda el XLSX en caché y abre el diálogo para compartirlo', async () => {
  class Reader {
    readAsDataURL(blob) {
      blob.arrayBuffer().then(bytes => {
        this.result = `data:application/zip;base64,${Buffer.from(bytes).toString('base64')}`;
        this.onload();
      });
    }
  }
  const calls = [], messages = [];
  const { listeners } = exportAPI({
    entries: [{ date: '2026-03-01', kg: 70 }],
    FileReader: Reader,
    isNative: () => true,
    todayISO: () => '2026-03-02',
    toast: message => messages.push(message),
    nativeCall: async (plugin, method, options) => {
      calls.push({ plugin, method, options });
      return method === 'writeFile' ? { uri: 'file://tracking-pesos.xlsx' } : {};
    },
  });
  const event = {
    target: { closest: () => ({}) },
    preventDefault() {}, stopPropagation() {}, stopImmediatePropagation() {},
  };
  listeners.click.handler(event);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(calls[0].method, 'writeFile');
  assert.equal(calls[0].options.path, 'tracking-pesos-2026-03-02.xlsx');
  assert.match(calls[0].options.data, /^UEs/);
  assert.equal(calls[1].method, 'share');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[1].options.files)), ['file://tracking-pesos.xlsx']);
  assert.deepEqual(messages, ['Excel exportado']);
});
