/* Tracking · extras del entreno: descanso (temporizador o cronómetro), marcar series y saltar a la
   siguiente, superseries, sugerencia de progresión, gráfico de ejercicio, calendario y grupos musculares.
   Los cálculos están en gymcalc.js. */
'use strict';

/* ================= Descanso: temporizador o cronómetro ================= */
const isStopwatch = () => S.restMode === 'stopwatch';

function startRest(sec) {
  if (!G.active) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.resume) audioCtx.resume();
  } catch (e) { console.warn('Sin audio para el aviso de descanso:', e); }
  if (isStopwatch()) { G.active.restStart = Date.now(); G.active.restEnd = 0; }
  else { G.active.restEnd = Date.now() + sec * 1000; G.active.restTotal = sec; G.active.restStart = 0; }
  saveActive();
  tick();
}
function stopRest() {
  if (G.active) { G.active.restEnd = 0; G.active.restStart = 0; saveActive(); }
  $('#rest-bar').hidden = true;
  document.body.classList.remove('resting');
  if (typeof nativeWorkoutSync === 'function') nativeWorkoutSync();
}
$('#rest-bar').addEventListener('click', e => {
  const b = e.target.closest('[data-rest]');
  if (!b || !G.active) return;
  if (b.dataset.rest === 'skip') { stopRest(); return; }
  if (!G.active.restEnd) return;
  const d = +b.dataset.rest * 1000;
  G.active.restEnd = Math.max(Date.now() + 1000, G.active.restEnd + d);
  G.active.restTotal = Math.max(G.active.restTotal + d / 1000, 1);
  saveActive();
  tick();
  if (typeof nativeWorkoutSync === 'function') nativeWorkoutSync();
});
function showRestBar(text, frac, stopwatch) {
  const bar = $('#rest-bar');
  bar.hidden = false;
  bar.classList.toggle('sw', stopwatch);
  document.body.classList.add('resting');
  $('#rest-time').textContent = text;
  $('#rest-label').textContent = stopwatch ? 'Descansando' : 'Descanso';
  $('#rest-bar [data-rest="skip"]').textContent = stopwatch ? 'Parar' : 'Saltar';
  $('#rest-fill').style.width = `${frac * 100}%`;
}
function restEnded(late) {
  stopRest();
  if (late) return;      // la app estaba cerrada cuando terminó
  beep();
  if (navigator.vibrate) navigator.vibrate([250, 120, 250, 120, 400]);
  toast('⏱ ¡Descanso terminado!');
}
function tick() {
  const now = Date.now(), a = G.active;
  $$('[data-clock]').forEach(el => { if (a) el.textContent = fmtClock((now - a.start) / 1000); });
  if (a && a.restEnd) {
    const left = (a.restEnd - now) / 1000;
    if (left <= 0) restEnded(left < -5);
    else showRestBar(fmtClock(Math.ceil(left)), clamp(left / (a.restTotal || 1), 0, 1), false);
  } else if (a && a.restStart) {
    showRestBar(fmtClock((now - a.restStart) / 1000), 1, true);
  } else if (!$('#rest-bar').hidden) {
    $('#rest-bar').hidden = true;
    document.body.classList.remove('resting');
  }
}
setInterval(tick, 250);

function renderRestModeSetting() {
  $$('#set-restmode [data-rm]').forEach(b => b.classList.toggle('on', b.dataset.rm === (S.restMode || 'timer')));
  const row = $('#set-rest');
  if (row) row.closest('.field').hidden = isStopwatch();
}
$('#set-restmode').addEventListener('click', e => {
  const b = e.target.closest('[data-rm]');
  if (!b) return;
  S.restMode = b.dataset.rm;
  saveSettings();
  renderRestModeSetting();
  toast(isStopwatch() ? 'Descanso: cronómetro (cuenta hacia arriba)' : 'Descanso: temporizador (cuenta atrás)');
});

