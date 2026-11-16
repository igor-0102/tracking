// Tests de la lógica de nutrición. Ejecutar con: npm test
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const N = createRequire(import.meta.url)('../nutri.js');
const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);

test('TMB: hombre, 80 kg, 180 cm, 30 años → 1780 kcal', () => {
  assert.equal(N.bmr({ sex: 'h', kg: 80, cm: 180, age: 30 }), 1780);
});
test('TMB: mujer, 60 kg, 165 cm, 25 años → 1345,25 kcal', () => {
  assert.equal(N.bmr({ sex: 'm', kg: 60, cm: 165, age: 25 }), 1345.25);
});
test('TMB: datos incompletos o fuera de rango → null', () => {
  assert.equal(N.bmr({ sex: 'h', kg: 80, cm: 180, age: null }), null);
  assert.equal(N.bmr({ sex: null, kg: 80, cm: 180, age: 30 }), null);
  assert.equal(N.bmr({ sex: 'h', kg: 20, cm: 180, age: 30 }), null);
  assert.equal(N.bmr({ sex: 'h', kg: 80, cm: 300, age: 30 }), null);
  assert.equal(N.bmr({ sex: 'h', kg: 80, cm: 180, age: 5 }), null);
});

test('GET = TMB × factor de actividad', () => {
  near(N.tdee(1780, 'sedentario'), 2136);
  near(N.tdee(1780, 'ligera'), 2447.5);
  near(N.tdee(1780, 'moderada'), 2759);
  near(N.tdee(1780, 'alta'), 3070.5);
  near(N.tdee(1780, 'muy_alta'), 3382);
  assert.equal(N.tdee(1780, 'inventado'), null);
  assert.equal(N.tdee(null, 'ligera'), null);
});
test('hay cinco niveles de actividad con descripción', () => {
  assert.deepEqual(N.ACTIVITY.map(a => a.factor), [1.2, 1.375, 1.55, 1.725, 1.9]);
  assert.ok(N.ACTIVITY.every(a => a.label && a.desc));
});

test('edad a partir de la fecha de nacimiento', () => {
  assert.equal(N.ageFromBirth('1996-11-16', '2026-11-16'), 30);   // el día del cumpleaños
  assert.equal(N.ageFromBirth('1996-11-17', '2026-11-16'), 29);   // el día antes
  assert.equal(N.ageFromBirth('1996-12-01', '2026-11-16'), 29);
  assert.equal(N.ageFromBirth('1996-01-01', '2026-11-16'), 30);
  assert.equal(N.ageFromBirth('2000-02-29', '2025-02-28'), 24);   // nacido en bisiesto
  assert.equal(N.ageFromBirth('2000-02-29', '2025-03-01'), 25);
  assert.equal(N.ageFromBirth('', '2026-11-16'), null);
  assert.equal(N.ageFromBirth('2030-01-01', '2026-11-16'), null);
});
test('la fecha de nacimiento manda sobre la edad manual', () => {
  assert.equal(N.profileAge({ birth: '1996-11-16', age: 50 }, '2026-11-16'), 30);
  assert.equal(N.profileAge({ birth: '', age: 41 }, '2026-11-16'), 41);
  assert.equal(N.profileAge({}, '2026-11-16'), null);
});

test('validación de rangos del perfil', () => {
  assert.equal(N.validateProfile({ kg: 80, cm: 180, age: 30 }).length, 0);
  assert.equal(N.validateProfile({ kg: 500, cm: 50, age: 200 }).length, 3);
  assert.equal(N.validateProfile({ kg: null, cm: null, age: null }).length, 0);
});

test('objetivo: kcal por % sobre el GET, proteína y grasa en g/kg, carbohidratos el resto', () => {
  const t = N.goalTargets({ tdee: 2500, pct: -20, kg: 80, protGkg: 2, fatGkg: 1 });
  near(t.kcal, 2000);
  near(t.p, 160);
  near(t.f, 80);
  near(t.c, (2000 - 160 * 4 - 80 * 9) / 4);   // 160 g
  assert.equal(t.over, false);
  near(N.goalTargets({ tdee: 2500, pct: 10, kg: 80, protGkg: 2, fatGkg: 1 }).kcal, 2750);
});
test('objetivo: si proteína y grasa ya superan las kcal, los carbohidratos son 0', () => {
  const t = N.goalTargets({ tdee: 1500, pct: -30, kg: 100, protGkg: 3, fatGkg: 1.5 });
  assert.equal(t.c, 0);
  assert.equal(t.over, true);
  assert.equal(N.goalTargets({ tdee: null, pct: 0, kg: 80 }), null);
});

