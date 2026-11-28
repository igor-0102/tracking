/* Incluye la sesión en curso en las copias y la restaura solo si no hay otra activa. */
'use strict';

(() => {
  function clone(value) { return value == null ? value : JSON.parse(JSON.stringify(value)); }

  function validActiveWorkout(workout) {
    return !!workout && typeof workout.id === 'string' && Number.isFinite(workout.start)
      && Array.isArray(workout.exercises)
      && workout.exercises.every(ex => ex && typeof ex.exId === 'string' && Array.isArray(ex.sets)
        && ex.sets.every(set => set && typeof set === 'object'));
  }

  const originalBackup = gymBackupData;
  gymBackupData = () => ({ ...originalBackup(), activeWorkout: clone(G.active) });

  const originalImport = gymImportBackup;
  gymImportBackup = async data => {
    await originalImport(data);
    const workout = data && data.activeWorkout;
    if (G.active || !validActiveWorkout(workout)) return;
    const known = new Set(G.exercises.map(ex => ex.id));
    if (!workout.exercises.every(ex => known.has(ex.exId))) return;
    G.active = clone(workout);
    await DB.putKey('active', G.active);
    renderActiveBar();
    if (typeof nativeWorkoutSync === 'function') nativeWorkoutSync();
  };

  window.GymActiveBackup = Object.freeze({ validActiveWorkout });
})();
