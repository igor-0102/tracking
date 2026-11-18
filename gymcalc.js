/* Tracking · cálculos del entreno. Funciones puras, sin interfaz ni almacenamiento.
   Se usa en el navegador (window.GymCalc) y en los tests de Node (require). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GymCalc = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  const e1rm = (kg, reps) => (!kg || !reps ? 0 : reps === 1 ? kg : kg * (1 + reps / 30));
  const working = sets => (sets || []).filter(s => s.type !== 'warmup');
  const round2 = v => Math.round(v * 100) / 100;

  /* Sugerencia de progresión a partir de la última sesión (doble progresión):
     misma carga con una repetición más, o más carga con dos repeticiones menos. */
  function suggestProgression(prevSets) {
    let best = null;
    for (const s of working(prevSets)) {
      if (!(s.reps > 0)) continue;
      const better = !best || e1rm(s.kg, s.reps) > e1rm(best.kg, best.reps) || (!s.kg && !best.kg && s.reps > best.reps);
      if (better) best = s;
    }
    if (!best) return [];
    if (!best.kg) return [{ kg: 0, reps: best.reps + 1 }];
    const out = [{ kg: best.kg, reps: best.reps + 1 }];
    const inc = best.kg >= 20 ? 2.5 : 1;
    if (best.reps > 3) out.push({ kg: round2(best.kg + inc), reps: Math.max(3, best.reps - 2) });
    return out;
  }

  /* Siguiente serie por hacer tras marcar la serie si del ejercicio ei.
     exercises: [{ sup?, sets: [{ done }] }]. Devuelve [ei, si] o null.
     En una superserie se alterna: misma serie del siguiente ejercicio del grupo. */
  function nextSet(exercises, ei, si) {
    const firstUndone = e => e.sets.findIndex(s => !s.done);
    const after = from => {
      for (let i = from; i < exercises.length; i++) { const u = firstUndone(exercises[i]); if (u >= 0) return [i, u]; }
      return null;
    };
    const ex = exercises[ei];
    if (ex && ex.sup) {
      const group = exercises.map((e, i) => i).filter(i => exercises[i].sup === ex.sup);
      for (const gi of group) if (gi > ei && exercises[gi].sets[si] && !exercises[gi].sets[si].done) return [gi, si];
      for (const gi of group) { const u = firstUndone(exercises[gi]); if (u >= 0) return [gi, u]; }
      return after(group[group.length - 1] + 1) || after(0);
    }
    const u = ex ? firstUndone(ex) : -1;
    if (u >= 0) return [ei, u];
    return after(ei + 1) || after(0);
  }

  /* ¿Hay descanso tras marcar? No, si lo siguiente es otro ejercicio de la misma superserie. */
  function restAfter(exercises, ei, next) {
    const ex = exercises[ei];
    if (!ex || !ex.sup || !next) return true;
    return !(next[0] > ei && exercises[next[0]].sup === ex.sup);
  }

  /* Media móvil por días naturales: añade t = media de los puntos de los últimos `days` días. */
  function movingAverage(points, days) {
    let j = 0, sum = 0;
    return points.map((p, i) => {
      sum += p.y;
      while (points[j].x <= p.x - days) { sum -= points[j].y; j++; }
      return { ...p, t: sum / (i - j + 1) };
    });
  }

  /* Semana (lunes a domingo) de un índice de día (días desde 1970-01-01, que fue jueves). */
  const weekOfDay = dayIdx => Math.floor((dayIdx + 3) / 7);

  /* Semanas seguidas con al menos un entreno, contando hasta la semana actual
     (si esta aún no tiene entreno, se cuenta desde la anterior). */
  function streakWeeks(weeksWithWorkout, currentWeek) {
    const set = new Set(weeksWithWorkout);
    let w = set.has(currentWeek) ? currentWeek : currentWeek - 1, n = 0;
    while (set.has(w)) { n++; w--; }
    return n;
  }

  /* Series de trabajo por grupo muscular. items: [{ muscle, sets }] */
  function setsByMuscle(items) {
    const out = {};
    for (const it of items) out[it.muscle || 'Otro'] = (out[it.muscle || 'Otro'] || 0) + working(it.sets).length;
    return out;
  }

  return { e1rm, suggestProgression, nextSet, restAfter, movingAverage, weekOfDay, streakWeeks, setsByMuscle };
});
