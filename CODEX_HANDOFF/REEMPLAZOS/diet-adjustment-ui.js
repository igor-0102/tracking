/* Añade entrada de ajuste en kcal o porcentaje y ayuda con rangos nutricionales basados en fuentes. */
'use strict';

(() => {
  const root = document.querySelector('#goal-box');
  if (!root) return;
  const state = { mode: 'pct', initialized: false, hintId: 0 };
  const numberText = value => Number(value).toFixed(1).replace('.', ',');
  const config = () => S.dietGoal[goalEditDay];
  const getValue = () => profileCalc().get;

  function adjustmentText(input) {
    const get = getValue(), value = DietAdjustment.parseNumber(input.value);
    if (!(get > 0) || value == null) return 'Completa tu perfil para convertir entre porcentaje y kcal.';
    if (input.dataset.goal === 'kcal-adjust') {
      const percent = DietAdjustment.percentForAdjustment(get, value);
      return `Equivale al ${numberText(percent)} % del GET.`;
    }
    const kcal = DietAdjustment.caloriesForAdjustment(get, value);
    return kcal < 0 ? `Equivale a un déficit de ${numberText(Math.abs(kcal))} kcal/día.`
      : kcal > 0 ? `Equivale a un superávit de ${numberText(kcal)} kcal/día.` : 'No añade ni resta calorías al GET.';
  }

  function updatePreview(label, input) {
    const preview = label.querySelector('[data-adjustment-preview]');
    if (preview) preview.textContent = adjustmentText(input);
  }

  function applyMode(label, input, switcher) {
    const desired = S.calorieAdjustmentMode === 'kcal' ? 'kcal' : 'pct';
    const get = getValue();
    state.mode = desired === 'kcal' && !(get > 0) ? 'pct' : desired;
    if (state.mode === 'kcal' && input.dataset.goal === 'pct') {
      const difference = DietAdjustment.caloriesForAdjustment(get, Number(config().pct) || 0);
      input.value = numberText(difference);
      input.dataset.goal = 'kcal-adjust';
    } else if (state.mode === 'pct' && input.dataset.goal === 'kcal-adjust') {
      input.value = String(config().pct).replace('.', ',');
      input.dataset.goal = 'pct';
    }
    const unit = label.querySelector('.input-unit em');
    if (unit) unit.textContent = state.mode === 'kcal' ? 'kcal/día' : '%';
    input.setAttribute('inputmode', 'decimal');
    switcher.querySelectorAll('[data-adjust-mode]').forEach(button => {
      button.classList.toggle('on', button.dataset.adjustMode === state.mode);
      button.disabled = button.dataset.adjustMode === 'kcal' && !(get > 0);
    });
    updatePreview(label, input);
  }

  function addAdjustmentControls() {
    const input = root.querySelector('[data-goal="pct"], [data-goal="kcal-adjust"]');
    const label = input?.closest('label.field');
    if (!input || !label) return;
    let switcher = root.querySelector('[data-adjustment-mode]');
    if (!switcher) {
      switcher = document.createElement('div');
      switcher.className = 'seg seg-small seg-block adjustment-mode';
      switcher.dataset.adjustmentMode = 'true';
      switcher.setAttribute('aria-label', 'Unidad del ajuste');
      switcher.innerHTML = '<button type="button" data-adjust-mode="pct">Porcentaje</button><button type="button" data-adjust-mode="kcal">kcal al día</button>';
      label.before(switcher);
    }
    let preview = label.querySelector('[data-adjustment-preview]');
    if (!preview) {
      preview = document.createElement('small');
      preview.className = 'fine adjustment-preview'; preview.dataset.adjustmentPreview = 'true';
      label.append(preview);
    }
    if (!state.initialized) { state.mode = S.calorieAdjustmentMode === 'kcal' ? 'kcal' : 'pct'; state.initialized = true; }
    applyMode(label, input, switcher);
  }

  function proteinMessage() {
    return 'Para personas sanas que entrenan, la ISSN propone 1,4–2,0 g/kg al día. Una revisión de entrenamiento de fuerza encontró que el beneficio medio tiende a estabilizarse cerca de 1,6 g/kg/día. Es una referencia, no una necesidad individual.';
  }

  function fatMessage() {
    const profile = profileCalc(), cfg = config();
    const calories = profile.get > 0 ? profile.get * (1 + (Number(cfg.pct) || 0) / 100) : 0;
    const range = DietAdjustment.fatRangePerKg(calories, profile.kg);
    const source = 'La OMS recomienda que la grasa total aporte aproximadamente el 15–30 % de la energía diaria y prioriza las grasas insaturadas.';
    return range ? `${source} Para tu objetivo actual (${Math.round(calories)} kcal y ${numberText(profile.kg)} kg), equivale aprox. a ${numberText(range.min)}–${numberText(range.max)} g/kg/día.`
      : `${source} El equivalente en g/kg depende de tu objetivo de calorías y de tu peso.`;
  }

  function addMacroInfo() {
    root.querySelectorAll('label.field > span').forEach(title => {
      const key = title.textContent.trim().toLowerCase();
      const type = key === 'proteína' ? 'protein' : key === 'grasa' ? 'fat' : '';
      if (!type || title.querySelector('[data-macro-info]')) return;
      const id = `macro-info-${++state.hintId}`;
      const button = document.createElement('button');
      button.type = 'button'; button.className = 'get-info'; button.dataset.macroInfo = type;
      button.setAttribute('aria-controls', id); button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-label', `Recomendación de ${type === 'protein' ? 'proteína' : 'grasa'}`); button.textContent = 'i';
      const help = document.createElement('small');
      help.className = 'fine info-hint-text'; help.id = id; help.hidden = true; help.textContent = type === 'protein' ? proteinMessage() : fatMessage();
      title.append(' ', button, help);
    });
  }

  root.addEventListener('click', event => {
    const modeButton = event.target.closest('[data-adjust-mode]');
    if (modeButton) {
      if (modeButton.dataset.adjustMode === 'kcal' && !(getValue() > 0)) return toast('Completa el perfil para convertir a kcal.');
      S.calorieAdjustmentMode = modeButton.dataset.adjustMode;
      saveSettings();
      addAdjustmentControls();
      return;
    }
    const hintButton = event.target.closest('[data-macro-info]');
    if (!hintButton) return;
    const help = document.getElementById(hintButton.getAttribute('aria-controls'));
    if (!help) return;
    if (hintButton.dataset.macroInfo === 'fat') help.textContent = fatMessage();
    help.hidden = !help.hidden;
    hintButton.setAttribute('aria-expanded', String(!help.hidden));
  });

  root.addEventListener('input', event => {
    const input = event.target.closest('[data-goal="pct"], [data-goal="kcal-adjust"]');
    if (input) updatePreview(input.closest('label.field'), input);
  });

  // Consume solo el cambio en modo kcal: gym.js sigue guardando el porcentaje convertido.
  document.addEventListener('change', async event => {
    const input = event.target;
    if (!input.matches('#goal-box [data-goal="kcal-adjust"]')) return;
    event.stopImmediatePropagation();
    const get = getValue(), calories = DietAdjustment.parseNumber(input.value);
    const percent = DietAdjustment.percentForAdjustment(get, calories);
    if (percent == null || Math.abs(percent) > 50) {
      toast('El ajuste debe estar entre −50 % y +50 % del GET.');
      input.value = numberText(DietAdjustment.caloriesForAdjustment(get, Number(config().pct) || 0));
      updatePreview(input.closest('label.field'), input);
      return;
    }
    config().pct = percent;
    await saveProfile();
  }, true);

  const observer = new MutationObserver(() => { addAdjustmentControls(); addMacroInfo(); });
  observer.observe(root, { childList: true, subtree: true });
  addAdjustmentControls();
  addMacroInfo();
  window.DietAdjustmentUI = Object.freeze({ proteinMessage, fatMessage, adjustmentText });
})();
