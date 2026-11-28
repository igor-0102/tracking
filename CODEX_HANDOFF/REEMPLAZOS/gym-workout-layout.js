/* Preferencias sencillas de la pantalla de entreno; se ocultan datos sin borrarlos. */
'use strict';

(() => {
  const controlIds = { previous: '#set-workout-previous', suggestions: '#set-workout-suggestions', notes: '#set-workout-notes' };
  const settingKeys = { previous: 'showPreviousSets', suggestions: 'showProgressSuggestions', notes: 'showWorkoutNotes' };
  const defaults = Object.freeze({ previous: true, suggestions: true, notes: true });

  function preferences(settings) {
    return Object.fromEntries(Object.entries(settingKeys).map(([key, field]) => [key, settings[field] !== false]));
  }

  function applyLayout() {
    if (typeof wkPage === 'undefined' || !wkPage) return;
    const prefs = preferences(S);
    wkPage.el.classList.toggle('hide-prev', !prefs.previous);
    wkPage.el.classList.toggle('hide-suggestions', !prefs.suggestions);
    wkPage.el.classList.toggle('hide-notes', !prefs.notes);
  }

  function syncSettings() {
    const prefs = preferences(S);
    for (const [key, selector] of Object.entries(controlIds)) {
      const control = document.querySelector(selector);
      if (control) control.checked = prefs[key];
    }
  }

  function bindSettings() {
    for (const [key, selector] of Object.entries(controlIds)) {
      const control = document.querySelector(selector);
      if (!control) continue;
      control.addEventListener('change', async () => {
        S[settingKeys[key]] = control.checked;
        await saveSettings();
        applyLayout();
      });
    }
  }

  const baseRender = renderWk;
  renderWk = (...args) => { baseRender(...args); applyLayout(); };
  const baseSettings = renderGymSettings;
  renderGymSettings = (...args) => { baseSettings(...args); syncSettings(); };
  bindSettings();
  window.GymWorkoutLayout = Object.freeze({ preferences, defaults, applyLayout });
})();
