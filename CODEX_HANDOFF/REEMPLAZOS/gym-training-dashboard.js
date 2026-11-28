/* Muestra el último entreno al entrar y añade análisis comprensible a entrenos y ejercicios. */
'use strict';

(() => {
  const metrics = GymDashboardAnalysis;
  const escape = value => esc(String(value || ''));

  function exerciseAnalysisCard(id) {
    const sessions = exHist.get(id) || [];
    const data = metrics.analyzeExercise(sessions);
    if (!data.sessionCount) return null;
    const card = document.createElement('section');
    card.className = 'card exercise-analysis';
    const topSet = data.recentTopSet ? fmtSet(data.recentTopSet) : 'Sin series con carga';
    const best = data.personalBest1RM;
    const trend = data.estimated1RMDeltaKg == null ? 'Registra otra sesión para comparar tu progreso.'
      : `1RM estimado frente a la sesión anterior: ${data.estimated1RMDeltaKg >= 0 ? '+' : ''}${GymUnits.formatWeight(data.estimated1RMDeltaKg)} ${GymUnits.unitFor('weight')}.`;
    card.innerHTML = `<div class="card-head"><h3>Análisis del ejercicio</h3><span class="sub">${data.sessionCount} ${data.sessionCount === 1 ? 'sesión' : 'sesiones'}</span></div>
      <div class="stats stats-2">
        <div class="stat"><div class="label" data-info-term="pr">Récord estimado (1RM)</div><div class="val" data-metric="best"></div><small class="sub" data-metric="best-date"></small></div>
        <div class="stat"><div class="label">Peso máximo</div><div class="val" data-metric="max-weight"></div></div>
        <div class="stat"><div class="label" data-info-term="volume">Volumen de la última sesión</div><div class="val" data-metric="volume"></div><small class="sub" data-metric="set-count"></small></div>
        <div class="stat"><div class="label" data-info-term="oneRm">Mejor serie reciente</div><div class="val" data-metric="top-set"></div></div>
      </div><p class="fine" data-metric="trend"></p>`;
    card.querySelector('[data-metric="best"]').textContent = best
      ? `${GymUnits.formatWeight(best.kg)} ${GymUnits.unitFor('weight')}` : '—';
    card.querySelector('[data-metric="best-date"]').textContent = best?.workout ? `Mejor marca: ${fmtWDate(best.workout.start)}` : '';
    card.querySelector('[data-metric="max-weight"]').textContent = `${GymUnits.formatWeight(data.maxWeightKg)} ${GymUnits.unitFor('weight')}`;
    card.querySelector('[data-metric="volume"]').textContent = `${GymUnits.formatWeight(data.recentVolumeKg)} ${GymUnits.unitFor('weight')}`;
    card.querySelector('[data-metric="set-count"]').textContent = `${data.recentSetCount} series de trabajo`;
    card.querySelector('[data-metric="top-set"]').textContent = topSet;
    card.querySelector('[data-metric="trend"]').textContent = trend;
    return card;
  }

  function workoutExerciseRow(exercise, workout) {
    const session = (exHist.get(exercise.exId) || []).find(item => item.w.id === workout.id);
    const data = metrics.analyzeExercise(session ? [session] : []);
    const name = exName(exercise.exId);
    const record = workoutPRs(workout).some(item => item.exId === exercise.exId);
    const summary = data.recentTopSet ? fmtSet(data.recentTopSet) : `${data.recentSetCount} series`;
    return `<button class="hist-row dashboard-exercise" data-dashboard-exercise="${escape(exercise.exId)}">
      <span class="hist-date">${escape(name)}${record ? ' 🏆' : ''}<small>${escape(summary)}</small></span><span class="sub">${escape(exById.get(exercise.exId)?.muscle || '')}</span>${chevIcon}</button>`;
  }

  function renderDashboard() {
    const root = document.querySelector('#gym-resumen');
    if (!root) return;
    const workout = G.workouts[0];
    if (!workout) {
      root.innerHTML = `<div class="card dashboard-empty"><h2>Tu último entreno</h2><p>Aquí verás un resumen de la sesión más reciente, sus marcas y el progreso por ejercicio.</p>
        <button class="btn btn-primary btn-block" data-dashboard-routines>Ver rutinas y empezar</button></div>`;
      return;
    }
    const data = metrics.analyzeWorkout(workout, workoutPRs(workout).length);
    const comparison = window.GymSummaryComparison?.comparison(workout, G.workouts);
    root.innerHTML = `<div class="card dashboard-latest">
      <div class="card-head"><div><div class="label">Último entrenamiento</div><h2>${escape(workout.title || 'Entreno')}</h2><p class="sub">${escape(fmtWDate(workout.start))}</p></div>
        <button class="btn btn-small btn-ghost" data-dashboard-detail>Ver sesión</button></div>
      <div class="stats stats-2">
        <div class="stat"><div class="label">Duración</div><div class="val">${escape(fmtDur(data.durationMs))}</div></div>
        <div class="stat"><div class="label" data-info-term="volume">Volumen</div><div class="val">${escape(GymUnits.formatWeight(data.volumeKg))} ${escape(GymUnits.unitFor('weight'))}</div></div>
        <div class="stat"><div class="label" data-info-term="workingSets">Series de trabajo</div><div class="val">${data.setCount}</div></div>
        <div class="stat"><div class="label" data-info-term="pr">Récords personales</div><div class="val">${data.recordCount || '—'}</div></div>
      </div><p class="fine">El volumen suma carga × repeticiones; las series de calentamiento se excluyen.</p>
      ${data.volumeKg ? '' : '<p class="fine">Esta sesión no registra cargas externas; el volumen no se puede calcular.</p>'}
    </div><h3 class="section-title">Ejercicios de esta sesión</h3>
      <div class="card list-wrap">${workout.exercises.map(exercise => workoutExerciseRow(exercise, workout)).join('') || '<p class="fine center">La sesión no incluye ejercicios.</p>'}</div>`;
    if (comparison) {
      const card = window.GymSummaryComparison.comparisonCard(comparison);
      if (card) root.querySelector('.dashboard-latest').append(card);
    }
  }

  function enableDashboardNavigation() {
    const tabbar = document.querySelector('#tabbar');
    tabbar?.addEventListener('click', event => {
      if (event.target.closest('[data-tab="entreno"]')) showGymView('resumen');
    }, true);
    const root = document.querySelector('#gym-resumen');
    root?.addEventListener('click', event => {
      if (event.target.closest('[data-dashboard-routines]')) showGymView('rutinas');
      else if (event.target.closest('[data-dashboard-detail]')) G.workouts[0] && openWorkoutDetail(G.workouts[0].id);
      else {
        const button = event.target.closest('[data-dashboard-exercise]');
        if (button) openExercise(button.dataset.dashboardExercise);
      }
    });
  }

  function extendTrainingViews() {
    const original = showGymView;
    showGymView = function showGymViewWithDashboard(view, save = true) {
      original(view, save);
      const summary = document.querySelector('#gym-resumen');
      if (summary) summary.hidden = view !== 'resumen';
      renderDashboard();
    };
    const renderAll = gymRenderAll;
    gymRenderAll = function renderAllWithDashboard(...args) {
      renderAll(...args);
      renderDashboard();
    };
    const open = openExercise;
    openExercise = function openExerciseWithAnalysis(id) {
      open(id);
      const page = [...document.querySelectorAll('body > .page')].at(-1);
      const body = page?.querySelector('.page-body');
      const anchor = body?.querySelector('.stats') || body?.querySelector('.exercise-guide');
      const card = exerciseAnalysisCard(id);
      if (anchor && card) anchor.before(card);
    };
  }

  enableDashboardNavigation();
  extendTrainingViews();
  window.GymTrainingDashboard = Object.freeze({ renderDashboard, exerciseAnalysisCard, workoutExerciseRow });
})();
