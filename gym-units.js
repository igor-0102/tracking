/* Unidades solo de presentación: los entrenos siguen guardando kg, km y segundos. */
'use strict';

(() => {
  const lbPerKg = 2.2046226218;
  const unitFor = kind => kind === 'weight' ? (S.gymWeightUnit === 'lb' ? 'lb' : 'kg') : (S.gymDistanceUnit === 'mi' ? 'mi' : 'km');
  const displayNumber = value => fmtN(Math.round(value * 100) / 100);
  const numberFromInput = value => {
    const text = String(value || '').trim().replace(',', '.');
    return /^\d+(\.\d{1,2})?$/.test(text) ? Number(text) : NaN;
  };

  function formatWeight(kg) { return kg == null ? '' : displayNumber(unitFor('weight') === 'lb' ? kg * lbPerKg : kg); }
  function parseWeight(value) { const n = numberFromInput(value); return Number.isFinite(n) ? (unitFor('weight') === 'lb' ? n / lbPerKg : n) : NaN; }
  function formatDistance(km) { return km == null ? '' : displayNumber(unitFor('distance') === 'mi' ? km * 0.6213711922 : km); }
  function parseDistance(value) { const n = numberFromInput(value); return Number.isFinite(n) ? (unitFor('distance') === 'mi' ? n / 0.6213711922 : n) : NaN; }
  function parseDuration(value) { const n = numberFromInput(value); return Number.isFinite(n) ? Math.round(n * 60) : NaN; }
  function formatDuration(seconds) { return seconds == null ? '' : displayNumber(seconds / 60); }
  function isDistanceExercise(id) {
    const exercise = exById.get(id);
    return !!exercise && (exercise.muscle === 'Cardio' || /correr|cinta|running|treadmill|bicicleta|bici|cycling|spinning|eliptica|elíptica|elliptical|remo indoor|ergometro/i.test(exercise.name));
  }

  function updateSettings() {
    const weight = document.querySelector('#set-weight-unit');
    const distance = document.querySelector('#set-distance-unit');
    if (weight) weight.querySelectorAll('[data-unit]').forEach(button => button.classList.toggle('on', button.dataset.unit === unitFor('weight')));
    if (distance) distance.querySelectorAll('[data-unit]').forEach(button => button.classList.toggle('on', button.dataset.unit === unitFor('distance')));
  }

  function repaint() {
    if (typeof gymRenderAll === 'function') gymRenderAll();
    if (typeof wkPage !== 'undefined' && wkPage) renderWk();
    if (typeof curDetail !== 'undefined' && curDetail) renderDetail(curDetail.wid);
    updateSettings();
  }

  function setUnit(kind, value) {
    if (!['kg', 'lb', 'km', 'mi'].includes(value)) return;
    if (kind === 'weight') S.gymWeightUnit = value; else S.gymDistanceUnit = value;
    saveSettings(); repaint();
  }

  const baseSettings = renderGymSettings;
  renderGymSettings = () => { baseSettings(); updateSettings(); };
  const baseBackup = backupData;
  backupData = () => {
    const data = baseBackup();
    return { ...data, settings: { ...data.settings, gymWeightUnit: unitFor('weight'), gymDistanceUnit: unitFor('distance') } };
  };
  const baseGymImport = gymImportBackup;
  gymImportBackup = async data => {
    await baseGymImport(data);
    const settings = data && data.settings;
    if (settings && ['kg', 'lb'].includes(settings.gymWeightUnit)) S.gymWeightUnit = settings.gymWeightUnit;
    if (settings && ['km', 'mi'].includes(settings.gymDistanceUnit)) S.gymDistanceUnit = settings.gymDistanceUnit;
    if (settings && (settings.gymWeightUnit || settings.gymDistanceUnit)) await saveSettings();
    updateSettings();
  };
  document.querySelector('#set-weight-unit')?.addEventListener('click', event => {
    const button = event.target.closest('[data-unit]');
    if (button) setUnit('weight', button.dataset.unit);
  });
  document.querySelector('#set-distance-unit')?.addEventListener('click', event => {
    const button = event.target.closest('[data-unit]');
    if (button) setUnit('distance', button.dataset.unit);
  });

  window.GymUnits = Object.freeze({ unitFor, formatWeight, parseWeight, formatDistance, parseDistance, parseDuration, formatDuration, isDistanceExercise });
  updateSettings();
})();
