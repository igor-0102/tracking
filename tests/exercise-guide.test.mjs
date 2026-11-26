import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../exercise-guide.js', import.meta.url), 'utf8');
function render(exercise) {
  const window = {};
  vm.runInNewContext(source, { window });
  return window.exerciseGuideHTML(exercise);
}

test('la guía resalta el grupo de un ejercicio conocido', () => {
  const html = render({ name: 'Press banca', muscle: 'Pecho' });
  assert.match(html, /muscle active chest/);
  assert.match(html, /Cómo hacerlo/);
  assert.match(html, /sin rebotar/);
});

test('la guía escapa el grupo muscular importado', () => {
  const html = render({ name: 'Ejercicio importado', muscle: '<img src=x onerror=alert(1)>' });
  assert.match(html, /&lt;img src=x onerror=alert\(1\)&gt;/);
  assert.doesNotMatch(html, /<img/);
});

test('espalda, tríceps y glúteos se muestran en la vista de espaldas (no se ilumina el pecho)', () => {
  const html = render({ name: 'Remo sentado con cable', muscle: 'Espalda' });
  assert.match(html, /muscle active back/);
  assert.match(html, /vista de espaldas/);
  assert.doesNotMatch(html, /muscle chest/);
  assert.match(render({ name: 'Press banca', muscle: 'Pecho' }), /muscle active chest/);
});

test('un grupo muscular con un nombre raro (de una copia importada) no rompe la guía', () => {
  for (const muscle of ['constructor', 'toString', '__proto__', '(', '[']) {
    const html = render({ name: 'Ejercicio raro', muscle });
    assert.match(html, /Cómo hacerlo/);
  }
});
