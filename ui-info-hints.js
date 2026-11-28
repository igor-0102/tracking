/* Diccionario breve de términos: los botones se adjuntan al texto existente sin cambiar cálculos. */
'use strict';

(function exposeInfoHints(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.UiInfoHints = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function buildInfoHints() {
  const explanations = Object.freeze({
    tmb: 'TMB: energía aproximada que tu cuerpo usa en reposo para mantener sus funciones básicas.',
    get: 'GET: gasto diario estimado; incluye tu actividad y sirve como punto de partida para ajustar la dieta.',
    adjustment: 'El ajuste suma o resta calorías al GET para fijar tu objetivo. Es una estimación; contrástala con la evolución de varias semanas.',
    oneRm: '1RM estimado: peso máximo que podrías levantar una vez según una fórmula y tus repeticiones. Es orientativo, no una prueba real.',
    volume: 'Volumen: suma de la carga multiplicada por las repeticiones. No equivale por sí solo a la calidad del entreno.',
    pr: 'PR: récord personal registrado. El récord estimado usa una fórmula y puede variar respecto a una repetición máxima real.',
    superset: 'Superserie: dos o más ejercicios enlazados con poco descanso entre ellos.',
    dropSet: 'Drop set: serie en la que reduces el peso para seguir haciendo repeticiones tras acercarte al fallo.',
    workingSets: 'Series de trabajo: series que no son de calentamiento. La app las cuenta por separado de las series de preparación.',
    macros: 'Macronutrientes: proteínas, hidratos de carbono y grasas; aportan energía y cumplen funciones distintas en el cuerpo.',
  });
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();

  function hintFor(value) {
    const text = normalize(value);
    if (/metabolismo basal|^tmb(?: real)?$/.test(text)) return 'tmb';
    if (/gasto total|^get(?: real)?$/.test(text)) return 'get';
    if (/ajuste sobre el get|ajuste calorico/.test(text)) return 'adjustment';
    if (/1rm|rm estimado/.test(text)) return 'oneRm';
    if (/volumen/.test(text)) return 'volume';
    if (/\bpr\b|record(?:es)? personales?/.test(text)) return 'pr';
    if (/superserie/.test(text)) return 'superset';
    if (/drop ?set/.test(text)) return 'dropSet';
    if (/series de trabajo|series efectivas/.test(text)) return 'workingSets';
    if (/macros|macronutrientes/.test(text)) return 'macros';
    return null;
  }

  return Object.freeze({ explanations, normalize, hintFor });
});

(() => {
  if (typeof document === 'undefined' || typeof window === 'undefined') return;
  const { explanations, hintFor } = window.UiInfoHints;
  const selector = '.label, .section-title, h2, h3, summary, label.field > span, [data-info-term]';
  let nextId = 0;

  function addInfo(target) {
    if (target.dataset.infoHintReady || target.closest('.det-set')) return;
    const key = target.dataset.infoTerm || hintFor(target.textContent);
    if (key === 'adjustment' && /ajuste sobre el get/i.test(target.textContent)) return;
    if (target.querySelector('[data-get-info]')) return;
    if (!key || !explanations[key] || target.querySelector('[data-info-hint]')) return;
    target.dataset.infoHintReady = 'true';
    const id = `info-hint-${++nextId}`;
    const button = document.createElement('button');
    button.type = 'button'; button.className = 'get-info'; button.dataset.infoHint = key;
    button.setAttribute('aria-label', `Información: ${key === 'tmb' ? 'metabolismo basal' : key === 'get' ? 'gasto total' : 'término'}`);
    button.setAttribute('aria-controls', id); button.setAttribute('aria-expanded', 'false'); button.textContent = 'i';
    const help = document.createElement('small');
    help.className = 'fine info-hint-text'; help.id = id; help.dataset.infoHintText = key;
    help.hidden = true; help.textContent = explanations[key];
    target.append(' ', button, help);
  }

  function decorate(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    if (node.matches(selector)) addInfo(node);
    node.querySelectorAll(selector).forEach(addInfo);
  }

  document.addEventListener('click', event => {
    const button = event.target.closest('[data-info-hint]');
    if (!button) return;
    const help = document.getElementById(button.getAttribute('aria-controls'));
    if (!help) return;
    help.hidden = !help.hidden;
    button.setAttribute('aria-expanded', String(!help.hidden));
  });

  const observer = new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(decorate)));
  observer.observe(document.body, { childList: true, subtree: true });
  decorate(document.body);
})();
