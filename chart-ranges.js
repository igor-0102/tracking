/* Tracking · botones de periodo del gráfico de peso (pequeño y pantalla completa) y su configuración.
   Los cálculos están en ranges.js. */
'use strict';

function chartPresets() {
  S.chartPresets = Ranges.normalizePresets(S.chartPresets);
  return S.chartPresets;
}
const smallRangeDays = r => (r === 'all' ? 'all' : Ranges.presetDays(chartPresets().small[r]));
function rangeButtons(list, attr, cur, short = false) {
  const btns = list.map((p, i) => `<button data-${attr}="${i}" class="${cur === i ? 'on' : ''}">${esc(Ranges.presetLabel(p, short))}</button>`);
  return btns.join('') + `<button data-${attr}="all" class="${cur === 'all' ? 'on' : ''}">Todo</button>`;
}

/* ---------- Gráfico pequeño (pestaña Peso) ---------- */
function renderRanges() {
  S.range = Ranges.migrateRange(S.range);
  $('#range-seg').innerHTML = rangeButtons(chartPresets().small, 'range', S.range, true)
    + '<button data-range="edit" class="rng-edit-btn" aria-label="Configurar los botones">✎</button>';
  chart.setRange(smallRangeDays(S.range));
}
$('#range-seg').addEventListener('click', async e => {
  const b = e.target.closest('[data-range]');
  if (!b) return;
  e.stopPropagation();
  if (b.dataset.range === 'edit') { openRangeEditor(); return; }
  S.range = b.dataset.range === 'all' ? 'all' : Number(b.dataset.range);
  renderRanges();
  await saveSettings();
});

/* ---------- Pantalla completa ---------- */
// Al abrir se conserva la vista del gráfico pequeño; solo se marca «Todo» si era la elegida.
function fsRangesSync() {
  $('#fs-range').innerHTML = rangeButtons(chartPresets().full, 'fr', S.range === 'all' ? 'all' : null, true);
}
$('#fs-range').addEventListener('click', e => {
  const b = e.target.closest('[data-fr]');
  if (!b) return;
  if (b.dataset.fr === 'all') fsChart.resetAll();
  else {
    fsChart.sel = -1;
    fsChart.setRange(Ranges.presetDays(chartPresets().full[Number(b.dataset.fr)]));
    fsChart.setYAuto(true);
  }
  $$('#fs-range button').forEach(x => x.classList.toggle('on', x === b));
});

/* ---------- Configurar los botones ---------- */
function presetRowHTML(group, i, p) {
  const opts = Ranges.UNITS.map(([u, l]) => `<option value="${u}"${p.u === u ? ' selected' : ''}>${l}</option>`).join('');
  return `<div class="field"><span>Botón ${i + 1}</span><span class="rng-edit">
    <input data-rg="${group}" data-ri="${i}" type="text" inputmode="numeric" value="${p.n}" aria-label="Cantidad">
    <select data-rgu="${group}" data-ri="${i}" aria-label="Unidad">${opts}</select></span></div>`;
}
function readRangeEditor() {
  const out = { small: [], full: [] };
  for (const inp of $$('[data-rg]', genSheet)) {
    const n = parseInt(inp.value, 10);
    if (!(n >= 1 && n <= 99)) return null;
    const u = $(`[data-rgu="${inp.dataset.rg}"][data-ri="${inp.dataset.ri}"]`, genSheet).value;
    out[inp.dataset.rg][Number(inp.dataset.ri)] = { n, u };
  }
  return out;
}
function openRangeEditor() {
  const cfg = chartPresets();
  genSheet.innerHTML = `<div class="grabber"></div><h2>Botones del gráfico</h2>
    <p class="fine">Elige qué periodo muestra cada botón. «Todo» siempre está.</p>
    <h3 class="section-title">Gráfico de la pestaña Peso</h3>
    <div class="card form-card">${cfg.small.map((p, i) => presetRowHTML('small', i, p)).join('')}</div>
    <h3 class="section-title">Pantalla completa</h3>
    <div class="card form-card">${cfg.full.map((p, i) => presetRowHTML('full', i, p)).join('')}</div>
    <button class="btn btn-primary btn-block btn-big" id="rg-ok" style="margin-top:14px">Guardar</button>
    <button class="btn btn-ghost btn-block" id="rg-reset">Volver a los de siempre</button>`;
  genSheet.onclick = async e => {
    if (e.target.closest('#rg-reset')) S.chartPresets = null;
    else if (e.target.closest('#rg-ok')) {
      const next = readRangeEditor();
      if (!next) { toast('Cada botón necesita un número entre 1 y 99'); return; }
      S.chartPresets = next;
    } else return;
    await saveSettings();
    closeSheet();
    renderRanges();
    toast('Botones del gráfico guardados');
  };
  openSheet(genSheet, () => { genSheet.onclick = null; });
}
