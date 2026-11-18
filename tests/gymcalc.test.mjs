// Tests de la lógica del entreno. Ejecutar con: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const G = createRequire(import.meta.url)('../gymcalc.js');
const ex = (n, done = [], sup) => ({ sup, sets: Array.from({ length: n }, (_, i) => ({ done: done.includes(i) })) });

test('progresión: misma carga +1 rep, o +2,5 kg con 2 reps menos', () => {
  const prev = [{ type: 'warmup', kg: 40, reps: 10 }, { type: 'normal', kg: 80, reps: 10 }, { type: 'normal', kg: 80, reps: 8 }];
  assert.deepEqual(G.suggestProgression(prev), [{ kg: 80, reps: 11 }, { kg: 82.5, reps: 8 }]);
});
test('progresión: cargas pequeñas suben de 1 en 1 kg', () => {
  assert.deepEqual(G.suggestProgression([{ type: 'normal', kg: 12, reps: 12 }]), [{ kg: 12, reps: 13 }, { kg: 13, reps: 10 }]);
});
test('progresión: peso corporal solo suma repeticiones; sin datos no sugiere', () => {
  assert.deepEqual(G.suggestProgression([{ type: 'normal', kg: 0, reps: 12 }, { type: 'normal', kg: 0, reps: 9 }]), [{ kg: 0, reps: 13 }]);
  assert.deepEqual(G.suggestProgression([]), []);
  assert.deepEqual(G.suggestProgression(null), []);
  assert.deepEqual(G.suggestProgression([{ type: 'warmup', kg: 40, reps: 10 }]), []);
});
test('progresión: con 3 reps o menos no propone bajar más', () => {
  assert.deepEqual(G.suggestProgression([{ type: 'normal', kg: 120, reps: 2 }]), [{ kg: 120, reps: 3 }]);
});

test('siguiente serie: la siguiente del mismo ejercicio y luego el siguiente ejercicio', () => {
  const exs = [ex(3, [0]), ex(2)];
  assert.deepEqual(G.nextSet(exs, 0, 0), [0, 1]);
  exs[0].sets.forEach(s => { s.done = true; });
  assert.deepEqual(G.nextSet(exs, 0, 2), [1, 0]);
});
test('siguiente serie: vuelve a series que quedaron atrás y devuelve null si todo está hecho', () => {
  const exs = [ex(2, [1]), ex(2, [0, 1])];
  assert.deepEqual(G.nextSet(exs, 1, 1), [0, 0]);
  assert.equal(G.nextSet([ex(1, [0])], 0, 0), null);
});
test('superserie: alterna ejercicios del grupo con la misma serie y luego sigue', () => {
  const exs = [ex(3, [0], 'a'), ex(3, [], 'a'), ex(2)];
  assert.deepEqual(G.nextSet(exs, 0, 0), [1, 0]);           // A1 → B1
  exs[1].sets[0].done = true;
  assert.deepEqual(G.nextSet(exs, 1, 0), [0, 1]);           // B1 → A2
  exs.slice(0, 2).forEach(e => e.sets.forEach(s => { s.done = true; }));
  assert.deepEqual(G.nextSet(exs, 1, 2), [2, 0]);           // fin del grupo → siguiente ejercicio
});
test('descanso: no entre ejercicios de una superserie, sí al cerrar la ronda', () => {
  const exs = [ex(3, [0], 'a'), ex(3, [], 'a'), ex(2)];
  assert.equal(G.restAfter(exs, 0, [1, 0]), false);
  assert.equal(G.restAfter(exs, 1, [0, 1]), true);
  assert.equal(G.restAfter(exs, 2, [2, 1]), true);
  assert.equal(G.restAfter(exs, 0, null), true);
});

test('media móvil por días naturales', () => {
  const r = G.movingAverage([{ x: 0, y: 100 }, { x: 10, y: 110 }, { x: 30, y: 120 }, { x: 35, y: 130 }], 28);
  assert.deepEqual(r.map(p => p.t), [100, 105, 115, 120]);
});

test('semana de un día: lunes a domingo', () => {
  assert.equal(G.weekOfDay(3), 0);   // 1970-01-04, domingo
  assert.equal(G.weekOfDay(4), 1);   // 1970-01-05, lunes
  assert.equal(G.weekOfDay(10), 1);  // domingo siguiente
});
test('racha de semanas seguidas con entreno', () => {
  assert.equal(G.streakWeeks([10, 9, 8, 6], 10), 3);
  assert.equal(G.streakWeeks([9, 8], 10), 2);      // esta semana aún sin entreno: cuenta desde la anterior
  assert.equal(G.streakWeeks([8, 7], 10), 0);
  assert.equal(G.streakWeeks([], 10), 0);
});
test('series por grupo muscular sin contar calentamiento', () => {
  const r = G.setsByMuscle([
    { muscle: 'Pecho', sets: [{ type: 'warmup' }, { type: 'normal' }, { type: 'failure' }] },
    { muscle: 'Pecho', sets: [{ type: 'normal' }] },
    { muscle: null, sets: [{ type: 'dropset' }] },
  ]);
  assert.deepEqual(r, { Pecho: 3, Otro: 1 });
});
