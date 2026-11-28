/* Aclara el ajuste energético sin tocar el cálculo nutricional ni introducir dependencias. */
'use strict';

(() => {
  const message = 'Este porcentaje suma o resta calorías al GET estimado. En pérdida de grasa deportiva se usa 0,5–1 % del peso por semana como orientación, no como límite universal. El 1 % no garantiza evitar daño hormonal: una disponibilidad energética muy baja o prolongada puede afectar la salud. Si tienes síntomas o una enfermedad, consulta con un profesional.';
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