/* ================= Marcar una serie y saltar a la siguiente ================= */
function checkSet(ex, ei, si, row, fromKeyboard) {
  const s = ex.sets[si];
  if (s.done) { s.done = false; s.pr = false; wkChanged(); renderWk(); return; }
  if (s.kg == null && s.ph && s.ph.kg != null) s.kg = s.ph.kg;
  if (s.reps == null && s.ph && s.ph.reps != null) s.reps = s.ph.reps;
  if (s.reps == null && s.kg == null) {
    toast('Escribe los kg y las repeticiones');
    row.querySelector('.set-in').focus();
    return;
  }
  if (s.reps == null) s.reps = 0;
  s.done = true;
  if (navigator.vibrate) navigator.vibrate(12);
  const next = GymCalc.nextSet(wkData.exercises, ei, si);
  if (wkMode === 'active') {
    livePR(ex, si, s);
    const rest = ex.rest ?? S.rest;
    if (GymCalc.restAfter(wkData.exercises, ei, next) && (isStopwatch() || rest > 0)) startRest(rest);
  }
  wkChanged();
  renderWk();
  if (next) focusSet(next, fromKeyboard);
  if (typeof nativeWorkoutSync === 'function') nativeWorkoutSync();
}
function livePR(ex, si, s) {
  if (s.type === 'warmup' || !s.kg || !s.reps) return;
  const b = bests(ex.exId, Infinity, wkData.id);
  if (!b.n) return;
  const cur = { kg: 0, e1: 0 };
  ex.sets.forEach((o, k) => {
    if (k !== si && o.done && o.type !== 'warmup') { cur.kg = Math.max(cur.kg, o.kg || 0); cur.e1 = Math.max(cur.e1, e1rm(o.kg, o.reps)); }
  });
  const e1 = e1rm(s.kg, s.reps);
  if (s.kg > Math.max(b.kg, cur.kg) && b.kg > 0) { s.pr = true; toast(`🏆 ¡Récord! Peso máximo en ${exName(ex.exId)}: ${fmtN(s.kg)} kg`, { ms: 3500 }); }
  else if (e1 > Math.max(b.e1, cur.e1) + 0.01 && b.e1 > 0) { s.pr = true; toast(`🏆 ¡Récord! 1RM estimado: ${fmtN(Math.round(e1 * 10) / 10)} kg`, { ms: 3500 }); }
}
function focusSet([ei, si], withKeyboard) {
  const row = wkPage && wkPage.el.querySelector(`.set-row[data-ex="${ei}"][data-set="${si}"]`);
  if (!row) return;
  row.classList.add('next');
  if (withKeyboard) row.querySelector('[data-f="kg"]').focus({ preventScroll: true });
  row.scrollIntoView({ block: 'center', behavior: withKeyboard ? 'auto' : 'smooth' });
}
// Intro / ✓ del teclado: de kg pasa a reps; en reps marca la serie.
function wkKey(e) {
  if (e.key !== 'Enter' || !e.target.matches('.set-in')) return;
  e.preventDefault();
  const row = e.target.closest('.set-row');
  if (e.target.dataset.f === 'kg') { row.querySelector('[data-f="reps"]').focus(); return; }
  const ei = +row.dataset.ex, si = +row.dataset.set;
  const ex = wkData.exercises[ei];
  if (ex.sets[si].done) { const n = GymCalc.nextSet(wkData.exercises, ei, si); if (n) focusSet(n, true); return; }
  checkSet(ex, ei, si, row, true);
}

/* ================= Superseries ================= */
const SUP_COLORS = ['#f5b14c', '#c58bff', '#3fd18e', '#ff8a7a', '#5ec8f0'];
function supColor(id) {
  const ids = [...new Set(wkData.exercises.map(e => e.sup).filter(Boolean))];
  return SUP_COLORS[Math.max(0, ids.indexOf(id)) % SUP_COLORS.length];
}
function supMenuItems(i) {
  const exs = wkData.exercises, ex = exs[i];
  if (ex.sup) return [{ label: 'Quitar de la superserie', value: 'sup-unlink' }];
  return i < exs.length - 1 ? [{ label: 'Superserie con el siguiente', sub: exName(exs[i + 1].exId), value: 'sup-link' }] : [];
}
function toggleSup(i, v) {
  const exs = wkData.exercises, ex = exs[i];
  if (v === 'sup-link') { const id = exs[i + 1].sup || uid(); ex.sup = id; exs[i + 1].sup = id; return; }
  const id = ex.sup;
  ex.sup = null;
  const left = exs.filter(e => e.sup === id);
  if (left.length < 2) left.forEach(e => { e.sup = null; });
}
const supAttr = ex => (ex.sup ? ` style="--sup:${supColor(ex.sup)}"` : '');

/* ================= Extras de la tarjeta de ejercicio ================= */
function exExtrasHTML(ex) {
  const badge = ex.sup ? '<div class="sup-badge">Superserie</div>' : '';
  if (wkMode !== 'active') return badge;
  const rest = isStopwatch() ? '<span class="ex-rest">⏱ Descanso: cronómetro</span>'
    : `<button class="ex-rest" data-act="ex-rest">⏱ Descanso: ${fmtRest(ex.rest ?? S.rest)}</button>`;
  const sug = GymCalc.suggestProgression(prevSetsFor(ex.exId, wkData.id));
  const chips = sug.map(s => `<button class="chip chip-s" data-act="sug" data-kg="${s.kg}" data-reps="${s.reps}">${s.kg ? `${fmtN(s.kg)} × ${s.reps}` : `${s.reps} reps`}</button>`);
  return badge + rest + (chips.length ? `<div class="sug"><span>💡 Hoy prueba</span>${chips.join('<em>o</em>')}</div>` : '');
}
function applySug(ex, b) {
  const t = ex.sets.find(s => !s.done && s.type !== 'warmup');
  if (!t) return toast('No quedan series por hacer en este ejercicio');
  t.kg = Number(b.dataset.kg);
  t.reps = Number(b.dataset.reps);
  wkChanged();
  renderWk();
}

