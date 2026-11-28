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
  assert.doesNotMatch(html, /muscle active chest/);
  assert.match(render({ name: 'Press banca', muscle: 'Pecho' }), /muscle active chest/);
});

test('un grupo muscular con un nombre raro (de una copia importada) no rompe la guía', () => {
  for (const muscle of ['constructor', 'toString', '__proto__', '(', '[']) {
    const html = render({ name: 'Ejercicio raro', muscle });
    assert.match(html, /Cómo hacerlo/);
  }
});

test('el catálogo local da instrucciones específicas y grupos secundarios para más de 35 ejercicios', () => {
  const window = {};
  vm.runInNewContext(source, { window });
  assert.ok(window.GymExerciseGuide.count >= 35);
  for (const name of ['Remo sentado con cable', 'Jalón al pecho', 'Sentadilla', 'Peso muerto rumano', 'Curl femoral', 'Extensión de pierna', 'Aducción de cadera', 'Elevaciones laterales', 'Press de hombros', 'Tríceps en polea']) {
    const guide = window.GymExerciseGuide.find(name);
    assert.ok(guide && guide.setup && guide.move && guide.error, `falta explicación propia: ${name}`);
  }
});

test('la guía distingue el músculo secundario en el mapa y escapa los campos propios', () => {
  const html = render({ id: 'mine', name: 'Press banca', muscle: 'Pecho', guide: { primary: true, setup: '<script>x</script>', secondaryMuscles: ['Tríceps'] } });
  assert.match(html, /muscle active-secondary triceps/);
  assert.match(html, /&lt;script&gt;x&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
});
