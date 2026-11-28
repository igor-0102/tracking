/* Conversiones puras para que el ajuste se pueda expresar en porcentaje o kcal por día. */
'use strict';

(function exposeDietAdjustment(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DietAdjustment = api;
})(typeof globalThis === 'undefined' ? this : globalThis, function buildDietAdjustment() {
  const parseNumber = value => {
    const text = String(value ?? '').trim();
    if (!text) return null;
    const number = Number(text.replace(/[\s−–]/g, match => match.trim() ? '-' : '').replace(',', '.'));
    return Number.isFinite(number) ? number : null;
  };
  const caloriesForAdjustment = (get, percent) => Number.isFinite(get) && get > 0 && Number.isFinite(percent) ? get * percent / 100 : null;
  const percentForAdjustment = (get, calories) => Number.isFinite(get) && get > 0 && Number.isFinite(calories) ? calories / get * 100 : null;

  function fatRangePerKg(calories, weightKg) {
    if (!(calories > 0) || !(weightKg > 0)) return null;
    return { min: calories * 0.15 / 9 / weightKg, max: calories * 0.30 / 9 / weightKg };
  }

  function aggressiveDeficitExample(weightKg, kcalPerKg = 7000) {
    if (!(weightKg > 0) || !(kcalPerKg > 0)) return null;
    const maxWeeklyLossKg = weightKg * 0.01;
    const weeklyDeficit = maxWeeklyLossKg * kcalPerKg;
    return { maxWeeklyLossKg, weeklyDeficit, dailyDeficit: weeklyDeficit / 7 };
  }

  return Object.freeze({ parseNumber, caloriesForAdjustment, percentForAdjustment, fatRangePerKg, aggressiveDeficitExample });
});
