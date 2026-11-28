/* Añade búsqueda por fecha/ejercicio sin alterar el formato persistido de los entrenos. */
'use strict';

(() => {
  const state = { query: '', from: '', to: '' };
  let queryTimer = 0;
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  function matchesWorkout(workout, query, from, to, exercises) {
    const names = exercises instanceof Map ? exercises : new Map(exercises.map(ex => [ex.id, ex.name]));
    const text = normalize([workout.title, ...(workout.exercises || []).map(ex => names.get(ex.exId) || '')].join(' '));
    const day = localISO(workout.start);
    return (!query || text.includes(normalize(query))) && (!from || day >= from) && (!to || day <= to);
  }

  function controlsHTML() {
    return `<div class="card history-filters" data-history-filters>
      <label class="field"><span>Buscar entreno o ejercicio</span><input type="search" data-history-query placeholder="Nombre del entreno o ejercicio" value="${esc(state.query)}"></label>
      <div class="history-dates"><label class="field"><span>Desde</span><input type="date" data-history-from value="${state.from}"></label><label class="field"><span>Hasta</span><input type="date" data-history-to value="${state.to}"></label></div>
      <button class="btn btn-ghost btn-small" data-history-export>Exportar entrenos CSV</button>
    </div>`;
  }

  function ensureControls(root) {
    if (root.querySelector('[data-history-filters]')) return;
    root.insertAdjacentHTML('afterbegin', controlsHTML());
  }

  function applyFilters(root) {
    const controls = root.querySelector('[data-history-filters]');
    if (!controls) return;
    const workouts = new Map(G.workouts.map(item => [item.id, item]));
    const exercises = new Map(G.exercises.map(item => [item.id, item.name]));
    let visible = 0;
    root.querySelectorAll('[data-wid]').forEach(row => {
      const workout = workouts.get(row.dataset.wid);
      row.hidden = !workout || !matchesWorkout(workout, state.query, state.from, state.to, exercises);
      if (!row.hidden) visible++;
    });
    const active = !!(state.query || state.from || state.to);
    let empty = root.querySelector('[data-history-empty]');
    if (active && !visible) {
      if (!empty) { empty = document.createElement('p'); empty.className = 'fine center'; empty.dataset.historyEmpty = 'true'; empty.textContent = 'No hay entrenos con esos filtros.'; controls.after(empty); }
    } else empty?.remove();
  }

  function installFilters() {
    const root = document.querySelector('#gym-historial');
    const original = renderGymHistory;
    renderGymHistory = () => {
      original();
      ensureControls(root);
      applyFilters(root);
    };
    root.addEventListener('input', event => {
      if (!event.target.matches('[data-history-query]')) return;
      state.query = event.target.value;
      const cursor = event.target.selectionStart;
      clearTimeout(queryTimer);
      queryTimer = setTimeout(() => {
        histLimit = state.query || state.from || state.to ? G.workouts.length : 30;
        renderGymHistory();
        const input = root.querySelector('[data-history-query]');
        input?.focus();
        if (input && cursor != null) input.setSelectionRange(cursor, cursor);
      }, 140);
    });
    root.addEventListener('change', event => {
      if (event.target.matches('[data-history-from]')) state.from = event.target.value;
      else if (event.target.matches('[data-history-to]')) state.to = event.target.value;
      else return;
      histLimit = state.query || state.from || state.to ? G.workouts.length : 30;
      renderGymHistory();
    });
    root.addEventListener('click', event => { if (event.target.closest('[data-history-export]')) GymPortability.exportWorkouts(); });
  }

  installFilters();
  window.GymHistoryTools = Object.freeze({ matchesWorkout });
})();
