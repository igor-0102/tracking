/* Completa el resumen al terminar con la sesión comparable más reciente. */
'use strict';

(() => {
  const volume = workout => (workout.exercises || []).reduce((total, exercise) => total
    + (exercise.sets || []).filter(set => set.type !== 'warmup').reduce((sum, set) => sum + (set.kg || 0) * (set.reps || 0), 0), 0);
  const setCount = workout => (workout.exercises || []).reduce((total, exercise) => total
    + (exercise.sets || []).filter(set => set.type !== 'warmup').length, 0);
  const exerciseIds = workout => [...new Set((workout.exercises || []).map(ex => ex.exId))].sort();
  const sameExercises = (left, right) => {
    const a = exerciseIds(left), b = exerciseIds(right);
    return a.length > 0 && a.length === b.length && a.every((id, index) => id === b[index]);
  };

  function comparable(workout, history) {
    return history.filter(item => item.id !== workout.id && item.start < workout.start)
      .filter(item => (workout.routineId && item.routineId === workout.routineId)
        || (item.title === workout.title) || sameExercises(workout, item))
      .sort((a, b) => b.start - a.start)[0] || null;
  }

  function comparison(workout, history) {
    const previous = comparable(workout, history);
    if (!previous) return null;
    return { previous, volumeDelta: volume(workout) - volume(previous), setDelta: setCount(workout) - setCount(previous),
      durationDelta: (workout.end - workout.start) - (previous.end - previous.start) };
  }

  function comparisonCard(result) {
    if (!result) return null;
    const card = document.createElement('div');
    card.className = 'card summary-comparison';
    const delta = value => `${value > 0 ? '+' : ''}${Math.round(value).toLocaleString('es-ES')}`;
    const unit = GymUnits.unitFor('weight'), volumeDelta = result.volumeDelta * (unit === 'lb' ? 2.2046226218 : 1);
    card.innerHTML = `<div class="label">Comparación con «${esc(result.previous.title || 'Entreno anterior')}»</div><p>Volumen ${delta(volumeDelta)} ${unit} · Series ${delta(result.setDelta)} · Duración ${delta(result.durationDelta / 60000)} min</p>`;
    return card;
  }

  const original = showSummary;
  showSummary = async (...args) => {
    await original(...args);
    const result = comparison(args[0], G.workouts);
    const pages = document.querySelectorAll('body > .page');
    const body = pages[pages.length - 1]?.querySelector('.page-body');
    const card = comparisonCard(result);
    const stats = body && body.querySelector('.stats');
    if (stats && card) stats.after(card);
  };
  window.GymSummaryComparison = Object.freeze({ volume, setCount, sameExercises, comparison });
})();
