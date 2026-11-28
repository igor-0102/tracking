/* Aclara el ajuste energético sin tocar el cálculo nutricional ni introducir dependencias. */
'use strict';

(() => {
  const example = window.DietAdjustment?.aggressiveDeficitExample(80) || { maxWeeklyLossKg: 0.8, weeklyDeficit: 5600, dailyDeficit: 800 };
  const message = `Este ajuste suma o resta calorías al GET. Como ejemplo teórico, con 80 kg, perder el 1 % serían ${String(example.maxWeeklyLossKg).replace('.', ',')} kg/semana; usando una equivalencia aproximada de 7.000 kcal/kg, serían unas ${Math.round(example.weeklyDeficit)} kcal/semana o ${Math.round(example.dailyDeficit)} kcal/día de déficit. Es un extremo ilustrativo, no una meta para todos: la regla de kcal no predice exactamente el peso porque el cuerpo se adapta. En preparación deportiva se usa a veces 0,5–1 % semanal para conservar masa, pero no es un límite universal ni garantiza evitar cambios hormonales.`;
  window.DietGetInfo = Object.freeze({ message });

  function addInfo(root) {
    const input = root.querySelector('[data-goal="pct"]');
    const label = input && input.closest('label.field');
    const title = label && label.querySelector('span');
    if (!title || title.querySelector('[data-get-info]')) return;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'get-info'; button.dataset.getInfo = 'true';
    button.setAttribute('aria-label', 'Información sobre el ajuste del GET');
    button.setAttribute('aria-expanded', 'false'); button.textContent = 'i';
    const help = document.createElement('small');
    help.className = 'fine get-info-text'; help.dataset.getInfoText = 'true'; help.hidden = true; help.textContent = message;
    title.append(' ', button); label.append(help);
  }

  const root = document.querySelector('#goal-box');
  if (!root) return;
  new MutationObserver(() => addInfo(root)).observe(root, { childList: true, subtree: true });
  root.addEventListener('click', event => {
    const button = event.target.closest('[data-get-info]');
    if (!button) return;
    const help = button.closest('label').querySelector('[data-get-info-text]');
    help.hidden = !help.hidden;
    button.setAttribute('aria-expanded', String(!help.hidden));
  });
  addInfo(root);
})();
