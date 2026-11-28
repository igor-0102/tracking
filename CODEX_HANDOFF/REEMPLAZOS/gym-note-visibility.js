/* Controla la visibilidad de las notas sin borrar el texto guardado del ejercicio. */
'use strict';

(() => {
  function isVisible(exercise) {
    return !!exercise && exercise.showNotes !== false && (!!exercise.notes || exercise.showNotes === true);
  }

  function toggleVisibility(exercise) {
    exercise.showNotes = !isVisible(exercise);
    return exercise.showNotes;
  }

  window.GymNotes = Object.freeze({ isVisible, toggleVisibility });
})();
