/* Tracking · botones de periodo del gráfico de peso (pequeño y pantalla completa) y su configuración.
   Los botones van en un recuadro que se desliza con el dedo; «Todo» (y el lápiz, en el pequeño) siempre están.
   Los cálculos están en ranges.js. */
'use strict';

function chartPresets() {
  S.chartPresets = Ranges.normalizePresets(S.chartPresets);
  return S.chartPresets;
}
const smallRangeDays = r => (r === 'all' ? 'all' : Ranges.presetDays(chartPresets().small[r]));
function rangeButtons(list, attr, cur) {
  const btns = list.map((p, i) => `<button data-${attr}="${i}" class="${cur === i ? 'on' : ''}">${esc(Ranges.presetLabel(p, true))}</button>`);
  return btns.join('') + `<button data-${attr}="all" class="${cur === 'all' ? 'on' : ''}">Todo</button>`;
}
// Lleva el botón activo a la vista dentro del recuadro deslizable (sin mover la página).
function revealActive(box) {
  const on = box.querySelector('.on');
  if (!on) return;
  const left = on.offsetLeft - box.offsetLeft, right = left + on.offsetWidth;
  if (left < box.scrollLeft) box.scrollLeft = left - 8;
  else if (right > box.scrollLeft + box.clientWidth) box.scrollLeft = right - box.clientWidth + 8;
}

/* ---------- Gráfico pequeño (pestaña Peso) ---------- */
function renderRanges() {
  S.range = Ranges.migrateRange(S.range, chartPresets().small.length);
  const box = $('#range-seg');
  box.innerHTML = rangeButtons(chartPresets().small, 'range', S.range)
    + '<button data-range="edit" class="rng-pen" aria-label="Configurar los botones del gráfico">✎</button>';
  chart.setRange(smallRangeDays(S.range));
  revealActive(box);
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
  $('#fs-range').innerHTML = rangeButtons(chartPresets().full, 'fr', S.range === 'all' ? 'all' : null);
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
let rangeDraft = null;      // copia en edición: { small: [...], full: [...] }

function presetRowHTML(group, i, p) {
  const opts = Ranges.UNITS.map(([u, l]) => `<option value="${u}"${p.u === u ? ' selected' : ''}>${l}</option>`).join('');
  return `<div class="field"><span>${esc(Ranges.presetLabel(p, true))}</span><span class="rng-edit">
    <input data-rg="${group}" data-ri="${i}" type="text" inputmode="numeric" value="${p.n}" aria-label="Cantidad">
    <select data-rgu="${group}" data-ri="${i}" aria-label="Unidad">${opts}</select>
    <button class="icon-btn icon-btn-sm danger" data-rdel="${group}" data-ri="${i}" aria-label="Quitar">✕</button></span></div>`;
}
function groupHTML(group, title) {
  const list = rangeDraft[group];
  const rows = list.map((p, i) => presetRowHTML(group, i, p)).join('');
  const add = list.length < Ranges.MAX_PRESETS ? `<button class="btn btn-ghost btn-small btn-block" data-radd="${group}">＋ Añadir botón</button>` : '';
  return `<h3 class="section-title">${title}</h3>
    <div class="card form-card">${rows || '<p class="fine">Solo «Todo».</p>'}</div>${add}`;
}
// Guarda en el borrador lo que hay escrito ahora (para no perderlo al añadir o quitar filas).
function readRangeInputs() {
  let ok = true;
  for (const inp of $$('[data-rg]', genSheet)) {
    const n = parseInt(inp.value, 10), g = inp.dataset.rg, i = Number(inp.dataset.ri);
    const u = $(`[data-rgu="${g}"][data-ri="${i}"]`, genSheet).value;
    if (n >= 1 && n <= 99) rangeDraft[g][i] = { n, u }; else ok = false;
  }
  return ok;
}
function drawRangeEditor() {
  genSheet.innerHTML = `<div class="grabber"></div><h2>Botones del gráfico</h2>
    <p class="fine">Añade, cambia o quita los botones (hasta ${Ranges.MAX_PRESETS}). «Todo» siempre está. Si no caben, el recuadro se desliza con el dedo.</p>
    ${groupHTML('small', 'Gráfico de la pestaña Peso')}
    ${groupHTML('full', 'Pantalla completa')}
    <button class="btn btn-primary btn-block btn-big" id="rg-ok" style="margin-top:14px">Guardar</button>
    <button class="btn btn-ghost btn-block" id="rg-reset">Volver a los de siempre</button>`;
}
async function rangeEditorClick(e) {
  const add = e.target.closest('[data-radd]'), del = e.target.closest('[data-rdel]');
  if (add || del) {
    readRangeInputs();
    if (add) rangeDraft[add.dataset.radd].push({ n: 1, u: 'm' });
    else rangeDraft[del.dataset.rdel].splice(Number(del.dataset.ri), 1);
    drawRangeEditor();
    return;
  }
  if (e.target.closest('#rg-reset')) S.chartPresets = null;
  else if (e.target.closest('#rg-ok')) {
    if (!readRangeInputs()) { toast('Cada botón necesita un número entre 1 y 99'); return; }
    S.chartPresets = rangeDraft;
  } else return;
  await saveSettings();
  closeSheet();
  renderRanges();
  toast('Botones del gráfico guardados');
}
function openRangeEditor() {
  rangeDraft = JSON.parse(JSON.stringify(chartPresets()));
  drawRangeEditor();
  genSheet.onclick = rangeEditorClick;
  openSheet(genSheet, () => { genSheet.onclick = null; rangeDraft = null; });
}
