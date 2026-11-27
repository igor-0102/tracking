import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../exercise-guide.js', import.meta.url), 'utf8');
function guideAPI() {
  const window = {};
  vm.runInNewContext(source, { window });
  return window;
}
function render(exercise) { return guideAPI().exerciseGuideHTML(exercise); }

test('el catálogo local incluye al menos 40 ejercicios completos y sin dependencias', () => {
  const { exerciseGuideCatalog: catalog } = guideAPI();
  assert.ok(catalog.length >= 40);
  assert.ok(catalog.every(x => x.name && x.aliases.length && x.setup && x.move && x.error));
  assert.ok(catalog.some(x => x.aliases.includes('bench press')));
  assert.ok(catalog.some(x => x.aliases.includes('press banca')));
  assert.doesNotMatch(source, /https?:\/\//);
});

test('cada alias del catálogo encuentra su grupo principal', () => {
  const { exerciseGuideCatalog: catalog, exerciseGuideHTML } = guideAPI();
  for (const item of catalog) {
    for (const alias of item.aliases) {
      assert.match(exerciseGuideHTML({ name: alias }), new RegExp(`class="muscle ${item.primary} primary"`), alias);
    }
  }
});

test('la guía resalta músculos principales y secundarios para un ejercicio específico', () => {
  const html = render({ name: 'Press banca', muscle: 'Pecho' });
  assert.match(html, /class="muscle chest primary"/);
  assert.match(html, /class="muscle triceps secondary"/);
  assert.match(html, /Colocación:/);
  assert.match(html, /Movimiento:/);
  assert.match(html, /Evita:/);
  assert.match(html, /sin rebotar/);
});

test('reconoce variantes en español e inglés y distingue ejercicios parecidos', () => {
  const incline = render({ name: 'Press banca inclinado con mancuernas' });
  const legCurl = render({ name: 'Seated leg curl' });
  assert.match(incline, /Deltoides anterior/);
  assert.match(legCurl, /Isquiotibiales/);
  assert.doesNotMatch(legCurl, /Cuádriceps · también/);
});

test('presenta mapas musculares frontal y posterior con leyenda', () => {
  const html = render({ name: 'Remo sentado en polea' });
  assert.match(html, /Mapa muscular de frente/);
  assert.match(html, /Mapa muscular de espaldas/);
  assert.match(html, /Principal/);
  assert.match(html, /Secundario/);
  assert.match(html, /class="muscle lats primary"/);
  assert.match(html, /class="muscle biceps secondary"/);
});

test('escapa el grupo muscular importado y conserva un fallback para nombres desconocidos', () => {
  const html = render({ name: 'Ejercicio importado', muscle: '<img src=x onerror=alert(1)>' });
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img/);
  assert.match(render({ name: 'Remo unilateral raro', muscle: 'Espalda' }), /Movimiento:/);
});

test('grupos musculares raros o heredados no rompen la guía', () => {
  for (const muscle of ['constructor', 'toString', '__proto__', '(', '[']) {
    assert.match(render({ name: 'Ejercicio raro', muscle }), /Cómo hacerlo/);
  }
});