const pollo = { kcal: 120, p: 22.5, c: 0, f: 2.62, fiber: 0, sugar: 0, salt: 0.1125 };
const arroz = { kcal: 365, p: 7.13, c: 79.95, f: 0.66, fiber: 1.3, sugar: 0.12, salt: 0.0125 };

test('macros de un ingrediente en gramos, sin redondear', () => {
  const m = N.itemMacros({ qty: 150, unit: 'g', per100: pollo });
  near(m.kcal, 180);
  near(m.p, 33.75);
  near(m.f, 3.93);
  near(m.c, 0);
  const r = N.itemMacros({ qty: 73, unit: 'g', per100: arroz });
  near(r.kcal, 266.45);
  near(r.c, 58.3635);
});
test('macros de un ingrediente por porciones', () => {
  const huevo = { kcal: 143, p: 12.56, c: 0.72, f: 9.51 };
  const it = { qty: 3, unit: 'portion', portionG: 55, per100: huevo };
  near(N.itemGrams(it), 165);
  near(N.itemMacros(it).kcal, 143 * 1.65);
  near(N.itemMacros(it).p, 12.56 * 1.65);
  near(N.itemMacros({ qty: 0.5, unit: 'portion', portionG: 55, per100: huevo }).kcal, 143 * 0.275);
});
test('ingredientes vacíos o sin datos no rompen la suma', () => {
  assert.deepEqual(N.itemMacros({ qty: '', unit: 'g', per100: pollo }), N.zero());
  assert.deepEqual(N.itemMacros({ qty: 100, unit: 'g' }), N.zero());
  assert.deepEqual(N.optionMacros({ items: [] }), N.zero());
  assert.deepEqual(N.dayMacros([null, undefined]), N.zero());
});
test('una opción suma sus ingredientes y el día suma las opciones elegidas', () => {
  const comidaA = { items: [{ qty: 150, unit: 'g', per100: pollo }, { qty: 80, unit: 'g', per100: arroz }] };
  const cenaB = { items: [{ qty: 200, unit: 'g', per100: pollo }] };
  const a = N.optionMacros(comidaA);
  near(a.kcal, 180 + 292);
  near(a.p, 33.75 + 5.704);
  near(a.c, 63.96);
  const d = N.dayMacros([comidaA, null, cenaB]);
  near(d.kcal, 472 + 240);
  near(d.p, 33.75 + 5.704 + 45);
});
test('sal a partir del sodio', () => {
  near(N.saltFromSodium(400), 1);
  near(N.saltFromSodium(0), 0);
});

test('lista de la compra: agrupa por alimento y multiplica por los días', () => {
  const comida = { items: [{ key: 'u:05062', name: 'Pechuga de pollo', qty: 150, unit: 'g' }, { key: 'u:20044', name: 'Arroz blanco', qty: 80, unit: 'g' }] };
  const cena = { items: [{ key: 'u:05062', name: 'Pechuga de pollo', qty: 200, unit: 'g' }, { key: 'u:01123', name: 'Huevo entero', qty: 2, unit: 'portion', portionG: 55 }] };
  const list = N.shoppingList([comida, cena, null], 7);
  assert.deepEqual(list.map(x => x.name), ['Arroz blanco', 'Huevo entero', 'Pechuga de pollo']);
  near(list[0].grams, 560);
  near(list[1].grams, 770);
  near(list[2].grams, 2450);
});

test('formato en pantalla: kcal sin decimales, macros con un decimal', () => {
  assert.equal(N.fmtKcal(1345.25), '1345');
  assert.equal(N.fmtKcal(1779.5), '1780');
  assert.equal(N.fmtMacro(33.75), '33,8');
  assert.equal(N.fmtMacro(5), '5,0');
  assert.equal(N.fmtMacro(0), '0,0');
  assert.equal(N.fmtGrams(560), '560 g');
  assert.equal(N.fmtGrams(2450), '2,45 kg');
});
