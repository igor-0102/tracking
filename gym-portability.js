/* Exporta entrenos y comparte un resumen revisable; nunca incluye notas privadas. */
'use strict';

(() => {
  // Nombres importados no deben convertirse en fórmulas al abrir el CSV en una hoja de cálculo.
  const cell = value => {
    const text = String(value ?? '').replace(/[\r\n]+/g, ' ');
    const numeric = typeof value === 'number' || /^\s*-?\d+(?:[.,]\d+)?\s*$/.test(text);
    const safe = !numeric && /^[\s\u0000-\u001f]*[=+@-]/.test(text) ? `'${text}` : text;
    return `"${safe.replace(/"/g, '""')}"`;
  };
  const dateOf = time => {
    const date = new Date(time);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  function makeWorkoutCsv(workouts, exercises) {
    const names = new Map(exercises.map(ex => [ex.id, ex.name]));
    const rows = [['Fecha', 'Entreno', 'Ejercicio', 'Serie', 'Peso (kg)', 'Repeticiones', 'Distancia (km)', 'Duración (s)']];
    for (const workout of workouts) for (const exercise of workout.exercises || []) {
      for (const [index, set] of (exercise.sets || []).entries()) rows.push([
        dateOf(workout.start), workout.title, names.get(exercise.exId) || 'Ejercicio borrado', index + 1,
        set.kg ?? '', set.reps ?? '', set.km ?? '', set.sec ?? '',
      ]);
    }
    return `\uFEFF${rows.map(row => row.map(cell).join(';')).join('\r\n')}`;
  }

  function duration(ms) {
    const total = Math.max(0, Math.floor(ms / 60000));
    return total < 60 ? `${total} min` : `${Math.floor(total / 60)} h ${total % 60} min`;
  }

  function makeShareSummary(workout, exercises) {
    const names = new Map(exercises.map(ex => [ex.id, ex.name]));
    const sets = (workout.exercises || []).flatMap(ex => ex.sets || []);
    const weightUnit = window.GymUnits ? window.GymUnits.unitFor('weight') : 'kg';
    const distanceUnit = window.GymUnits ? window.GymUnits.unitFor('distance') : 'km';
    const weightValue = value => window.GymUnits ? window.GymUnits.formatWeight(value) : Math.round(value * 100) / 100;
    const distanceValue = value => window.GymUnits ? window.GymUnits.formatDistance(value) : Math.round(value * 100) / 100;
    const list = (workout.exercises || []).map(ex => {
      const rows = ex.sets || [], best = rows.filter(set => set.kg || set.reps).sort((a, b) => (b.kg || 0) * (b.reps || 0) - (a.kg || 0) * (a.reps || 0))[0];
      const distance = rows.reduce((sum, set) => sum + (set.km || 0), 0);
      const seconds = rows.reduce((sum, set) => sum + (set.sec || 0), 0);
      const details = distance || seconds ? [distance && `${distanceValue(distance)} ${distanceUnit}`, seconds && duration(seconds * 1000)].filter(Boolean).join(' · ')
        : best && `${weightValue(best.kg || 0)} ${weightUnit} × ${best.reps || 0}`;
      return `• ${names.get(ex.exId) || 'Ejercicio'}: ${rows.length} series${details ? ` · ${details}` : ''}`;
    }).join('\n');
    const total = sets.reduce((sum, set) => sum + (set.kg || 0) * (set.reps || 0), 0);
    const volumeText = window.GymUnits ? window.GymUnits.formatWeight(total) : total.toLocaleString('es-ES');
    return [`${workout.title || 'Entreno'} · ${new Date(workout.start).toLocaleDateString('es-ES')}`,
      `Duración: ${duration((workout.end || workout.start) - workout.start)} · ${sets.length} series`,
      `Volumen: ${volumeText} ${weightUnit}`, list]
      .filter(Boolean).join('\n');
  }

  async function shareFile(name, text) {
    if (typeof isNative === 'function' && isNative() && typeof nativeCall === 'function') {
      const encoded = btoa(unescape(encodeURIComponent(text)));
      const file = await nativeCall('Filesystem', 'writeFile', { path: name, data: encoded, directory: 'CACHE', encoding: 'base64' });
      await nativeCall('Share', 'share', { title: 'Entrenos de Tracking', dialogTitle: 'Guardar o enviar el CSV', files: [file.uri] });
      return;
    }
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const anchor = document.createElement('a');
    anchor.href = URL.createObjectURL(blob); anchor.download = name;
    document.body.appendChild(anchor); anchor.click(); anchor.remove();
    setTimeout(() => URL.revokeObjectURL(anchor.href), 1000);
  }

  async function copySummary(text) {
    if (navigator.clipboard) return navigator.clipboard.writeText(text);
    const input = document.createElement('textarea');
    input.value = text; input.setAttribute('readonly', '');
    document.body.appendChild(input); input.select();
    const copied = document.execCommand('copy');
    input.remove();
    if (!copied) throw new Error('No se pudo copiar el resumen');
  }

  const cancelled = error => error && error.name === 'AbortError' || /cancel/i.test(String(error && error.message));

  async function exportWorkouts() {
    if (!G.workouts.length) return toast('No hay entrenos que exportar');
    try {
      await shareFile(`tracking-entrenos-${todayISO()}.csv`, makeWorkoutCsv(G.workouts, G.exercises));
      toast('Entrenos exportados');
    } catch (error) {
      if (!cancelled(error)) toast('No se pudo exportar el CSV');
    }
  }

  function openPreview(workout) {
    const preview = makeShareSummary(workout, G.exercises);
    genSheet.innerHTML = '<div class="grabber"></div><h2>Compartir entreno</h2><p class="fine">Vista previa. Las notas privadas no se incluyen.</p><textarea class="share-preview" readonly aria-label="Vista previa del resumen"></textarea><button class="btn btn-primary btn-block" data-share-send>Compartir</button><button class="btn btn-ghost btn-block" data-share-cancel>Cancelar</button>';
    genSheet.querySelector('.share-preview').value = preview;
    genSheet.onclick = async event => {
      if (event.target.closest('[data-share-cancel]')) { closeSheet(); return; }
      if (!event.target.closest('[data-share-send]')) return;
      closeSheet();
      try {
        if (typeof isNative === 'function' && isNative() && typeof nativeCall === 'function') await nativeCall('Share', 'share', { title: workout.title || 'Entreno de Tracking', text: preview, dialogTitle: 'Compartir entreno' });
        else if (navigator.share) await navigator.share({ title: workout.title || 'Entreno de Tracking', text: preview });
        else { await copySummary(preview); toast('Resumen copiado'); }
      } catch (error) { if (!cancelled(error)) toast('No se pudo compartir el resumen'); }
    };
    openSheet(genSheet, () => { genSheet.onclick = null; });
  }

  function addShareButton(container, workout) {
    const body = container && container.querySelector('.page-body');
    if (!body || body.querySelector('[data-gym-share]')) return;
    const button = document.createElement('button');
    button.className = 'btn btn-secondary btn-block'; button.dataset.gymShare = workout.id;
    button.textContent = 'Compartir resumen';
    const stats = body.querySelector('.stats');
    if (stats) stats.after(button); else body.append(button);
  }

  function installShareButtons() {
    const originalSummary = showSummary;
    showSummary = async (...args) => {
      await originalSummary(...args);
      const workout = args[0];
      const pages = document.querySelectorAll('body > .page');
      addShareButton(pages[pages.length - 1], workout);
    };
    const originalDetail = renderDetail;
    renderDetail = id => { originalDetail(id); addShareButton(curDetail && curDetail.el, G.workouts.find(w => w.id === id)); };
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-gym-share]');
    if (!button) return;
    const workout = G.workouts.find(item => item.id === button.dataset.gymShare);
    if (workout) openPreview(workout);
  });
  window.GymPortability = Object.freeze({ makeWorkoutCsv, makeShareSummary, duration, exportWorkouts, installShareButtons });
  installShareButtons();
})();
