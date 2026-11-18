/* Tracking · cuerpo: medidas corporales (pestaña Peso → Medidas) y macros por kg de peso (Dieta). */
'use strict';

const MEASURES = [['cintura', 'Cintura'], ['pecho', 'Pecho'], ['cadera', 'Cadera'], ['brazo', 'Brazo'], ['muslo', 'Muslo'], ['gemelo', 'Gemelo'], ['cuello', 'Cuello']];
const SHRINK_GOOD = new Set(['cintura', 'cadera']);      // en estas, bajar es bueno
let measures = [];                                        // [{ id: fecha, date, v: { cintura: 85, … } }] ordenado

async function bodyLoad() {
  measures = (await DB.all('measures')) || [];
  measures.sort((a, b) => (a.date < b.date ? -1 : 1));
}
const bodyBackupData = () => ({ measures });
async function bodyImportBackup(d) {
  const list = (Array.isArray(d.measures) ? d.measures : []).filter(m => m && /^\d{4}-\d{2}-\d{2}$/.test(m.date) && m.v);
  await DB.putMany('measures', list.map(m => ({ id: m.date, date: m.date, v: m.v })));
  await bodyLoad();
}
async function bodyWipe() {
  await DB.clear('measures');
  measures = [];
}
const seriesOf = key => measures.filter(m => m.v[key] > 0).map(m => ({ date: m.date, cm: m.v[key] }));

/* ---------- Lista de medidas ---------- */
function measureRow([key, label]) {
  const s = seriesOf(key);
  if (!s.length) return '';
  const last = s[s.length - 1], d = last.cm - s[0].cm;
  const cls = s.length < 2 || Math.abs(d) < 0.05 ? 'sub' : SHRINK_GOOD.has(key) ? (d < 0 ? 'good' : 'bad') : 'neutral';
  return `<button class="hist-row" data-mk="${key}">
    <span class="hist-date">${label}<small>${fmtD(F.dayMon, last.date)}</small></span>
    <span class="hist-kg">${fmtN(last.cm)} cm</span>
    <span class="hist-diff ${cls}">${s.length > 1 ? fmtSigned(d) : ''}</span>${chevIcon}
  </button>`;
}
function renderMeasures() {
  const box = $('#measure-list');
  if (!box) return;
  const rows = MEASURES.map(measureRow).join('');
  box.innerHTML = `<button class="btn btn-primary btn-block" data-ms="add">＋ Añadir medidas</button>
    ${rows ? `<div class="card list-wrap">${rows}</div><p class="fine center">Cambio desde la primera medida. Toca una para ver su gráfico.</p>`
      : '<p class="fine center" style="margin-top:24px">Apunta tus medidas (cintura, pecho, brazo…) cada 2–4 semanas, con la cinta en el mismo sitio y a la misma hora. Suelen moverse aunque la báscula se estanque.</p>'}`;
}

/* ---------- Añadir medidas ---------- */
function openAddMeasures() {
  const today = todayISO();
  const last = measures[measures.length - 1];
  genSheet.innerHTML = `<div class="grabber"></div><h2>Añadir medidas</h2>
    <input type="date" class="date-input" id="ms-date" value="${today}" max="${today}">
    <div class="card form-card">${MEASURES.map(([k, label]) => `<label class="field"><span>${label}</span><span class="input-unit"><input data-mv="${k}" type="text" inputmode="decimal" placeholder="${last && last.v[k] ? fmtN(last.v[k]) : '—'}"><em>cm</em></span></label>`).join('')}</div>
    <p class="fine">Rellena solo las que hayas medido. En gris, tu última medida.</p>
    <button class="btn btn-primary btn-block btn-big" id="ms-ok">Guardar</button>`;
  genSheet.onclick = async e => {
    if (!e.target.closest('#ms-ok')) return;
    const date = $('#ms-date', genSheet).value || today;
    if (date > today) return toast('La fecha no puede ser futura');
    const v = {};
    for (const inp of $$('[data-mv]', genSheet)) {
      if (!inp.value.trim()) continue;
      const n = parseFloat(inp.value.replace(',', '.'));
      if (isNaN(n) || n < 10 || n > 250) return toast('Cada medida debe estar entre 10 y 250 cm');
      v[inp.dataset.mv] = Math.round(n * 10) / 10;
    }
    if (!Object.keys(v).length) return toast('Escribe al menos una medida');
    const prev = measures.find(m => m.date === date);
    const entry = { id: date, date, v: { ...(prev ? prev.v : {}), ...v } };
    await DB.put('measures', entry);
    await bodyLoad();
    closeSheet();
    renderMeasures();
    toast('Medidas guardadas');
  };
  openSheet(genSheet, () => { genSheet.onclick = null; });
}

/* ---------- Detalle de una medida ---------- */
function openMeasure(key) {
  const label = MEASURES.find(m => m[0] === key)[1];
  const pg = openPage();
  const draw = () => {
    const s = seriesOf(key);
    if (!s.length) { popLayer(); return; }
    pg.el.innerHTML = `<div class="page-bar"><button class="icon-btn" data-mm="back">${backIcon}</button><div class="page-bar-title"><b>${label}</b><small>${s.length} ${s.length === 1 ? 'medida' : 'medidas'}</small></div><span></span></div>
      <div class="page-body">
        ${s.length > 1 ? '<div class="card chart-card"><div class="chart-wrap ex-chart"><canvas></canvas></div><p class="fine center">Toca un punto para ver el detalle.</p></div>' : ''}
        <div class="card list-wrap">${s.slice().reverse().map(x => `<div class="pr-row"><span>${cap(fmtD(F.wdDayMon, x.date))} ${x.date.slice(0, 4)}</span><b>${fmtN(x.cm)} cm</b><button class="icon-btn icon-btn-sm danger" data-mdel="${x.date}" aria-label="Borrar">✕</button></div>`).join('')}</div>
      </div>`;
    const cv = pg.el.querySelector('canvas');
    if (!cv) return;
    const ch = new WeightChart(cv, { trend: false, minMarker: false, tapSelect: true, small: true, fmtY: v => `${fmtN(v)} cm`, tip3: () => label });
    ch.setData(s.map(x => ({ x: isoToIdx(x.date), y: x.cm, t: x.cm, date: x.date })), null);
    ch.setRange('all');
  };
  draw();
  pg.el.addEventListener('click', async e => {
    if (e.target.closest('[data-mm="back"]')) return popLayer();
    const del = e.target.closest('[data-mdel]');
    if (!del) return;
    const m = measures.find(x => x.date === del.dataset.mdel);
    if (!m) return;
    delete m.v[key];
    if (Object.keys(m.v).length) await DB.put('measures', m); else await DB.del('measures', m.id);
    await bodyLoad();
    renderMeasures();
    draw();
    toast('Medida borrada');
  });
}
$('#tab-peso').addEventListener('click', e => {
  if (e.target.closest('[data-ms="add"]')) return openAddMeasures();
  const r = e.target.closest('[data-mk]');
  if (r) openMeasure(r.dataset.mk);
});

/* ---------- Dieta: macros por kg de peso ---------- */
function gkgLine(tot, target, kg) {
  if (!(kg > 0)) return '';
  const f = v => fM(v / kg);
  const goal = target ? ` <span class="sub">(objetivo ${f(target.p)} · ${f(target.c)} · ${f(target.f)})</span>` : '';
  return `<p class="gkg">Por kg de peso: <b>P ${f(tot.p)} · C ${f(tot.c)} · G ${f(tot.f)}</b> g/kg${goal}</p>`;
}
