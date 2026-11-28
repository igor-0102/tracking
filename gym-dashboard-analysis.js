/* Cálculos puros para explicar volumen, marcas y tendencias sin alterar los entrenos guardados. */
'use strict';

(function exposeGymDashboardAnalysis(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.GymDashboardAnalysis = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function buildGymDashboardAnalysis() {
  const workingSets = sets => (sets || []).filter(set => set && set.type !== 'warmup');
  const setVolume = set => (Number(set.kg) || 0) * (Number(set.reps) || 0);
  const estimate1RM = (kg, reps) => !kg || !reps ? 0 : reps === 1 ? kg : kg * (1 + reps / 30);
  const volume = sets => workingSets(sets).reduce((sum, set) => sum + setVolume(set), 0);

  function analyzeWorkout(workout, records = 0) {
    const exercises = workout?.exercises || [];
    const sets = exercises.flatMap(exercise => workingSets(exercise.sets));
    const started = Number(workout?.start) || 0, ended = Number(workout?.end) || started;
    return {
      exerciseCount: exercises.length,
      setCount: sets.length,
      volumeKg: sets.reduce((sum, set) => sum + setVolume(set), 0),
      durationMs: Math.max(0, ended - started),
      recordCount: Math.max(0, Number(records) || 0),
    };
  }

  function analyzeExercise(sessions = []) {
    const usable = sessions.filter(item => item && item.ex).slice().sort((a, b) => (b.w?.start || 0) - (a.w?.start || 0));
    let maxWeightKg = 0, personalBest1RM = null;
    for (const session of usable) for (const set of workingSets(session.ex.sets)) {
      maxWeightKg = Math.max(maxWeightKg, Number(set.kg) || 0);
      const estimate = estimate1RM(Number(set.kg) || 0, Number(set.reps) || 0);
      if (estimate > (personalBest1RM?.kg || 0)) personalBest1RM = { kg: estimate, set, workout: session.w };
    }
    const latest = usable[0] || null, previous = usable[1] || null;
    const recentSets = latest ? workingSets(latest.ex.sets) : [];
    const recent1RM = Math.max(0, ...recentSets.map(set => estimate1RM(Number(set.kg) || 0, Number(set.reps) || 0)));
    const previous1RM = previous ? Math.max(0, ...workingSets(previous.ex.sets)
      .map(set => estimate1RM(Number(set.kg) || 0, Number(set.reps) || 0))) : 0;
    return {
      sessionCount: usable.length, latest, previous, maxWeightKg, personalBest1RM,
      recentVolumeKg: latest ? volume(latest.ex.sets) : 0,
      recentSetCount: recentSets.length,
      recent1RM,
      estimated1RMDeltaKg: previous ? recent1RM - previous1RM : null,
      recentTopSet: recentSets.reduce((best, set) => estimate1RM(set.kg, set.reps) > estimate1RM(best?.kg, best?.reps) ? set : best, null),
    };
  }

  return Object.freeze({ workingSets, estimate1RM, volume, analyzeWorkout, analyzeExercise });
});
