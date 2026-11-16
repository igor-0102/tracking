/* Tracking · cálculos de nutrición. Funciones puras, sin interfaz ni almacenamiento.
   Se usa en el navegador (window.Nutri) y en los tests de Node (require). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Nutri = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  /* ---------- Perfil ---------- */
  const ACTIVITY = [
    { id: 'sedentario', label: 'Sedentario', desc: 'Poco o ningún ejercicio', factor: 1.2 },
    { id: 'ligera', label: 'Ligera', desc: 'Ejercicio 1–3 días por semana', factor: 1.375 },
    { id: 'moderada', label: 'Moderada', desc: 'Ejercicio 3–5 días por semana', factor: 1.55 },
    { id: 'alta', label: 'Alta', desc: 'Ejercicio 6–7 días por semana', factor: 1.725 },
    { id: 'muy_alta', label: 'Muy alta', desc: 'Dos sesiones al día o trabajo físico', factor: 1.9 },
  ];
  const LIMITS = { kg: [30, 300], cm: [100, 250], age: [10, 100] };
  const inRange = (v, [a, b]) => typeof v === 'number' && isFinite(v) && v >= a && v <= b;

  // Edad en años cumplidos a partir de la fecha de nacimiento (AAAA-MM-DD).
  function ageFromBirth(birthISO, todayISO) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(birthISO || '') || !/^\d{4}-\d{2}-\d{2}$/.test(todayISO || '')) return null;
    const [by, bm, bd] = birthISO.split('-').map(Number);
    const [ty, tm, td] = todayISO.split('-').map(Number);
    let age = ty - by;
    if (tm < bm || (tm === bm && td < bd)) age--;
    return age >= 0 ? age : null;
  }
  // La fecha de nacimiento manda sobre la edad manual.
  function profileAge(profile, todayISO) {
    const a = ageFromBirth(profile && profile.birth, todayISO);
    if (a != null) return a;
    return profile && typeof profile.age === 'number' ? profile.age : null;
  }

  // Tasa metabólica basal (Mifflin-St Jeor), en kcal/día. Sin redondear.
  function bmr({ sex, kg, cm, age }) {
    if ((sex !== 'h' && sex !== 'm') || !inRange(kg, LIMITS.kg) || !inRange(cm, LIMITS.cm) || !inRange(age, LIMITS.age)) return null;
    return 10 * kg + 6.25 * cm - 5 * age + (sex === 'h' ? 5 : -161);
  }
  const activityFactor = id => (ACTIVITY.find(a => a.id === id) || {}).factor || null;
  // Gasto energético total = TMB × factor de actividad.
  function tdee(bmrValue, activityId) {
    const f = activityFactor(activityId);
    return bmrValue == null || f == null ? null : bmrValue * f;
  }
  function validateProfile(p) {
    const errors = [];
    if (p.kg != null && !inRange(p.kg, LIMITS.kg)) errors.push(`El peso debe estar entre ${LIMITS.kg[0]} y ${LIMITS.kg[1]} kg`);
    if (p.cm != null && !inRange(p.cm, LIMITS.cm)) errors.push(`La altura debe estar entre ${LIMITS.cm[0]} y ${LIMITS.cm[1]} cm`);
    if (p.age != null && !inRange(p.age, LIMITS.age)) errors.push(`La edad debe estar entre ${LIMITS.age[0]} y ${LIMITS.age[1]} años`);
    return errors;
  }

  /* ---------- Objetivo ---------- */
  const GOAL_TYPES = [
    { id: 'def', label: 'Definición', pct: -20 },
    { id: 'mant', label: 'Mantenimiento', pct: 0 },
    { id: 'vol', label: 'Volumen', pct: 10 },
  ];
  // kcal = GET ajustado en %; proteína y grasa en g por kg de peso; carbohidratos, lo que quede.
  function goalTargets({ tdee: get, pct = 0, kg, protGkg = 0, fatGkg = 0 }) {
    if (get == null || !(kg > 0)) return null;
    const kcal = get * (1 + pct / 100);
    const p = protGkg * kg;
    const f = fatGkg * kg;
    const c = Math.max(0, (kcal - p * 4 - f * 9) / 4);
    return { kcal, p, f, c, over: p * 4 + f * 9 > kcal };
  }

  /* ---------- Macros ---------- */
  const FIELDS = ['kcal', 'p', 'c', 'f', 'fiber', 'sugar', 'salt'];
  const zero = () => ({ kcal: 0, p: 0, c: 0, f: 0, fiber: 0, sugar: 0, salt: 0 });
  // Sal (g) a partir del sodio (mg).
  const saltFromSodium = mg => (mg || 0) * 2.5 / 1000;

  // Gramos de un ingrediente: cantidad en gramos, o nº de porciones × gramos de la porción.
  function itemGrams(item) {
    const q = Number(item && item.qty) || 0;
    if (item && item.unit === 'portion') return q * (Number(item.portionG) || 0);
    return q;
  }
  // Macros de un ingrediente. `per100` son los valores por 100 g.
  function itemMacros(item) {
    const g = itemGrams(item);
    const out = zero();
    const per = (item && item.per100) || {};
    for (const k of FIELDS) out[k] = (Number(per[k]) || 0) * g / 100;
    return out;
  }
  function sumMacros(list) {
    const out = zero();
    for (const m of list) for (const k of FIELDS) out[k] += (m && m[k]) || 0;
    return out;
  }
  const optionMacros = option => sumMacros(((option && option.items) || []).map(itemMacros));
  // Total del día: `selected` es la lista de opciones elegidas (una por comida).
  const dayMacros = selected => sumMacros((selected || []).filter(Boolean).map(optionMacros));

  /* ---------- Lista de la compra ---------- */
  // Suma los gramos de cada alimento en las opciones elegidas y los multiplica por los días.
  function shoppingList(selected, days = 1) {
    const map = new Map();
    for (const opt of (selected || []).filter(Boolean)) {
      for (const it of opt.items || []) {
        const key = it.key || 'n:' + it.name;
        const cur = map.get(key) || { key, name: it.name, grams: 0 };
        cur.grams += itemGrams(it) * days;
        map.set(key, cur);
      }
    }
    return [...map.values()].sort((a, b) => a.name.localeCompare(b.name, 'es'));
  }

  /* ---------- Formato (solo para mostrar) ---------- */
  const fmtKcal = v => String(Math.round(v || 0));
  const fmtMacro = v => (Math.round((v || 0) * 10) / 10).toFixed(1).replace('.', ',');
  function fmtGrams(g) {
    if (g >= 1000) return (Math.round(g / 10) / 100).toString().replace('.', ',') + ' kg';
    return Math.round(g) + ' g';
  }

  return {
    ACTIVITY, LIMITS, GOAL_TYPES, FIELDS,
    ageFromBirth, profileAge, bmr, activityFactor, tdee, validateProfile, goalTargets,
    zero, saltFromSodium, itemGrams, itemMacros, sumMacros, optionMacros, dayMacros, shoppingList,
    fmtKcal, fmtMacro, fmtGrams,
  };
});
