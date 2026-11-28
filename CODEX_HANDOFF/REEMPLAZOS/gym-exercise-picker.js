/* Sustituye el selector libre por el catálogo integrado, conservando los ejercicios del usuario. */
'use strict';

(() => {
  const catalog = ExerciseCatalog;
  const normalize = value => catalog.normalize(value);
  const escape = value => esc(String(value || ''));
  const usage = id => (exHist.get(id) || []).length;
  const matchesQuery = (exercise, query) => {
    const terms = normalize(query).split(' ').filter(Boolean);
    const words = normalize([exercise.name, exercise.muscle, exercise.guide?.equipment].join(' ')).split(' ').filter(Boolean);
    return terms.every(term => words.some(word => word.includes(term) || term.includes(word)));
  };

  function existingCatalogExercises() {
    return new Map(G.exercises.map(ex => [normalize(ex.name), ex]));
  }

  function pickerItems(query) {
    const existing = existingCatalogExercises();
    const rows = catalog.search(query).map(item => ({
      key: existing.get(normalize(item.name))?.id || `catalog:${item.id}`,
      name: existing.get(normalize(item.name))?.name || item.name,
      muscle: item.muscle, equipment: item.equipment, item,
      times: usage(existing.get(normalize(item.name))?.id || ''),
    }));
    const known = new Set(catalog.exercises.map(item => normalize(item.name)));
    const personal = G.exercises.filter(ex => !known.has(normalize(ex.name)) && matchesQuery(ex, query))
      .map(ex => ({ key: ex.id, name: ex.name, muscle: ex.muscle || 'Otro', equipment: ex.guide?.equipment || 'Propio', item: null, times: usage(ex.id) }));
    return { catalogRows: rows, personalRows: personal };
  }

  function rowHTML(row, selected) {
    return `<button class="pick-item${selected ? ' on' : ''}" data-pick-id="${escape(row.key)}" aria-pressed="${selected}">
      <span>${escape(row.name)}<small>${escape(row.muscle)} · ${escape(row.equipment)}${row.times ? ` · ${row.times} sesiones` : ''}</small></span><i>${checkIcon}</i></button>`;
  }

  function selectedHTML(items, selected) {
    return `<div class="pick-section"><b>Catálogo local (${items.length})</b>${items.map(item => rowHTML(item, selected.includes(item.key))).join('')}</div>`;
  }

  function drawPicker(list, query, selected, okButton, multi) {
    const { catalogRows, personalRows } = pickerItems(query.value.trim());
    const exact = [...catalogRows, ...personalRows].some(item => normalize(item.name) === normalize(query.value));
    let html = selectedHTML(catalogRows, selected);
    if (personalRows.length) html += `<div class="pick-section"><b>Tus ejercicios (${personalRows.length})</b>${personalRows.map(item => rowHTML(item, selected.includes(item.key))).join('')}</div>`;
    if (query.value.trim() && !exact) html += `<button class="pick-item create" data-pick-create="true">＋ Crear «${escape(query.value.trim())}»</button>`;
    if (!catalogRows.length && !personalRows.length && !query.value.trim()) html = '<p class="fine center">El catálogo no se ha podido cargar.</p>';
    if (!catalogRows.length && !personalRows.length && query.value.trim()) html += '<p class="fine center">No hay coincidencias. Puedes crear este ejercicio.</p>';
    list.innerHTML = html;
    okButton.disabled = !selected.length;
    okButton.hidden = !multi;
    okButton.textContent = selected.length ? `Añadir (${selected.length})` : 'Añadir';
  }

  function catalogExercise(item) {
    const guide = window.GymExerciseGuide?.find(item.name);
    return {
      id: uid(), name: item.name, muscle: item.muscle, rest: null,
      catalogId: item.id,
      guide: {
        primary: true, setup: guide?.setup || '', move: guide?.move || '', error: guide?.error || '',
        equipment: item.equipment, secondaryMuscles: [...item.secondary],
      },
    };
  }

  async function storeSelection(key) {
    if (!String(key).startsWith('catalog:')) return key;
    const item = catalog.exercises.find(ex => ex.id === String(key).slice(8));
    if (!item) throw new Error('El ejercicio ya no está disponible en el catálogo.');
    const duplicate = G.exercises.find(ex => normalize(ex.name) === normalize(item.name));
    if (duplicate) return duplicate.id;
    const exercise = catalogExercise(item);
    await DB.put('exercises', exercise);
    G.exercises.push(exercise);
    gymDerive();
    return exercise.id;
  }

  async function createCustomExercise(name) {
    const clean = String(name || '').trim().slice(0, 100);
    if (!clean) return null;
    const found = G.exercises.find(ex => normalize(ex.name) === normalize(clean));
    if (found) return found.id;
    const exercise = { id: uid(), name: clean, muscle: guessMuscle(clean), rest: null };
    await DB.put('exercises', exercise);
    G.exercises.push(exercise);
    gymDerive();
    return exercise.id;
  }

  function pickExercises({ multi = true, title = 'Añadir ejercicios' } = {}) {
    return new Promise(resolve => {
      const selected = [];
      let result = null;
      genSheet.innerHTML = `<div class="grabber"></div><h2>${escape(title)}</h2>
        <p class="fine">Busca por ejercicio, grupo muscular o material. Este catálogo funciona sin conexión.</p>
        <div class="search"><input type="search" id="pk-q" placeholder="Ej.: press, espalda o mancuernas" autocomplete="off"></div>
        <div class="pick-list" id="pk-list"></div>
        <button class="btn btn-primary btn-block" id="pk-ok" disabled>Añadir</button>`;
      const list = $('#pk-list', genSheet), query = $('#pk-q', genSheet), okButton = $('#pk-ok', genSheet);
      const draw = () => drawPicker(list, query, selected, okButton, multi);
      query.addEventListener('input', draw);
      list.addEventListener('click', async event => {
        const button = event.target.closest('[data-pick-id], [data-pick-create]');
        if (!button) return;
        try {
          const key = button.dataset.pickCreate ? `custom:${query.value.trim()}` : button.dataset.pickId;
          if (!multi) {
            const id = key.startsWith('custom:') ? await createCustomExercise(key.slice(7)) : await storeSelection(key);
            if (id) { result = [id]; closeSheet(); }
            return;
          }
          const index = selected.indexOf(key);
          if (index >= 0) selected.splice(index, 1); else selected.push(key);
          draw();
        } catch (error) { toast(error.message || 'No se pudo guardar el ejercicio.'); }
      });
      okButton.onclick = async () => {
        okButton.disabled = true;
        try {
          result = [];
          for (const key of selected) result.push(key.startsWith('custom:') ? await createCustomExercise(key.slice(7)) : await storeSelection(key));
          closeSheet();
        } catch (error) { result = null; toast(error.message || 'No se pudieron guardar los ejercicios.'); draw(); }
      };
      draw();
      openSheet(genSheet, () => resolve(result));
    });
  }

  // Classic scripts comparten este binding; mantener el nombre evita tocar gym.js.
  window.GymExercisePicker = Object.freeze({ pickerItems, catalogExercise, storeSelection, pickExercises });
})();

// Reemplaza la función global que usan tanto las rutinas como los entrenos en curso.
pickExercises = window.GymExercisePicker.pickExercises;
