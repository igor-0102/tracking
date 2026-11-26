/* Tracking · periodos de los botones del gráfico de peso. Funciones puras, con tests.
   Un periodo es { n, u }: n de 1 a 99 y u = 'd' (días), 'w' (semanas), 'm' (meses) o 'y' (años). */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.Ranges = api;
})(typeof self !== 'undefined' ? self : globalThis, function () {
  'use strict';

  const UNIT_DAYS = { d: 1, w: 7, m: 30.44, y: 365.25 };
  const UNITS = [['d', 'días'], ['w', 'semanas'], ['m', 'meses'], ['y', 'años']];
  // Por defecto: los botones que ya había (Semana, Mes, 3M) y los pedidos en pantalla completa (1M, 3M, 6M).
  const DEFAULTS = {
    small: [{ n: 1, u: 'w' }, { n: 1, u: 'm' }, { n: 3, u: 'm' }],
    full: [{ n: 1, u: 'm' }, { n: 3, u: 'm' }, { n: 6, u: 'm' }],
  };
  const MAX_PRESETS = 10;      // botones por gráfico, además de «Todo»
  const copy = list => list.map(p => ({ n: p.n, u: p.u }));

  const validPreset = p => !!p && Object.prototype.hasOwnProperty.call(UNIT_DAYS, p.u) && Number.isInteger(p.n) && p.n >= 1 && p.n <= 99;
  const presetDays = p => Math.max(1, Math.round(p.n * UNIT_DAYS[p.u]));
  // short: nombre corto siempre (1M, 3M…), para la pantalla completa.
  function presetLabel(p, short = false) {
    if (p.n === 1 && !short) return { d: 'Día', w: 'Semana', m: 'Mes', y: 'Año' }[p.u];
    return `${p.n}${{ d: 'D', w: 'S', m: 'M', y: 'A' }[p.u]}`;
  }
  // Configuración guardada → de 0 a 10 periodos válidos por gráfico (si algo falla, los de siempre).
  function normalizePresets(cfg) {
    const pick = key => {
      const list = cfg && Array.isArray(cfg[key]) ? cfg[key] : null;
      return list && list.length <= MAX_PRESETS && list.every(validPreset) ? copy(list) : copy(DEFAULTS[key]);
    };
    return { small: pick('small'), full: pick('full') };
  }
  // Botón elegido (o el de versiones anteriores: '1w', '1m', '3m', '6m', 'all') → índice válido o 'all'.
  function migrateRange(r, count = 3) {
    if (r === 'all') return 'all';
    const i = Number.isInteger(r) ? r : { '1w': 0, '1m': 1, '3m': 2, '6m': 2 }[r];
    if (Number.isInteger(i) && i >= 0 && i < count) return i;
    return count > 0 ? Math.min(2, count - 1) : 'all';
  }

  return { UNITS, DEFAULTS, MAX_PRESETS, validPreset, presetDays, presetLabel, normalizePresets, migrateRange };
});