/* ================= Gráfico de ejercicio (como el del peso) ================= */
const EX_METRICS = [['e1', '1RM est.'], ['kg', 'Peso máx.'], ['vol', 'Volumen']];
const EX_RANGES = [['3m', '3M'], ['6m', '6M'], ['1y', '1A'], ['all', 'Todo']];
const expandSvg = '<svg viewBox="0 0 24 24"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const closeSvg = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>';

function exChartHTML(metric, range) {
  const seg = (list, attr, cur) => list.map(([k, l]) => `<button data-${attr}="${k}" class="${cur === k ? 'on' : ''}">${l}</button>`).join('');
  return `<div class="card chart-card">
    <div class="seg seg-small seg-block">${seg(EX_METRICS, 'm', metric)}</div>
    <div class="seg seg-small seg-block ex-range">${seg(EX_RANGES, 'xr', range)}</div>
    <div class="chart-wrap ex-chart" role="button" aria-label="Ampliar gráfico"><canvas></canvas><span class="expand-hint" aria-hidden="true">${expandSvg}</span></div>
    <div class="legend"><span><i class="lg-dot"></i>Cada sesión</span><span><i class="lg-line"></i>Media 4 semanas</span></div>
  </div>`;
}
function exPoints(sessions, metric) {
  const pts = sessions.slice().reverse().map(({ w, ex }) => {
    const ws = workSets(ex.sets);
    const y = metric === 'e1' ? Math.max(0, ...ws.map(s => e1rm(s.kg, s.reps)))
      : metric === 'kg' ? Math.max(0, ...ws.map(s => s.kg || 0))
      : ws.reduce((a, s) => a + setVol(s), 0);
    const iso = localISO(w.start);
    return { x: isoToIdx(iso), y: Math.round(y * 10) / 10, date: iso, best: bestSet(ex.sets) };
  }).filter(p => p.y > 0);
  return pts.length ? GymCalc.movingAverage(pts, 28) : pts;
}
function exChartOpts(metric) {
  const f = v => (metric === 'vol' ? fmtInt(v) : fmtN(Math.round(v * 10) / 10));
  return { trend: true, minMarker: false, fmtY: v => `${f(v)} kg`, fmtTag: f, tip3: p => `Mejor serie: ${fmtSet(p.best)} · media ${f(p.t)}` };
}
function exChartMount(el, sessions, metric, range, title) {
  const cv = el.querySelector('.ex-chart canvas');
  if (!cv) return;
  const pts = exPoints(sessions, metric);
  let ch = null;
  const open = () => openChartFs({ title: `${title} · ${EX_METRICS.find(m => m[0] === metric)[1]}`, pts, opt: exChartOpts(metric), view: ch.view });
  ch = new WeightChart(cv, { ...exChartOpts(metric), small: true, onTap: open });
  ch.setData(pts, null);
  ch.setRange(range);
}
// Gráfico a pantalla completa genérico (mover, zoom, cruz), igual que el del peso.
function openChartFs({ title, pts, opt, view }) {
  const pg = openPage('fs-page');
  pg.el.innerHTML = `<div class="fs-bar">
      <button class="btn btn-small btn-ghost" data-f="all">Ver todo</button>
      <button class="btn btn-small btn-ghost fs-auto on" data-f="auto">Auto</button>
      <span class="fs-hint">${esc(title)}</span>
      <button class="icon-btn" data-f="close" aria-label="Cerrar">${closeSvg}</button>
    </div><div class="fs-chart"><canvas></canvas></div>`;
  const ch = new WeightChart(pg.el.querySelector('canvas'), { interactive: true, ...opt });
  ch.onYMode = auto => pg.el.querySelector('[data-f="auto"]').classList.toggle('on', auto);
  ch.setData(pts, null);
  if (view) ch.view = [...view];
  pg.el.addEventListener('click', e => {
    const b = e.target.closest('[data-f]');
    if (!b) return;
    if (b.dataset.f === 'close') popLayer();
    else if (b.dataset.f === 'all') ch.resetAll();
    else ch.setYAuto(!!ch.yView);
  });
}

