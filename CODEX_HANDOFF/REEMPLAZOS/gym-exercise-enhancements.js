/* Guías propias, favoritos y filtros locales; los metadatos siguen dentro del ejercicio existente. */
'use strict';

(() => {
  const state = { favorite: false, muscle: '', equipment: '' };
  const normText = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

  function matches(exercise, query, filters = {}) {
    const text = normText(query);
    const searchText = normText([exercise.name, exercise.muscle, exercise.guide && exercise.guide.equipment].join(' '));
    return (!text || searchText.includes(text))
      && (!filters.favorite || !!exercise.favorite)
      && (!filters.muscle || exercise.muscle === filters.muscle)
      && (!filters.equipment || (exercise.guide && exercise.guide.equipment) === filters.equipment);
  }

  function esc(value) { return String(value || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

  function filterControls(root) {
    if (!root) return;
    const existing = root.querySelector('[data-exercise-filters]');
    const muscles = [...new Set(G.exercises.map(ex => ex.muscle).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    const equipment = [...new Set(G.exercises.map(ex => ex.guide && ex.guide.equipment).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'es'));
    if (existing) {
      const update = (select, label, values) => {
        const current = [...select.options].slice(1).map(option => option.value);
        if (current.join('\u0000') === values.join('\u0000')) return;
        select.innerHTML = `<option value="">${label}</option>${values.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('')}`;
      };
      const muscleSelect = existing.querySelector('[data-filter-muscle]');
      const equipmentSelect = existing.querySelector('[data-filter-equipment]');
      update(muscleSelect, 'Todos los músculos', muscles);
      update(equipmentSelect, 'Todo el equipamiento', equipment);
      muscleSelect.value = state.muscle;
      equipmentSelect.value = state.equipment;
      return;
    }
    const controls = document.createElement('div');
    controls.className = 'exercise-filters';
    controls.dataset.exerciseFilters = 'true';
    controls.innerHTML = `<select data-filter-muscle aria-label="Filtrar por músculo"><option value="">Todos los músculos</option>${muscles.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select>
      <select data-filter-equipment aria-label="Filtrar por equipamiento"><option value="">Todo el equipamiento</option>${equipment.map(x => `<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select>
      <label class="filter-fav"><input type="checkbox" data-filter-favorite> Solo favoritos</label>`;
    root.prepend(controls);
    controls.querySelector('[data-filter-muscle]').value = state.muscle;
    controls.querySelector('[data-filter-equipment]').value = state.equipment;
    controls.querySelector('[data-filter-favorite]').checked = state.favorite;
  }

  function applyFilters() {
    const root = document.querySelector('#ex-list');
    if (!root) return;
    filterControls(root);
    const query = document.querySelector('#ex-search')?.value || '';
    const filters = { favorite: state.favorite, muscle: state.muscle, equipment: state.equipment };
    let visible = 0;
    const exercises = new Map(G.exercises.map(ex => [ex.id, ex]));
    root.querySelectorAll('[data-exid]').forEach(row => {
      const exercise = exercises.get(row.dataset.exid);
      row.hidden = !exercise || !matches(exercise, query, filters);
      if (!row.hidden) visible++;
    });
    let empty = root.querySelector('[data-filter-empty]');
    if (!visible && G.exercises.length) {
      if (!empty) { empty = document.createElement('p'); empty.className = 'fine center'; empty.dataset.filterEmpty = 'true'; empty.textContent = 'No hay ejercicios con esos filtros.'; root.prepend(empty); }
    } else empty?.remove();
  }

  function refreshGuide(exercise) {
    const card = [...document.querySelectorAll('[data-guide-card]')].find(el => el.dataset.guideCard === exercise.id);
    if (card) card.outerHTML = window.exerciseGuideHTML(exercise);
  }

  function openGuideEditor(exercise) {
    const guide = exercise.guide || {};
    const muscleRows = MUSCLES.map(muscle => `<option value="${esc(muscle)}"${exercise.muscle === muscle ? ' selected' : ''}>${esc(muscle)}</option>`).join('');
    const secondaryRows = MUSCLES.filter(muscle => muscle !== exercise.muscle).map(muscle => `<label class="field"><span>${esc(muscle)}</span><input type="checkbox" data-secondary value="${esc(muscle)}"${(guide.secondaryMuscles || []).includes(muscle) ? ' checked' : ''}></label>`).join('');
    return new Promise(resolve => {
      let result = null;
      genSheet.innerHTML = `<div class="grabber"></div><h2>Guía propia</h2>
        <label class="field"><span>Músculo principal</span><select id="guide-primary">${muscleRows}</select></label>
        <label class="field"><span>Colocación</span><textarea id="guide-setup" rows="2">${esc(guide.setup || '')}</textarea></label>
        <label class="field"><span>Movimiento</span><textarea id="guide-move" rows="2">${esc(guide.move || '')}</textarea></label>
        <label class="field"><span>Error que evitar</span><textarea id="guide-error" rows="2">${esc(guide.error || '')}</textarea></label>
        <label class="field"><span>Equipamiento</span><input id="guide-equipment" value="${esc(guide.equipment || '')}" placeholder="Mancuernas, polea…"></label>
        <h3 class="section-title">Músculos secundarios</h3><div class="card form-card">${secondaryRows}</div>
        <label class="field"><span>Notas propias</span><textarea id="guide-notes" rows="2">${esc(guide.notes || '')}</textarea></label>
        <button class="btn btn-primary btn-block" data-guide-save>Guardar guía</button>
        <button class="btn btn-ghost btn-block" data-guide-cancel>Cancelar</button>`;
      genSheet.onclick = event => {
        if (event.target.closest('[data-guide-cancel]')) { closeSheet(); return; }
        if (!event.target.closest('[data-guide-save]')) return;
        result = {
          muscle: genSheet.querySelector('#guide-primary').value,
          guide: {
            primary: true,
            setup: genSheet.querySelector('#guide-setup').value.trim(),
            move: genSheet.querySelector('#guide-move').value.trim(),
            error: genSheet.querySelector('#guide-error').value.trim(),
            equipment: genSheet.querySelector('#guide-equipment').value.trim(),
            notes: genSheet.querySelector('#guide-notes').value.trim(),
            secondaryMuscles: [...genSheet.querySelectorAll('[data-secondary]:checked')].map(input => input.value),
          },
        };
        closeSheet();
      };
      openSheet(genSheet, () => resolve(result));
    });
  }

  const root = document.querySelector('#ex-list');
  if (root && typeof MutationObserver === 'function') new MutationObserver(applyFilters).observe(root, { childList: true });
  document.addEventListener('change', event => {
    const control = event.target.closest('[data-filter-muscle],[data-filter-equipment],[data-filter-favorite]');
    if (!control) return;
    if (control.matches('[data-filter-muscle]')) state.muscle = control.value;
    if (control.matches('[data-filter-equipment]')) state.equipment = control.value;
    if (control.matches('[data-filter-favorite]')) state.favorite = control.checked;
    applyFilters();
  });
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-guide-edit],[data-ex-favorite]');
    if (!button) return;
    const exercise = G.exercises.find(ex => ex.id === button.dataset.guideId);
    if (!exercise) return;
    event.preventDefault();
    event.stopPropagation();
    if (button.matches('[data-ex-favorite]')) {
      exercise.favorite = !exercise.favorite;
      await DB.put('exercises', exercise);
      button.textContent = exercise.favorite ? '★ Favorito' : '☆ Favorito';
      button.classList.toggle('on', exercise.favorite);
      applyFilters();
      return;
    }
    const result = await openGuideEditor(exercise);
    if (!result) return;
    exercise.muscle = result.muscle;
    exercise.guide = result.guide;
    await DB.put('exercises', exercise);
    gymDerive(); gymRenderAll(); refreshGuide(exercise); applyFilters();
  });

  window.GymExerciseTools = Object.freeze({ matches, applyFilters });
  applyFilters();
})();
