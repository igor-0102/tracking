/* Añade ayuda breve junto al ajuste de calorías sobre el GET. */
'use strict';

(() => {
  const root = document.querySelector('#goal-box');
  if (!root) return;

  function addHelpButton() {
    root.querySelectorAll('[data-goal="pct"]').forEach(input => {
      const field = input.closest('.field');
      const label = field && field.children[0];
      if (!label || field.querySelector('[data-info="get-adjustment"]')) return;
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'info-btn';
      button.dataset.info = 'get-adjustment';
      button.setAttribute('aria-label', 'Qué significa el ajuste sobre el GET');
      button.textContent = 'i';
      label.appendChild(button);
    });
  }

  function openAdjustmentHelp() {
    genSheet.innerHTML = `<div class="grabber"></div><h2>¿Qué es el ajuste sobre el GET?</h2>
      <div class="info-text">
        <p>El ajuste es la variación de calorías respecto al <b>GET estimado</b>: −10 % deja el objetivo un 10 % por debajo (déficit), +10 % un 10 % por encima (superávit) y 0 % lo iguala.</p>
        <p>En deportistas, una referencia para perder peso gradualmente es <b>0,5–1 % del peso por semana</b>. No es universal ni garantiza evitar alteraciones hormonales: una disponibilidad energética baja puede afectarlas y el riesgo varía según la persona.</p>
      </div>
      <button class="btn btn-primary btn-block" id="get-adjustment-info-ok">Entendido</button>`;
    genSheet.onclick = event => { if (event.target.closest('#get-adjustment-info-ok')) closeSheet(); };
    openSheet(genSheet, () => { genSheet.onclick = null; });
  }

  addHelpButton();
  new MutationObserver(addHelpButton).observe(root, { childList: true, subtree: true });
  document.addEventListener('click', event => {
    if (!event.target.closest('[data-info="get-adjustment"]')) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    openAdjustmentHelp();
  }, true);
})();