/* ================= Calendario y grupos musculares ================= */
let calMonth = null;
const workoutsByDay = () => {
  const m = new Map();
  for (const w of G.workouts) { const iso = localISO(w.start); if (!m.has(iso)) m.set(iso, []); m.get(iso).push(w); }
  return m;
};
function calendarCells(y, m, byDay) {
  const offset = (new Date(y, m, 1).getDay() + 6) % 7, days = new Date(y, m + 1, 0).getDate(), today = localISO(Date.now());
  let cells = '<span></span>'.repeat(offset);
  for (let d = 1; d <= days; d++) {
    const iso = `${y}-${pad2(m + 1)}-${pad2(d)}`, ws = byDay.get(iso) || [];
    cells += `<button class="cal-d${ws.length ? ' on' : ''}${iso === today ? ' today' : ''}" ${ws.length ? `data-cal="${iso}"` : 'disabled'}><b>${d}</b>${ws.length ? `<small>${esc(ws[0].title.slice(0, 5))}</small>` : ''}</button>`;
  }
  return cells;
}
function calendarHTML() {
  if (!G.workouts.length) return '';
  const now = new Date();
  if (!calMonth) calMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const y = calMonth.getFullYear(), m = calMonth.getMonth(), prefix = `${y}-${pad2(m + 1)}`;
  const byDay = workoutsByDay();
  const count = [...byDay.keys()].filter(k => k.startsWith(prefix)).reduce((a, k) => a + byDay.get(k).length, 0);
  const weeks = G.workouts.map(w => GymCalc.weekOfDay(isoToIdx(localISO(w.start))));
  const streak = GymCalc.streakWeeks(weeks, GymCalc.weekOfDay(isoToIdx(localISO(Date.now()))));
  return `<div class="card cal-card">
    <div class="card-head"><button class="icon-btn icon-btn-sm" data-calnav="-1" aria-label="Mes anterior">‹</button><h2>${cap(fmtD(F.monYear, prefix + '-01'))}</h2><button class="icon-btn icon-btn-sm" data-calnav="1" aria-label="Mes siguiente">›</button></div>
    <div class="cal-grid">${['L', 'M', 'X', 'J', 'V', 'S', 'D'].map(x => `<span class="cal-h">${x}</span>`).join('')}${calendarCells(y, m, byDay)}</div>
    <p class="fine center">${count} ${count === 1 ? 'entreno' : 'entrenos'} este mes · Racha: <b>${streak}</b> ${streak === 1 ? 'semana' : 'semanas'} seguidas</p>
  </div>`;
}
function muscleHTML() {
  const ws = weekStartMs(Date.now()), from = ws - 28 * DAY;
  const cur = [], past = [];
  for (const w of G.workouts) {
    if (w.start < from) break;
    const list = w.start >= ws ? cur : past;
    w.exercises.forEach(e => list.push({ muscle: (exById.get(e.exId) || {}).muscle, sets: e.sets }));
  }
  const c = GymCalc.setsByMuscle(cur), p = GymCalc.setsByMuscle(past);
  const muscles = MUSCLES.filter(mu => c[mu] || p[mu]);
  if (!muscles.length) return '';
  const max = Math.max(22, ...muscles.map(mu => Math.max(c[mu] || 0, (p[mu] || 0) / 4)));
  const pct = v => `${Math.min(100, v / max * 100).toFixed(1)}%`;
  const rows = muscles.map(mu => `<div class="mg-row"><span>${mu}</span><div class="mg-track"><div class="mg-zone" style="left:${pct(10)};width:${pct(10)}"></div><div class="mg-bar" style="width:${pct(c[mu] || 0)}"></div><i style="left:${pct((p[mu] || 0) / 4)}"></i></div><b>${c[mu] || 0}</b></div>`).join('');
  return `<div class="card"><div class="card-head"><h2>Series por grupo muscular</h2><span class="sub">esta semana</span></div>${rows}
    <p class="fine">Barra: series de esta semana (sin calentamiento). Raya: media de las 4 semanas anteriores. Zona sombreada: 10–20 series, un rango habitual para ganar músculo.</p></div>`;
}
$('#gym-historial').addEventListener('click', async e => {
  const nav = e.target.closest('[data-calnav]');
  if (nav) { calMonth = new Date(calMonth.getFullYear(), calMonth.getMonth() + Number(nav.dataset.calnav), 1); renderGymHistory(); return; }
  const day = e.target.closest('[data-cal]');
  if (!day) return;
  const ws = workoutsByDay().get(day.dataset.cal) || [];
  if (ws.length === 1) return openWorkoutDetail(ws[0].id);
  const id = await actionSheet(cap(fmtD(F.wdDayMon, day.dataset.cal)), ws.map(w => ({ label: w.title, sub: `${fmtDur(w.end - w.start)} · ${fmtInt(wVolume(w))} kg`, value: w.id })));
  if (id) openWorkoutDetail(id);
});
