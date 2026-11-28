/* Carga por tandas el historial de cada ejercicio para evitar un límite fijo y cuidar el móvil. */
'use strict';

(() => {
  const batchSize = 40;
  const pages = new WeakMap();
  const nextBatch = (items, start, size = batchSize) => items.slice(start, start + size);

  function sessionHTML({ w, ex }) {
    return `<div class="card ex-detail"><div class="wk-item-head"><b>${esc(w.title)}</b><small>${fmtWDate(w.start)}</small></div>
      ${ex.sets.map((set, i) => `<div class="det-set"><span class="set-lbl t-${set.type}">${setLabel(ex, i)}</span><span>${esc(fmtSet(set))}</span><small class="sub">${set.type !== 'warmup' && set.kg && set.reps ? `1RM ≈ ${GymUnits.formatWeight(Math.round(e1rm(set.kg, set.reps)))} ${GymUnits.unitFor('weight')}` : ''}</small></div>`).join('')}</div>`;
  }

  function loadBatch(button) {
    const container = [...document.querySelectorAll('[data-ex-history-list]')].find(item => item.dataset.exHistoryList === button.dataset.exHistoryMore);
    const state = container && pages.get(container);
    if (!state) return;
    const next = nextBatch(state.records, state.loaded);
    container.insertAdjacentHTML('beforeend', next.map(sessionHTML).join(''));
    state.loaded += next.length;
    button.textContent = `Ver más sesiones (${state.records.length - state.loaded})`;
    if (state.loaded >= state.records.length) button.remove();
  }

  function addHistoryLoader(id) {
    const openPages = document.querySelectorAll('body > .page');
    const page = openPages[openPages.length - 1];
    const body = page && page.querySelector('.page-body');
    const heading = body && [...body.querySelectorAll('.section-title')].find(item => item.textContent.trim() === 'Historial');
    const records = exHist.get(id) || [];
    const cards = body && [...body.querySelectorAll('.ex-detail')];
    if (!heading || !cards.length || records.length <= cards.length) return;
    body.querySelectorAll('p').forEach(item => { if (/Mostrando las 40 sesiones/.test(item.textContent)) item.remove(); });
    const container = document.createElement('div');
    container.dataset.exHistoryList = id;
    cards[0].before(container);
    cards.forEach(card => container.append(card));
    pages.set(container, { records, loaded: cards.length });
    const button = document.createElement('button');
    button.className = 'btn btn-ghost btn-block'; button.dataset.exHistoryMore = id;
    button.textContent = `Ver más sesiones (${records.length - cards.length})`;
    container.after(button);
  }

  const originalOpenExercise = openExercise;
  openExercise = id => { originalOpenExercise(id); addHistoryLoader(id); };
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-ex-history-more]');
    if (button) loadBatch(button);
  });
  window.GymExerciseHistory = Object.freeze({ nextBatch, batchSize });
})();
