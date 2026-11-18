/* Tracking · entrenamiento: rutinas, entreno en curso, historial, ejercicios e importación de Hevy. */
'use strict';

/* ================= Estado y utilidades ================= */
const G = { exercises: [], routines: [], workouts: [], active: null };
let exById = new Map();
let exHist = new Map();          // exId -> [{ w, ex }] del más reciente al más antiguo

const uid = () => (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));
const norm = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim();
const SET_TYPES = {
  normal: { label: 'Normal', short: '' },
  warmup: { label: 'Calentamiento', short: 'C' },
  failure: { label: 'Al fallo', short: 'F' },
  dropset: { label: 'Drop set', short: 'D' },
};
const MUSCLES = ['Pecho', 'Espalda', 'Hombros', 'Bíceps', 'Tríceps', 'Piernas', 'Glúteos', 'Core', 'Cardio', 'Otro'];
const REST_OPTIONS = [0, 30, 45, 60, 75, 90, 120, 150, 180, 240, 300];
const PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];

function guessMuscle(name) {
  const n = norm(name);
  if (/peso muerto|sentadilla|pierna|prensa|aduccion|abduccion|zancada|bulgara|gemelo|femoral|cuadriceps|hack|leg /.test(n)) return 'Piernas';
  if (/hip thrust|gluteo|patada/.test(n)) return 'Glúteos';
  if (/tricep|fondos|frances|press cerrado/.test(n)) return 'Tríceps';
  if (/curl|bicep/.test(n)) return 'Bíceps';
  if (/hombro|lateral|militar|face pull|pajaro|posterior|arnold|frontal/.test(n)) return 'Hombros';
  if (/banca|pecho|apertura|cruce|pec deck|fly|flexion/.test(n)) return 'Pecho';
  if (/remo|jalon|pulldown|dominada|pull|espalda|lumbar|encogimiento/.test(n)) return 'Espalda';
  if (/abdominal|crunch|plancha|core|rueda/.test(n)) return 'Core';
  if (/correr|cinta|bici|eliptica|cardio/.test(n)) return 'Cardio';
  return 'Otro';
}

const fmtN = n => (n == null || isNaN(n) ? '' : String(Math.round(n * 100) / 100).replace('.', ','));
const fmtInt = n => Math.round(n).toLocaleString('es-ES');
const e1rm = (kg, reps) => (!kg || !reps ? 0 : reps === 1 ? kg : kg * (1 + reps / 30));
function fmtClock(sec) {
  sec = Math.max(0, Math.floor(sec));
  const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return h ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
}
function fmtDur(ms) {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${pad2(min % 60)} min`;
}
const fmtRest = s => (!s ? 'Sin descanso' : s < 60 ? `${s} s` : `${Math.floor(s / 60)}:${pad2(s % 60)}`);
const localISO = ms => { const d = new Date(ms); return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`; };
const fmtWDate = ms => cap(fmtD(F.wdDayMon, localISO(ms))) + (new Date(ms).getFullYear() !== new Date().getFullYear() ? ' ' + new Date(ms).getFullYear() : '');
const exName = id => (exById.get(id) || { name: 'Ejercicio borrado' }).name;
const workSets = sets => sets.filter(s => s.type !== 'warmup');
const setVol = s => (s.kg || 0) * (s.reps || 0);
const wVolume = w => w.exercises.reduce((a, e) => a + workSets(e.sets).reduce((b, s) => b + setVol(s), 0), 0);
const wSetCount = w => w.exercises.reduce((a, e) => a + workSets(e.sets).length, 0);
const fmtSet = s => {
  if (s.km || s.sec) return [s.km ? `${fmtN(s.km)} km` : '', s.sec ? fmtClock(s.sec) : ''].filter(Boolean).join(' · ');
  if (!s.kg) return `${s.reps || 0} reps`;
  return `${fmtN(s.kg)} kg × ${s.reps || 0}`;
};

/* ================= Carga y guardado ================= */
async function gymLoad() {
  const [ex, ro, wo, act] = await Promise.all([DB.all('exercises'), DB.all('routines'), DB.all('workouts'), DB.getKey('active')]);
  G.exercises = ex || [];
  G.routines = ro || [];
  G.workouts = wo || [];
  G.active = act || null;
  gymDerive();
}
function gymDerive() {
  exById = new Map(G.exercises.map(e => [e.id, e]));
  G.workouts.sort((a, b) => b.start - a.start);
  G.routines.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
  exHist = new Map();
  for (const w of G.workouts) for (const ex of w.exercises) {
    if (!exHist.has(ex.exId)) exHist.set(ex.exId, []);
    exHist.get(ex.exId).push({ w, ex });
  }
}
let activeSaveTimer = 0;
function saveActive(now = false) {
  clearTimeout(activeSaveTimer);
  const run = () => DB.putKey('active', G.active ? JSON.parse(JSON.stringify(G.active)) : null).catch(() => {});
  if (now) return run();
  activeSaveTimer = setTimeout(run, 250);
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && G.active) saveActive(true); });

function findOrCreateExercise(name) {
  const n = norm(name);
  let e = G.exercises.find(x => norm(x.name) === n);
  if (!e) {
    e = { id: uid(), name: name.trim(), muscle: guessMuscle(name), rest: null };
    G.exercises.push(e);
    exById.set(e.id, e);
    DB.put('exercises', e);
  }
  return e;
}

/* ================= Récords ================= */
function bests(exId, before = Infinity, excludeId = null) {
  const b = { kg: 0, e1: 0, vol: 0, reps: 0, n: 0 };
  for (const { w, ex } of exHist.get(exId) || []) {
    if (w.start >= before || w.id === excludeId) continue;
    b.n++;
    for (const s of workSets(ex.sets)) {
      b.kg = Math.max(b.kg, s.kg || 0);
      b.e1 = Math.max(b.e1, e1rm(s.kg, s.reps));
      b.vol = Math.max(b.vol, setVol(s));
      b.reps = Math.max(b.reps, s.reps || 0);
    }
  }
  return b;
}
function workoutPRs(w) {
  const out = [];
  for (const ex of w.exercises) {
    const prev = bests(ex.exId, w.start, w.id);
    if (!prev.n) continue;
    let kg = 0, e1 = 0, vol = 0;
    for (const s of workSets(ex.sets)) { kg = Math.max(kg, s.kg || 0); e1 = Math.max(e1, e1rm(s.kg, s.reps)); vol = Math.max(vol, setVol(s)); }
    if (kg > prev.kg && prev.kg > 0) out.push({ exId: ex.exId, label: 'Peso máximo', value: `${fmtN(kg)} kg` });
    if (e1 > prev.e1 + 0.01 && prev.e1 > 0) out.push({ exId: ex.exId, label: '1RM estimado', value: `${fmtN(Math.round(e1 * 10) / 10)} kg` });
    else if (vol > prev.vol && prev.vol > 0) out.push({ exId: ex.exId, label: 'Mejor serie (volumen)', value: `${fmtN(vol)} kg` });
  }
  return out;
}

/* ================= Páginas a pantalla completa ================= */
let pageCount = 0;
function openPage(cls = '') {
  const el = document.createElement('div');
  el.className = 'page ' + cls;
  document.body.appendChild(el);
  lockBody();
  pageCount++;
  document.body.classList.add('page-open');
  requestAnimationFrame(() => el.classList.add('open'));
  const page = { el, onClose: null };
  pushLayer(() => {
    el.classList.remove('open');
    unlockBody();
    pageCount = Math.max(0, pageCount - 1);
    if (!pageCount) document.body.classList.remove('page-open');
    setTimeout(() => el.remove(), 230);
    if (page.onClose) page.onClose();
  });
  return page;
}
const backIcon = '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const downIcon = '<svg viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const dotsIcon = '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.8" fill="currentColor"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/><circle cx="19" cy="12" r="1.8" fill="currentColor"/></svg>';
const checkIcon = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const chevIcon = '<svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* ================= Panel genérico: menús y selectores ================= */
const genSheet = $('#sheet-gen');
function actionSheet(title, items) {
  return new Promise(res => {
    let result = null;
    genSheet.innerHTML = `<div class="grabber"></div>${title ? `<h2>${esc(title)}</h2>` : ''}<div class="action-list">${items.map((it, i) =>
      `<button class="action-item${it.danger ? ' danger' : ''}${it.on ? ' on' : ''}" data-i="${i}">${esc(it.label)}${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</button>`).join('')}</div>`;
    genSheet.onclick = e => {
      const b = e.target.closest('[data-i]');
      if (!b) return;
      result = items[+b.dataset.i].value;
      closeSheet();
    };
    openSheet(genSheet, () => { genSheet.onclick = null; res(result); });
  });
}

function pickExercises({ multi = true, title = 'Añadir ejercicios' } = {}) {
  return new Promise(res => {
    const sel = [];
    let result = null;
    const usage = id => (exHist.get(id) || []).length;
    genSheet.innerHTML = `<div class="grabber"></div><h2>${title}</h2>
      <div class="search"><input type="search" id="pk-q" placeholder="Buscar o crear ejercicio" autocomplete="off"></div>
      <div class="pick-list" id="pk-list"></div>
      <button class="btn btn-primary btn-block" id="pk-ok" ${multi ? '' : 'hidden'} disabled>Añadir</button>`;
    const list = $('#pk-list', genSheet), q = $('#pk-q', genSheet), okB = $('#pk-ok', genSheet);
    const draw = () => {
      const t = norm(q.value);
      const items = G.exercises.filter(e => !t || norm(e.name).includes(t))
        .sort((a, b) => usage(b.id) - usage(a.id) || a.name.localeCompare(b.name));
      let html = '';
      if (t && !G.exercises.some(e => norm(e.name) === t)) html += `<button class="pick-item create" data-new="1">＋ Crear «${esc(q.value.trim())}»</button>`;
      html += items.map(e => `<button class="pick-item${sel.includes(e.id) ? ' on' : ''}" data-id="${e.id}"><span>${esc(e.name)}<small>${e.muscle || ''}${usage(e.id) ? ` · ${usage(e.id)} veces` : ''}</small></span><i>${checkIcon}</i></button>`).join('');
      if (!items.length && !t) html = '<p class="fine center">Escribe el nombre para crear tu primer ejercicio.</p>';
      list.innerHTML = html;
      okB.disabled = !sel.length;
      okB.textContent = sel.length ? `Añadir (${sel.length})` : 'Añadir';
    };
    q.addEventListener('input', draw);
    list.onclick = e => {
      const b = e.target.closest('.pick-item');
      if (!b) return;
      let id = b.dataset.id;
      if (b.dataset.new) { id = findOrCreateExercise(q.value).id; q.value = ''; }
      if (!multi) { result = [id]; closeSheet(); return; }
      const i = sel.indexOf(id);
      i >= 0 ? sel.splice(i, 1) : sel.push(id);
      draw();
    };
    okB.onclick = () => { result = sel.slice(); closeSheet(); };
    draw();
    openSheet(genSheet, () => res(result));
  });
}

async function pickRest(current) {
  const v = await actionSheet('Descanso', REST_OPTIONS.map(s => ({ label: fmtRest(s), value: s, on: s === current })));
  return v;
}

function plateCalc(initial) {
  genSheet.innerHTML = `<div class="grabber"></div><h2>Calculadora de discos</h2>
    <div class="weight-input"><input id="pc-kg" type="text" inputmode="decimal" placeholder="0" value="${initial ? fmtN(initial) : ''}"><span>kg</span></div>
    <div class="seg seg-block" id="pc-bar" style="margin-top:12px">${[20, 15, 10, 0].map(b => `<button data-bar="${b}" class="${S.bar === b ? 'on' : ''}">${b ? `Barra ${b}` : 'Sin barra'}</button>`).join('')}</div>
    <div id="pc-out" class="plates-out"></div>`;
  const out = $('#pc-out', genSheet), inp = $('#pc-kg', genSheet);
  const calc = () => {
    const total = parseKg(inp.value);
    if (isNaN(total) || total <= 0) { out.innerHTML = '<p class="fine center">Escribe el peso total.</p>'; return; }
    let side = (total - S.bar) / 2;
    if (side < 0) { out.innerHTML = `<p class="fine center">Menos que la barra (${S.bar} kg).</p>`; return; }
    const used = [];
    for (const p of PLATES) while (side >= p - 1e-9) { used.push(p); side = Math.round((side - p) * 1000) / 1000; }
    out.innerHTML = `<div class="label center">En cada lado</div><div class="plates">${used.length ? used.map(p => `<span class="plate p${String(p).replace('.', '_')}">${fmtN(p)}</span>`).join('') : '<span class="fine">Solo la barra</span>'}</div>
      ${side > 0 ? `<p class="fine center">Sobran ${fmtN(side * 2)} kg que no salen con discos normales.</p>` : ''}`;
  };
  inp.addEventListener('input', calc);
  $('#pc-bar', genSheet).onclick = e => {
    const b = e.target.closest('[data-bar]');
    if (!b) return;
    S.bar = +b.dataset.bar; saveSettings();
    $$('#pc-bar button', genSheet).forEach(x => x.classList.toggle('on', x === b));
    calc(); renderGymSettings();
  };
  genSheet.onclick = null;
  calc();
  openSheet(genSheet);
}

/* ================= Empezar entreno ================= */
function prevSetsFor(exId, excludeId) {
  for (const { w, ex } of exHist.get(exId) || []) if (w.id !== excludeId) return ex.sets;
  return null;
}
function newActiveEx(exId, templateSets) {
  const prev = prevSetsFor(exId) || [];
  const base = templateSets && templateSets.length ? templateSets : (prev.length ? prev : [{ type: 'normal' }, { type: 'normal' }, { type: 'normal' }]);
  return {
    uid: uid(), exId, notes: '', rest: (exById.get(exId) || {}).rest ?? null,
    sets: base.map((s, i) => ({ type: s.type || 'normal', kg: null, reps: null, done: false, ph: { kg: (prev[i] || s).kg ?? null, reps: (prev[i] || s).reps ?? null } })),
  };
}
async function startWorkout({ routine = null, from = null } = {}) {
  if (G.active) {
    const ok = await ask({ title: 'Ya tienes un entreno en curso', message: `«${G.active.title}» sigue abierto. ¿Quieres continuarlo?`, ok: 'Continuar', cancel: 'Cancelar' });
    if (ok) openActive();
    return;
  }
  const src = routine || from;
  G.active = {
    id: uid(), title: src ? (routine ? routine.name : from.title) : 'Entreno', routineId: routine ? routine.id : (from && from.routineId) || null,
    start: Date.now(), notes: '', restEnd: 0, restTotal: 0,
    exercises: src ? src.exercises.filter(e => exById.has(e.exId)).map(e => {
      const a = newActiveEx(e.exId, e.sets);
      if (e.rest != null) a.rest = e.rest; if (e.sup) a.sup = e.sup;
      return a;
    }) : [],
  };
  saveActive(true);
  renderActiveBar();
  openActive();
}
async function gymStartMenu() {
  if (G.active) return openActive();
  const items = G.routines.map(r => ({ label: r.name, sub: `${r.exercises.length} ejercicios`, value: { routine: r } }));
  const last = G.workouts[0];
  if (last) items.push({ label: 'Repetir último entreno', sub: `${last.title} · ${fmtWDate(last.start)}`, value: { from: last } });
  items.push({ label: 'Entreno vacío', sub: 'Añade los ejercicios sobre la marcha', value: {} });
  const v = await actionSheet('Empezar entrenamiento', items);
  if (v) startWorkout(v);
}

/* ================= Entreno en curso / edición ================= */
let wkPage = null;          // página abierta del entreno
let wkMode = 'active';      // 'active' | 'edit'
let wkData = null;          // G.active o copia de un entreno para editar

function openActive() {
  if (!G.active) return;
  openWorkoutEditor(G.active, 'active');
}
function openWorkoutEditor(data, mode) {
  wkMode = mode;
  wkData = data;
  wkPage = openPage('wk-page');
  wkPage.onClose = () => { wkPage = null; renderActiveBar(); };
  renderWk();
  wkPage.el.addEventListener('click', wkClick);
  wkPage.el.addEventListener('input', wkInput);
  wkPage.el.addEventListener('change', wkChange);
  wkPage.el.addEventListener('keydown', wkKey);
  renderActiveBar();
}

function setLabel(ex, i) {
  const s = ex.sets[i];
  if (s.type !== 'normal') return SET_TYPES[s.type].short;
  let n = 0;
  for (let k = 0; k <= i; k++) if (ex.sets[k].type === 'normal') n++;
  return String(n);
}
function exCardHTML(ex, idx) {
  const prev = prevSetsFor(ex.exId, wkMode === 'edit' ? wkData.id : null) || [];
  const rows = ex.sets.map((s, i) => {
    const p = prev[i];
    return `<div class="set-row${s.done ? ' done' : ''}${s.pr ? ' pr' : ''}" data-ex="${idx}" data-set="${i}">
      <button class="set-lbl t-${s.type}" data-act="set-menu">${setLabel(ex, i)}</button>
      <button class="set-prev" data-act="use-prev">${p ? esc(fmtSet(p)) : '—'}</button>
      <input class="set-in" data-f="kg" inputmode="decimal" enterkeyhint="next" value="${s.kg != null ? fmtN(s.kg) : ''}" placeholder="${s.ph && s.ph.kg != null ? fmtN(s.ph.kg) : ''}">
      <input class="set-in" data-f="reps" inputmode="numeric" enterkeyhint="done" value="${s.reps != null ? s.reps : ''}" placeholder="${s.ph && s.ph.reps != null ? s.ph.reps : ''}">
      <button class="set-chk" data-act="check" aria-label="Serie hecha">${checkIcon}</button>
    </div>`;
  }).join('');
  return `<div class="card ex-card${ex.sup ? ' sup' : ''}" data-ex="${idx}"${supAttr(ex)}>
    <div class="ex-head">
      <button class="ex-name" data-act="ex-open">${esc(exName(ex.exId))}</button>
      <button class="icon-btn icon-btn-sm" data-act="ex-menu" aria-label="Opciones">${dotsIcon}</button>
    </div>
    ${ex.showNotes || ex.notes ? `<textarea class="ex-notes" data-act="notes" rows="1" placeholder="Notas del ejercicio">${esc(ex.notes || '')}</textarea>` : ''}
    ${exExtrasHTML(ex)}
    <div class="set-head"><span>SERIE</span><span>ANTERIOR</span><span>KG</span><span>REPS</span><span>✓</span></div>
    ${rows}
    <button class="btn btn-ghost btn-block btn-small add-set" data-act="add-set">＋ Añadir serie</button>
  </div>`;
}
function renderWk() {
  if (!wkPage) return;
  const d = wkData;
  const isActive = wkMode === 'active';
  const done = d.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  const vol = d.exercises.reduce((a, e) => a + e.sets.filter(s => s.done && s.type !== 'warmup').reduce((b, s) => b + setVol(s), 0), 0);
  const scroll = wkPage.el.querySelector('.page-body') ? wkPage.el.querySelector('.page-body').scrollTop : 0;
  wkPage.el.innerHTML = `
    <div class="page-bar">
      <button class="icon-btn" data-act="wk-min" aria-label="${isActive ? 'Minimizar' : 'Cancelar'}">${isActive ? downIcon : backIcon}</button>
      <div class="page-bar-title">
        <input class="wk-title" data-act="title" value="${esc(d.title)}" aria-label="Nombre del entreno">
        <small>${isActive ? `<span data-clock>${fmtClock((Date.now() - d.start) / 1000)}</span> · ` : esc(fmtWDate(d.start)) + ' · '}${fmtInt(vol)} kg · ${done} series</small>
      </div>
      <button class="btn btn-small btn-primary" data-act="wk-finish">${isActive ? 'Terminar' : 'Guardar'}</button>
    </div>
    <div class="page-body">
      ${d.exercises.map(exCardHTML).join('')}
      ${!d.exercises.length ? '<p class="fine center" style="margin:30px 0 10px">Añade tu primer ejercicio.</p>' : ''}
      <button class="btn btn-secondary btn-block" data-act="add-ex">＋ Añadir ejercicio</button>
      ${isActive ? '<button class="btn btn-danger-ghost btn-block" data-act="wk-discard">Descartar entreno</button>' : ''}
      <div style="height:120px"></div>
    </div>`;
  wkPage.el.querySelector('.page-body').scrollTop = scroll;
}
function updateWkHeader() {
  if (!wkPage) return;
  const small = wkPage.el.querySelector('.page-bar-title small');
  const d = wkData;
  const done = d.exercises.reduce((a, e) => a + e.sets.filter(s => s.done).length, 0);
  const vol = d.exercises.reduce((a, e) => a + e.sets.filter(s => s.done && s.type !== 'warmup').reduce((b, s) => b + setVol(s), 0), 0);
  if (small) small.innerHTML = `${wkMode === 'active' ? `<span data-clock>${fmtClock((Date.now() - d.start) / 1000)}</span> · ` : esc(fmtWDate(d.start)) + ' · '}${fmtInt(vol)} kg · ${done} series`;
}
const wkChanged = () => { if (wkMode === 'active') saveActive(); };

function wkInput(e) {
  const t = e.target;
  if (t.matches('.set-in')) {
    const row = t.closest('.set-row');
    const s = wkData.exercises[+row.dataset.ex].sets[+row.dataset.set];
    if (t.dataset.f === 'kg') { const v = parseKg(t.value); s.kg = t.value.trim() === '' || isNaN(v) ? null : v; }
    else { const v = parseInt(t.value, 10); s.reps = isNaN(v) ? null : v; }
    if (s.done) updateWkHeader();
    wkChanged();
  } else if (t.dataset.act === 'notes') {
    wkData.exercises[+t.closest('.ex-card').dataset.ex].notes = t.value;
    wkChanged();
  } else if (t.dataset.act === 'title') {
    wkData.title = t.value;
    wkChanged();
  }
}
function wkChange(e) {
  if (e.target.dataset.act === 'title') { wkData.title = e.target.value.trim() || 'Entreno'; wkChanged(); renderActiveBar(); }
}

async function wkClick(e) {
  const b = e.target.closest('[data-act]');
  if (!b || b.tagName === 'INPUT' || b.tagName === 'TEXTAREA') return;
  const act = b.dataset.act;
  const card = b.closest('[data-ex]');
  const ex = card ? wkData.exercises[+card.dataset.ex] : null;
  const row = b.closest('.set-row');
  const si = row ? +row.dataset.set : -1;

  if (act === 'wk-min') { popLayer(); return; }
  if (act === 'wk-finish') { wkMode === 'active' ? finishWorkout() : saveEditedWorkout(); return; }
  if (act === 'wk-discard') {
    const ok = await ask({ title: '¿Descartar el entreno?', message: 'Se perderá todo lo apuntado en este entreno.', ok: 'Descartar', cancel: 'Seguir', danger: true });
    if (!ok) return;
    G.active = null; saveActive(true); stopRest(); popLayer(); renderActiveBar(); gymRenderAll();
    toast('Entreno descartado');
    return;
  }
  if (act === 'add-ex') {
    const ids = await pickExercises();
    if (ids && ids.length) { ids.forEach(id => wkData.exercises.push(newActiveEx(id))); wkChanged(); renderWk(); }
    return;
  }
  if (!ex) return;
  if (act === 'ex-open') { openExercise(ex.exId); return; }
  if (act === 'add-set') {
    const last = ex.sets[ex.sets.length - 1];
    const prev = prevSetsFor(ex.exId) || [];
    const p = prev[ex.sets.length];
    ex.sets.push({ type: 'normal', kg: null, reps: null, done: wkMode === 'edit', ph: { kg: last ? (last.kg ?? last.ph?.kg ?? null) : p?.kg ?? null, reps: last ? (last.reps ?? last.ph?.reps ?? null) : p?.reps ?? null } });
    wkChanged(); renderWk();
    return;
  }
  if (act === 'ex-rest') {
    const v = await pickRest(ex.rest ?? S.rest);
    if (v == null) return;
    ex.rest = v;
    const e2 = exById.get(ex.exId); if (e2) { e2.rest = v; DB.put('exercises', e2); }
    wkChanged(); renderWk();
    return;
  }
  if (act === 'ex-menu') {
    const i = +card.dataset.ex;
    const lastKg = [...ex.sets].reverse().find(s => s.kg || s.ph?.kg);
    const v = await actionSheet(exName(ex.exId), [
      { label: ex.showNotes || ex.notes ? 'Ocultar notas' : 'Añadir nota', value: 'notes' },
      { label: 'Calculadora de discos', value: 'plates' },
      ...(i > 0 ? [{ label: 'Subir', value: 'up' }] : []),
      ...(i < wkData.exercises.length - 1 ? [{ label: 'Bajar', value: 'down' }] : []),
      ...supMenuItems(i), { label: 'Reemplazar ejercicio', value: 'replace' },
      { label: 'Quitar ejercicio', value: 'remove', danger: true },
    ]);
    if (v === 'notes') { ex.showNotes = !(ex.showNotes || ex.notes); if (!ex.showNotes) ex.notes = ''; }
    else if (v === 'plates') { plateCalc(lastKg ? (lastKg.kg || lastKg.ph.kg) : null); return; }
    else if (v === 'up' || v === 'down') { const j = v === 'up' ? i - 1 : i + 1; [wkData.exercises[i], wkData.exercises[j]] = [wkData.exercises[j], wkData.exercises[i]]; }
    else if (v === 'replace') {
      const ids = await pickExercises({ multi: false, title: 'Reemplazar por' });
      if (!ids) return;
      const n = newActiveEx(ids[0]);
      n.sets = ex.sets.map((s, k) => ({ ...n.sets[k] || n.sets[n.sets.length - 1] || { type: 'normal', ph: {} }, type: s.type, done: false, kg: null, reps: null }));
      wkData.exercises[i] = n;
    } else if (v === 'remove') {
      const ok = await ask({ title: 'Quitar ejercicio', message: `¿Quitar «${exName(ex.exId)}» de este entreno?`, ok: 'Quitar', cancel: 'Cancelar', danger: true });
      if (!ok) return;
      wkData.exercises.splice(i, 1);
    } else if (v === 'sup-link' || v === 'sup-unlink') toggleSup(i, v);
    else return;
    wkChanged(); renderWk();
    return;
  }
  if (act === 'sug') return applySug(ex, b);
  if (si < 0) return;
  const s = ex.sets[si];
  if (act === 'set-menu') {
    const v = await actionSheet(`Serie ${setLabel(ex, si)}`, [
      ...Object.entries(SET_TYPES).map(([k, t]) => ({ label: t.label, value: k, on: s.type === k })),
      { label: 'Borrar serie', value: 'del', danger: true },
    ]);
    if (!v) return;
    if (v === 'del') ex.sets.splice(si, 1); else s.type = v;
    wkChanged(); renderWk(); updateWkHeader();
    return;
  }
  if (act === 'use-prev') {
    const p = (prevSetsFor(ex.exId, wkMode === 'edit' ? wkData.id : null) || [])[si];
    if (!p) return;
    s.kg = p.kg ?? null; s.reps = p.reps ?? null;
    wkChanged(); renderWk();
    return;
  }
  if (act === 'check') checkSet(ex, +card.dataset.ex, si, row, false);
}

async function finishWorkout() {
  const a = G.active;
  const done = a.exercises.reduce((n, e) => n + e.sets.filter(s => s.done).length, 0);
  if (!done) {
    const ok = await ask({ title: 'No has completado ninguna serie', message: 'Marca con ✓ las series que hayas hecho. ¿Quieres descartar el entreno?', ok: 'Descartar', cancel: 'Seguir', danger: true });
    if (ok) { G.active = null; saveActive(true); stopRest(); popLayer(); renderActiveBar(); gymRenderAll(); }
    return;
  }
  const pending = a.exercises.reduce((n, e) => n + e.sets.filter(s => !s.done).length, 0);
  if (pending) {
    const ok = await ask({ title: 'Terminar entreno', message: `Hay ${pending} ${pending === 1 ? 'serie sin marcar que se descartará' : 'series sin marcar que se descartarán'}.`, ok: 'Terminar', cancel: 'Seguir' });
    if (!ok) return;
  } else {
    const ok = await ask({ title: '¿Terminar el entreno?', message: `Duración: ${fmtDur(Date.now() - a.start)}.`, ok: 'Terminar', cancel: 'Seguir' });
    if (!ok) return;
  }
  const w = {
    id: a.id, title: (a.title || '').trim() || 'Entreno', routineId: a.routineId || null, start: a.start, end: Date.now(), notes: a.notes || '',
    exercises: a.exercises.map(e => ({ exId: e.exId, notes: e.notes || '', ...(e.sup ? { sup: e.sup } : {}), sets: e.sets.filter(s => s.done).map(s => ({ type: s.type, kg: s.kg || 0, reps: s.reps || 0 })) })).filter(e => e.sets.length),
  };
  const prs = workoutPRs(w);
  await DB.put('workouts', w);
  G.workouts.push(w);
  gymDerive();
  const restByEx = new Map(a.exercises.map(e => [e.exId, e.rest]));
  G.active = null;
  await saveActive(true);
  stopRest();
  popLayer();
  renderActiveBar();
  gymRenderAll();
  setTimeout(() => showSummary(w, prs, restByEx), 280);
}

async function showSummary(w, prs, restByEx) {
  const pg = openPage();
  pg.el.innerHTML = `
    <div class="page-bar"><span></span><div class="page-bar-title center"><b>¡Entreno completado!</b></div><button class="btn btn-small btn-primary" data-x>Hecho</button></div>
    <div class="page-body">
      <div class="summary-hero">
        <div class="trophy">${prs.length ? '🏆' : '💪'}</div>
        <h2>${esc(w.title)}</h2>
        <p class="sub">${fmtWDate(w.start)}</p>
      </div>
      <div class="stats">
        <div class="card stat"><div class="label">Duración</div><div class="val">${fmtDur(w.end - w.start)}</div></div>
        <div class="card stat"><div class="label">Volumen</div><div class="val">${fmtInt(wVolume(w))}</div><div class="sub">kg</div></div>
        <div class="card stat"><div class="label">Series</div><div class="val">${wSetCount(w)}</div></div>
      </div>
      ${prs.length ? `<h3 class="section-title">Récords nuevos</h3><div class="card list-wrap">${prs.map(p => `<div class="pr-row"><span>🏆 ${esc(exName(p.exId))}<small>${p.label}</small></span><b>${p.value}</b></div>`).join('')}</div>` : ''}
      <h3 class="section-title">Ejercicios</h3>
      <div class="card list-wrap">${w.exercises.map(e => `<div class="pr-row"><span>${esc(exName(e.exId))}<small>${workSets(e.sets).length} series · mejor ${esc(fmtSet(bestSet(e.sets)))}</small></span></div>`).join('')}</div>
    </div>`;
  pg.el.querySelector('[data-x]').onclick = () => popLayer();
  // ¿Actualizar la rutina?
  const r = w.routineId && G.routines.find(x => x.id === w.routineId);
  if (r) {
    const sig = list => list.map(e => `${e.exId}:${e.sets.length}`).join('|');
    if (sig(r.exercises) !== sig(w.exercises)) {
      const ok = await ask({ title: `¿Actualizar «${r.name}»?`, message: 'Has cambiado ejercicios o series respecto a la rutina. ¿Guardo estos cambios en la rutina?', ok: 'Actualizar', cancel: 'No' });
      if (ok) {
        r.exercises = w.exercises.map(e => ({ exId: e.exId, rest: restByEx.get(e.exId) ?? null, ...(e.sup ? { sup: e.sup } : {}), sets: e.sets.map(s => ({ type: s.type, kg: s.kg, reps: s.reps })) }));
        await DB.put('routines', r);
        gymRenderAll();
        toast('Rutina actualizada');
      }
    }
  }
}
function bestSet(sets) {
  let b = sets[0];
  for (const s of workSets(sets)) if (e1rm(s.kg, s.reps) > e1rm(b.kg, b.reps) || (b.type === 'warmup')) b = s;
  return b || { kg: 0, reps: 0 };
}

async function saveEditedWorkout() {
  const d = wkData;
  const w = {
    id: d.id, title: (d.title || '').trim() || 'Entreno', routineId: d.routineId || null, start: d.start, end: d.end, notes: d.notes || '',
    exercises: d.exercises.map(e => ({ exId: e.exId, notes: e.notes || '', ...(e.sup ? { sup: e.sup } : {}), sets: e.sets.filter(s => s.done !== false).map(s => ({ type: s.type, kg: s.kg ?? s.ph?.kg ?? 0, reps: s.reps ?? s.ph?.reps ?? 0, ...(s.km ? { km: s.km } : {}), ...(s.sec ? { sec: s.sec } : {}) })) })).filter(e => e.sets.length),
  };
  if (!w.exercises.length) return toast('El entreno no tiene ninguna serie');
  await DB.put('workouts', w);
  G.workouts = G.workouts.filter(x => x.id !== w.id);
  G.workouts.push(w);
  gymDerive();
  popLayer();
  gymRenderAll();
  toast('Entreno guardado');
  if (curDetail) setTimeout(() => { if (curDetail) renderDetail(w.id); }, 50);
}

/* ================= Descanso ================= */
let audioCtx = null;
function beep() {
  if (!S.sound) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const t = audioCtx.currentTime;
    [0, 0.25, 0.5].forEach((d, i) => {
      const o = audioCtx.createOscillator(), g = audioCtx.createGain();
      o.frequency.value = i === 2 ? 1175 : 880;
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.exponentialRampToValueAtTime(0.35, t + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.2);
      o.connect(g).connect(audioCtx.destination);
      o.start(t + d); o.stop(t + d + 0.22);
    });
  } catch (_) {}
}
// startRest, stopRest y tick están en gym-plus.js (temporizador o cronómetro).

function renderActiveBar() {
  const bar = $('#active-bar');
  const show = !!G.active && !wkPage;
  bar.hidden = !show;
  document.body.classList.toggle('has-active', show);
  if (G.active) $('#ab-title').textContent = G.active.title || 'Entreno';
  const t = $('#ba-gym-title'), sub = $('#ba-gym-sub');
  if (t) {
    if (G.active) { t.textContent = 'Continuar entrenamiento'; sub.innerHTML = `${esc(G.active.title)} · <span data-clock></span>`; }
    else { t.textContent = 'Empezar entrenamiento'; sub.textContent = G.routines.length ? 'Elige una rutina o empieza vacío' : 'Empieza vacío o crea una rutina'; }
  }
  tick();
}
$('#active-bar').addEventListener('click', openActive);

/* ================= Pestaña Entreno ================= */
function gymRenderAll() {
  renderRoutines();
  renderGymHistory();
  renderExList();
  renderInicio();
  renderGymSettings();
  renderActiveBar();
  showGymView(S.gymView || 'rutinas', false);
}
function showGymView(v, save = true) {
  S.gymView = v;
  $$('#gym-seg button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  ['rutinas', 'historial', 'ejercicios'].forEach(k => { $('#gym-' + k).hidden = k !== v; });
  if (save) saveSettings();
}
$$('#gym-seg button').forEach(b => b.addEventListener('click', () => showGymView(b.dataset.view)));

function renderRoutines() {
  const box = $('#gym-rutinas');
  const last = G.workouts[0];
  let html = `<div class="gym-actions">
    <button class="btn btn-primary btn-block" data-g="empty">Empezar entreno vacío</button>
    ${last ? `<button class="btn btn-ghost btn-block" data-g="repeat"><span>Repetir último: <b>${esc(last.title)}</b> · ${fmtWDate(last.start)}</span></button>` : ''}
  </div>
  <div class="card-head" style="margin-top:20px"><h2>Mis rutinas</h2><button class="link" data-g="new">＋ Nueva</button></div>`;
  if (!G.routines.length) html += `<div class="card empty-card"><p>Aún no tienes rutinas.</p><button class="btn btn-secondary btn-block" data-g="new">Crear rutina</button><button class="btn btn-ghost btn-block" data-action="import-file">Importar CSV de Hevy</button></div>`;
  html += G.routines.map(r => {
    const sets = r.exercises.reduce((a, e) => a + e.sets.length, 0);
    const lastR = G.workouts.find(w => w.routineId === r.id);
    return `<div class="card routine" data-rid="${r.id}">
      <div class="routine-head"><div><h3>${esc(r.name)}</h3><small class="sub">${r.exercises.length} ejercicios · ${sets} series${lastR ? ` · último ${fmtD(F.dayMon, localISO(lastR.start))}` : ''}</small></div>
      <button class="icon-btn icon-btn-sm" data-g="rmenu">${dotsIcon}</button></div>
      <p class="routine-ex">${r.exercises.map(e => esc(exName(e.exId))).join(' · ')}</p>
      <button class="btn btn-secondary btn-block" data-g="start">Empezar</button>
    </div>`;
  }).join('');
  box.innerHTML = html;
}
$('#gym-rutinas').addEventListener('click', async e => {
  const b = e.target.closest('[data-g]');
  if (!b) return;
  const g = b.dataset.g;
  const r = G.routines.find(x => x.id === (b.closest('[data-rid]') || {}).dataset?.rid);
  if (g === 'empty') startWorkout();
  else if (g === 'repeat') startWorkout({ from: G.workouts[0] });
  else if (g === 'new') editRoutine(null);
  else if (g === 'start' && r) startWorkout({ routine: r });
  else if (g === 'rmenu' && r) {
    const v = await actionSheet(r.name, [
      { label: 'Editar', value: 'edit' }, { label: 'Duplicar', value: 'dup' },
      ...(G.routines.indexOf(r) > 0 ? [{ label: 'Subir', value: 'up' }] : []),
      { label: 'Borrar', value: 'del', danger: true },
    ]);
    if (v === 'edit') editRoutine(r);
    else if (v === 'dup') { const c = JSON.parse(JSON.stringify(r)); c.id = uid(); c.name += ' (copia)'; c.order = G.routines.length; G.routines.push(c); await DB.put('routines', c); gymDerive(); gymRenderAll(); }
    else if (v === 'up') {
      const i = G.routines.indexOf(r);
      [G.routines[i - 1], G.routines[i]] = [G.routines[i], G.routines[i - 1]];
      G.routines.forEach((x, k) => { x.order = k; });
      await DB.putMany('routines', G.routines); gymDerive(); gymRenderAll();
    } else if (v === 'del') {
      const ok = await ask({ title: `¿Borrar «${r.name}»?`, message: 'Los entrenos ya hechos con esta rutina no se borran.', ok: 'Borrar', cancel: 'Cancelar', danger: true });
      if (!ok) return;
      G.routines = G.routines.filter(x => x !== r); await DB.del('routines', r.id); gymDerive(); gymRenderAll(); toast('Rutina borrada');
    }
  }
});

/* --- Editor de rutinas --- */
function editRoutine(r) {
  const data = r ? JSON.parse(JSON.stringify(r)) : { id: uid(), name: '', order: G.routines.length, exercises: [] };
  const pg = openPage();
  const draw = () => {
    pg.el.innerHTML = `
      <div class="page-bar">
        <button class="icon-btn" data-r="cancel">${backIcon}</button>
        <div class="page-bar-title"><b>${r ? 'Editar rutina' : 'Nueva rutina'}</b></div>
        <button class="btn btn-small btn-primary" data-r="save">Guardar</button>
      </div>
      <div class="page-body">
        <input class="big-name" id="r-name" placeholder="Nombre de la rutina" value="${esc(data.name)}">
        ${data.exercises.map((e, i) => `<div class="card r-ex" data-i="${i}">
          <div class="ex-head"><b>${esc(exName(e.exId))}</b>
            <span class="r-tools">
              <button class="icon-btn icon-btn-sm" data-r="up" ${i ? '' : 'disabled'}>↑</button>
              <button class="icon-btn icon-btn-sm" data-r="down" ${i < data.exercises.length - 1 ? '' : 'disabled'}>↓</button>
              <button class="icon-btn icon-btn-sm danger" data-r="del">✕</button>
            </span></div>
          <div class="r-row"><span>Series</span><span class="stepper"><button data-r="minus">−</button><b>${e.sets.length}</b><button data-r="plus">＋</button></span></div>
          <div class="r-row"><span>Descanso</span><button class="pill-btn" data-r="rest">${fmtRest(e.rest ?? (exById.get(e.exId) || {}).rest ?? S.rest)}</button></div>
        </div>`).join('')}
        <button class="btn btn-secondary btn-block" data-r="add">＋ Añadir ejercicios</button>
        <div style="height:60px"></div>
      </div>`;
  };
  draw();
  pg.el.addEventListener('input', e => { if (e.target.id === 'r-name') data.name = e.target.value; });
  pg.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-r]');
    if (!b) return;
    const a = b.dataset.r;
    const i = +((b.closest('[data-i]') || {}).dataset?.i ?? -1);
    const ex = data.exercises[i];
    if (a === 'cancel') popLayer();
    else if (a === 'save') {
      data.name = data.name.trim();
      if (!data.name) return toast('Ponle un nombre a la rutina');
      if (!data.exercises.length) return toast('Añade al menos un ejercicio');
      G.routines = G.routines.filter(x => x.id !== data.id);
      G.routines.push(data);
      await DB.put('routines', data);
      gymDerive(); gymRenderAll(); popLayer(); toast('Rutina guardada');
    } else if (a === 'add') {
      const ids = await pickExercises();
      if (!ids) return;
      ids.forEach(id => {
        const prev = prevSetsFor(id);
        data.exercises.push({ exId: id, rest: null, sets: prev ? prev.map(s => ({ type: s.type, kg: s.kg, reps: s.reps })) : [{ type: 'normal', kg: null, reps: null }, { type: 'normal', kg: null, reps: null }, { type: 'normal', kg: null, reps: null }] });
      });
      draw();
    } else if (!ex) return;
    else if (a === 'up' || a === 'down') { const j = a === 'up' ? i - 1 : i + 1; [data.exercises[i], data.exercises[j]] = [data.exercises[j], data.exercises[i]]; draw(); }
    else if (a === 'del') { data.exercises.splice(i, 1); draw(); }
    else if (a === 'plus') { ex.sets.push({ ...(ex.sets[ex.sets.length - 1] || { type: 'normal', kg: null, reps: null }) }); draw(); }
    else if (a === 'minus') { if (ex.sets.length > 1) ex.sets.pop(); draw(); }
    else if (a === 'rest') { const v = await pickRest(ex.rest ?? S.rest); if (v != null) { ex.rest = v; draw(); } }
  });
}

/* --- Historial y estadísticas --- */
let histLimit = 30;
function weekStartMs(ms) {
  const d = new Date(ms); d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.getTime();
}
function renderGymHistory() {
  const box = $('#gym-historial');
  if (!G.workouts.length) { box.innerHTML = '<p class="fine center" style="margin-top:30px">Aún no hay entrenos. ¡Empieza el primero!</p>'; return; }
  // Últimas 12 semanas
  const nowW = weekStartMs(Date.now());
  const weeks = [];
  for (let i = 11; i >= 0; i--) { const d = new Date(nowW); d.setDate(d.getDate() - i * 7); weeks.push({ t: d.getTime(), n: 0, vol: 0, dur: 0 }); }
  for (const w of G.workouts) {
    const ws = weekStartMs(w.start);
    const k = weeks.find(x => x.t === ws);
    if (k) { k.n++; k.vol += wVolume(w); k.dur += (w.end - w.start) / 60000; }
    if (ws < weeks[0].t) break;
  }
  const metric = S.gymStat || 'count';
  const val = x => (metric === 'count' ? x.n : metric === 'vol' ? x.vol : x.dur);
  const max = Math.max(1, ...weeks.map(val));
  const fmtV = v => (metric === 'count' ? String(v) : metric === 'vol' ? (v >= 1000 ? fmtN(Math.round(v / 100) / 10) + 'k' : fmtInt(v)) : (v >= 60 ? `${Math.floor(v / 60)}h${pad2(Math.round(v % 60))}` : `${Math.round(v)}m`));
  const thisW = weeks[weeks.length - 1];
  let html = `<div class="card">
    <div class="card-head"><h2>Últimas 12 semanas</h2></div>
    <div class="seg seg-small seg-block" id="stat-seg"><button data-st="count" class="${metric === 'count' ? 'on' : ''}">Entrenos</button><button data-st="vol" class="${metric === 'vol' ? 'on' : ''}">Volumen</button><button data-st="dur" class="${metric === 'dur' ? 'on' : ''}">Tiempo</button></div>
    <div class="bars">${weeks.map(x => `<div class="bar-col"><small>${val(x) ? fmtV(val(x)) : ''}</small><div class="bar" style="height:${(val(x) / max * 100).toFixed(1)}%"></div><span>${new Date(x.t).getDate()}/${new Date(x.t).getMonth() + 1}</span></div>`).join('')}</div>
    <p class="fine center">Esta semana: <b>${thisW.n}</b> ${thisW.n === 1 ? 'entreno' : 'entrenos'} · ${fmtInt(thisW.vol)} kg</p>
  </div>`;
  html += calendarHTML() + muscleHTML();
  let month = '';
  const list = G.workouts.slice(0, histLimit);
  for (const w of list) {
    const m = localISO(w.start).slice(0, 7);
    if (m !== month) { html += `<div class="month-head"><span>${cap(fmtD(F.monYear, m + '-01'))}</span></div>`; month = m; }
    html += `<button class="card wk-item" data-wid="${w.id}">
      <div class="wk-item-head"><b>${esc(w.title)}</b><small>${fmtWDate(w.start)}</small></div>
      <div class="wk-item-stats"><span>⏱ ${fmtDur(w.end - w.start)}</span><span>🏋️ ${fmtInt(wVolume(w))} kg</span><span>${wSetCount(w)} series</span></div>
      <div class="wk-item-ex">${w.exercises.slice(0, 4).map(e => `${workSets(e.sets).length}× ${esc(exName(e.exId))}`).join('<br>')}${w.exercises.length > 4 ? `<br><span class="sub">+${w.exercises.length - 4} más</span>` : ''}</div>
    </button>`;
  }
  if (G.workouts.length > histLimit) html += `<button class="btn btn-ghost btn-block" data-more>Ver más (${G.workouts.length - histLimit})</button>`;
  box.innerHTML = html;
}
$('#gym-historial').addEventListener('click', e => {
  const st = e.target.closest('[data-st]');
  if (st) { S.gymStat = st.dataset.st; saveSettings(); renderGymHistory(); return; }
  if (e.target.closest('[data-more]')) { histLimit += 50; renderGymHistory(); return; }
  const it = e.target.closest('[data-wid]');
  if (it) openWorkoutDetail(it.dataset.wid);
});

/* --- Detalle de un entreno --- */
let curDetail = null;
function openWorkoutDetail(id) {
  const pg = openPage();
  curDetail = pg;
  pg.onClose = () => { curDetail = null; };
  renderDetail(id);
  pg.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-d]');
    if (!b) return;
    const w = G.workouts.find(x => x.id === pg.wid);
    if (!w) return;
    const a = b.dataset.d;
    if (a === 'back') popLayer();
    else if (a === 'ex') openExercise(b.dataset.ex);
    else if (a === 'repeat') { popLayer(); setTimeout(() => startWorkout({ from: w }), 260); }
    else if (a === 'edit') {
      const copy = JSON.parse(JSON.stringify(w));
      copy.exercises = copy.exercises.map(e => ({ uid: uid(), exId: e.exId, notes: e.notes, rest: null, sup: e.sup || null, sets: e.sets.map(s => ({ ...s, done: true, ph: {} })) }));
      openWorkoutEditor(copy, 'edit');
    } else if (a === 'del') {
      const ok = await ask({ title: '¿Borrar este entreno?', message: `${w.title} · ${fmtWDate(w.start)}`, ok: 'Borrar', cancel: 'Cancelar', danger: true });
      if (!ok) return;
      await DB.del('workouts', w.id);
      G.workouts = G.workouts.filter(x => x !== w); gymDerive(); gymRenderAll(); popLayer();
      toast('Entreno borrado', { action: 'Deshacer', ms: 6000, onAction: async () => { await DB.put('workouts', w); G.workouts.push(w); gymDerive(); gymRenderAll(); toast('Entreno restaurado'); } });
    }
  });
}
function renderDetail(id) {
  const pg = curDetail;
  const w = G.workouts.find(x => x.id === id);
  if (!pg || !w) return;
  pg.wid = id;
  const prs = workoutPRs(w);
  const prSet = new Set(prs.map(p => p.exId));
  pg.el.innerHTML = `
    <div class="page-bar">
      <button class="icon-btn" data-d="back">${backIcon}</button>
      <div class="page-bar-title"><b>${esc(w.title)}</b><small>${cap(fmtD(F.longDate, localISO(w.start)))} · ${new Date(w.start).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</small></div>
      <button class="btn btn-small btn-ghost" data-d="edit">Editar</button>
    </div>
    <div class="page-body">
      <div class="stats">
        <div class="card stat"><div class="label">Duración</div><div class="val">${fmtDur(w.end - w.start)}</div></div>
        <div class="card stat"><div class="label">Volumen</div><div class="val">${fmtInt(wVolume(w))}</div><div class="sub">kg</div></div>
        <div class="card stat"><div class="label">Récords</div><div class="val">${prs.length ? '🏆 ' + prs.length : '—'}</div></div>
      </div>
      ${w.exercises.map(e => `<div class="card ex-detail">
        <button class="ex-name" data-d="ex" data-ex="${e.exId}">${esc(exName(e.exId))}${prSet.has(e.exId) ? ' 🏆' : ''}</button>
        ${e.notes ? `<p class="sub">${esc(e.notes)}</p>` : ''}
        ${e.sets.map((s, i) => `<div class="det-set"><span class="set-lbl t-${s.type}">${setLabel(e, i)}</span><span>${esc(fmtSet(s))}</span>${s.type !== 'warmup' && s.kg && s.reps ? `<small class="sub">1RM ≈ ${fmtN(Math.round(e1rm(s.kg, s.reps)))}</small>` : '<small></small>'}</div>`).join('')}
      </div>`).join('')}
      <button class="btn btn-secondary btn-block" data-d="repeat">Repetir este entreno</button>
      <button class="btn btn-danger-ghost btn-block" data-d="del">Borrar entreno</button>
      <div style="height:40px"></div>
    </div>`;
}

/* --- Ejercicios --- */
function renderExList() {
  const box = $('#ex-list');
  const q = norm($('#ex-search').value || '');
  const items = G.exercises.filter(e => !q || norm(e.name).includes(q)).sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (!G.exercises.length) { box.innerHTML = '<p class="fine center" style="margin-top:30px">Aún no hay ejercicios. Se crean al hacer entrenos o al importar de Hevy.</p>'; return; }
  box.innerHTML = `<div class="card list-wrap">${items.map(e => {
    const h = exHist.get(e.id) || [];
    return `<button class="hist-row" data-exid="${e.id}"><span class="hist-date">${esc(e.name)}<small>${e.muscle || ''}</small></span><span class="sub">${h.length ? `${h.length} ${h.length === 1 ? 'vez' : 'veces'}` : ''}</span>${chevIcon}</button>`;
  }).join('') || '<p class="fine center">Nada coincide.</p>'}</div>
  <button class="btn btn-ghost btn-block" data-newex style="margin-top:12px">＋ Crear ejercicio</button>`;
}
$('#ex-search').addEventListener('input', renderExList);
$('#ex-list').addEventListener('click', async e => {
  if (e.target.closest('[data-newex]')) {
    const ids = await pickExercises({ multi: false, title: 'Crear ejercicio' });
    if (ids) { renderExList(); openExercise(ids[0]); }
    return;
  }
  const b = e.target.closest('[data-exid]');
  if (b) openExercise(b.dataset.exid);
});

function openExercise(id) {
  const ex = exById.get(id);
  if (!ex) return;
  const pg = openPage();
  let metric = 'e1', range = 'all';
  const sessions = () => (exHist.get(id) || []);
  const draw = () => {
    const ss = sessions();
    const b = bests(id);
    let maxRepsSet = null;
    for (const { ex: e } of ss) for (const s of workSets(e.sets)) if (!maxRepsSet || (s.reps || 0) > maxRepsSet.reps) maxRepsSet = s;
    const bestE1Set = (() => { let r = null; for (const { ex: e } of ss) for (const s of workSets(e.sets)) if (!r || e1rm(s.kg, s.reps) > e1rm(r.kg, r.reps)) r = s; return r; })();
    pg.el.innerHTML = `
      <div class="page-bar">
        <button class="icon-btn" data-x="back">${backIcon}</button>
        <div class="page-bar-title"><b>${esc(ex.name)}</b><small>${ex.muscle || ''} · ${ss.length} ${ss.length === 1 ? 'sesión' : 'sesiones'}</small></div>
        <button class="icon-btn" data-x="menu">${dotsIcon}</button>
      </div>
      <div class="page-body">
        ${ss.length ? `
        <div class="stats stats-2">
          <div class="card stat"><div class="label">Peso máximo</div><div class="val">${fmtN(b.kg)} kg</div></div>
          <div class="card stat"><div class="label">1RM estimado</div><div class="val">${fmtN(Math.round(b.e1 * 10) / 10)} kg</div><div class="sub">${bestE1Set ? esc(fmtSet(bestE1Set)) : ''}</div></div>
          <div class="card stat"><div class="label">Mejor serie</div><div class="val">${fmtInt(b.vol)} kg</div><div class="sub">volumen (kg × reps)</div></div>
          <div class="card stat"><div class="label">Máx. reps</div><div class="val">${b.reps}</div><div class="sub">${maxRepsSet ? esc(fmtSet(maxRepsSet)) : ''}</div></div>
        </div>
        ${exChartHTML(metric, range)}
        <h3 class="section-title">Historial</h3>
        ${ss.slice(0, 40).map(({ w, ex: e }) => `<div class="card ex-detail">
          <div class="wk-item-head"><b>${esc(w.title)}</b><small>${fmtWDate(w.start)}</small></div>
          ${e.sets.map((s, i) => `<div class="det-set"><span class="set-lbl t-${s.type}">${setLabel(e, i)}</span><span>${esc(fmtSet(s))}</span><small class="sub">${s.type !== 'warmup' && s.kg && s.reps ? '1RM ≈ ' + fmtN(Math.round(e1rm(s.kg, s.reps))) : ''}</small></div>`).join('')}
        </div>`).join('')}
        ${ss.length > 40 ? `<p class="fine center">Mostrando las 40 sesiones más recientes.</p>` : ''}
        ` : '<p class="fine center" style="margin-top:30px">Aún no has hecho este ejercicio.</p>'}
        <div style="height:40px"></div>
      </div>`;
    exChartMount(pg.el, ss, metric, range, ex.name);
  };
  draw();
  pg.el.addEventListener('click', async e => {
    const m = e.target.closest('[data-m]'), xr = e.target.closest('[data-xr]');
    if (m || xr) { if (m) metric = m.dataset.m; else range = xr.dataset.xr; draw(); return; }
    const b = e.target.closest('[data-x]');
    if (!b) return;
    if (b.dataset.x === 'back') popLayer();
    else if (b.dataset.x === 'menu') {
      const v = await actionSheet(ex.name, [
        { label: 'Renombrar', value: 'rename' },
        { label: `Grupo muscular: ${ex.muscle || 'Otro'}`, value: 'muscle' },
        { label: `Descanso: ${fmtRest(ex.rest ?? S.rest)}`, value: 'rest' },
        { label: 'Fusionar con otro ejercicio', sub: 'Une sus historiales (para nombres duplicados)', value: 'merge' },
        { label: 'Borrar ejercicio', value: 'del', danger: true },
      ]);
      if (v === 'rename') {
        const name = await promptText('Renombrar ejercicio', ex.name);
        if (name && name.trim()) { ex.name = name.trim(); await DB.put('exercises', ex); gymDerive(); gymRenderAll(); draw(); }
      } else if (v === 'muscle') {
        const mm = await actionSheet('Grupo muscular', MUSCLES.map(x => ({ label: x, value: x, on: x === ex.muscle })));
        if (mm) { ex.muscle = mm; await DB.put('exercises', ex); gymRenderAll(); draw(); }
      } else if (v === 'rest') {
        const r = await pickRest(ex.rest ?? S.rest);
        if (r != null) { ex.rest = r; await DB.put('exercises', ex); draw(); }
      } else if (v === 'merge') {
        const ids = await pickExercises({ multi: false, title: `Fusionar «${ex.name}» con…` });
        if (!ids || ids[0] === ex.id) return;
        const target = exById.get(ids[0]);
        const ok = await ask({ title: 'Fusionar ejercicios', message: `Todo el historial de «${ex.name}» pasará a «${target.name}» y «${ex.name}» desaparecerá.`, ok: 'Fusionar', cancel: 'Cancelar' });
        if (!ok) return;
        await mergeExercises(ex.id, target.id);
        popLayer();
        setTimeout(() => openExercise(target.id), 260);
        toast('Ejercicios fusionados');
      } else if (v === 'del') {
        const used = sessions().length;
        const ok = await ask({ title: `¿Borrar «${ex.name}»?`, message: used ? `Se quitará de ${used} entrenos y de tus rutinas. Si es un duplicado, mejor usa «Fusionar».` : 'Se quitará también de tus rutinas.', ok: 'Borrar', cancel: 'Cancelar', danger: true });
        if (!ok) return;
        await deleteExercise(ex.id);
        popLayer();
        toast('Ejercicio borrado');
      }
    }
  });
}

function promptText(title, value = '') {
  return new Promise(res => {
    let result = null;
    genSheet.innerHTML = `<div class="grabber"></div><h2>${esc(title)}</h2>
      <input class="big-name" id="pt-in" value="${esc(value)}">
      <button class="btn btn-primary btn-block" id="pt-ok">Guardar</button>`;
    genSheet.onclick = null;
    $('#pt-ok', genSheet).onclick = () => { result = $('#pt-in', genSheet).value; closeSheet(); };
    openSheet(genSheet, () => res(result));
    setTimeout(() => $('#pt-in', genSheet).focus(), 50);
  });
}

async function mergeExercises(fromId, toId) {
  const touched = [];
  for (const w of G.workouts) {
    let ch = false;
    const out = [];
    for (const e of w.exercises) {
      if (e.exId === fromId) { e.exId = toId; ch = true; }
      const prevSame = out.find(o => o.exId === e.exId);
      if (prevSame && e.exId === toId) { prevSame.sets.push(...e.sets); ch = true; } else out.push(e);
    }
    if (ch) { w.exercises = out; touched.push(w); }
  }
  for (const r of G.routines) r.exercises.forEach(e => { if (e.exId === fromId) e.exId = toId; });
  if (G.active) G.active.exercises.forEach(e => { if (e.exId === fromId) e.exId = toId; });
  await DB.putMany('workouts', touched);
  await DB.putMany('routines', G.routines);
  await DB.del('exercises', fromId);
  G.exercises = G.exercises.filter(e => e.id !== fromId);
  gymDerive(); gymRenderAll();
}
async function deleteExercise(id) {
  const touched = [];
  for (const w of G.workouts) if (w.exercises.some(e => e.exId === id)) { w.exercises = w.exercises.filter(e => e.exId !== id); touched.push(w); }
  const empty = touched.filter(w => !w.exercises.length);
  for (const w of empty) await DB.del('workouts', w.id);
  G.workouts = G.workouts.filter(w => w.exercises.length);
  await DB.putMany('workouts', touched.filter(w => w.exercises.length));
  for (const r of G.routines) r.exercises = r.exercises.filter(e => e.exId !== id);
  await DB.putMany('routines', G.routines);
  await DB.del('exercises', id);
  G.exercises = G.exercises.filter(e => e.id !== id);
  gymDerive(); gymRenderAll();
}

/* ================= Inicio ================= */
function renderInicio() {
  const sub = $('#ba-weight-sub');
  if (sub) {
    const last = entries[entries.length - 1];
    sub.textContent = last ? `Último: ${fmtKg(last.kg)} kg · ${last.date === todayISO() ? 'hoy' : fmtD(F.dayMon, last.date)}` : 'Apunta tu peso de hoy';
  }
  const box = $('#home-quick');
  if (!box) return;
  let html = '';
  if (entries.length) {
    const n = entries.length;
    const lastT = D.trend[n - 1];
    let k = -1;
    for (let i = n - 1; i >= 0; i--) if (D.idx[i] <= D.idx[n - 1] - 30) { k = i; break; }
    const d30 = k >= 0 ? lastT - D.trend[k] : null;
    html += `<button class="card quick" data-goto="peso">
      <div><div class="label">Peso · media 7 días</div><div class="quick-val">${fmt1(lastT)} kg</div></div>
      <div class="quick-side">${d30 != null ? `<b class="${tone(d30)}">${fmtSigned(d30)}</b><small>30 días</small>` : ''}</div>${chevIcon}
    </button>`;
  }
  const ws = weekStartMs(Date.now());
  const week = G.workouts.filter(w => w.start >= ws);
  if (G.workouts.length) {
    const w = G.workouts[0];
    html += `<button class="card quick" data-quick-w="${w.id}">
      <div><div class="label">Último entreno</div><div class="quick-val">${esc(w.title)}</div><small class="sub">${fmtWDate(w.start)} · ${fmtDur(w.end - w.start)} · ${fmtInt(wVolume(w))} kg</small></div>${chevIcon}
    </button>
    <div class="card quick">
      <div><div class="label">Esta semana</div><div class="quick-val">${week.length} ${week.length === 1 ? 'entreno' : 'entrenos'}</div><small class="sub">${fmtInt(week.reduce((a, w2) => a + wVolume(w2), 0))} kg de volumen</small></div>
    </div>`;
  }
  box.innerHTML = html;
}
$('#home-quick').addEventListener('click', e => {
  const b = e.target.closest('[data-quick-w]');
  if (b) openWorkoutDetail(b.dataset.quickW);
});

/* ================= Ajustes de entreno ================= */
function renderGymSettings() {
  $('#set-rest').textContent = fmtRest(S.rest);
  $('#set-sound').checked = S.sound !== false;
  $('#set-bar').textContent = S.bar ? `${S.bar} kg` : 'Sin barra';
  renderRestModeSetting();
}
$('#set-rest').addEventListener('click', async () => { const v = await pickRest(S.rest); if (v != null) { S.rest = v; saveSettings(); renderGymSettings(); } });
$('#set-sound').addEventListener('change', e => { S.sound = e.target.checked; saveSettings(); if (S.sound) beep(); });
$('#set-bar').addEventListener('click', async () => {
  const v = await actionSheet('Barra', [20, 15, 10, 0].map(b => ({ label: b ? `${b} kg` : 'Sin barra', value: b, on: S.bar === b })));
  if (v != null) { S.bar = v; saveSettings(); renderGymSettings(); }
});

/* ================= Copias de seguridad ================= */
function gymBackupData() {
  return { exercises: G.exercises, routines: G.routines, workouts: G.workouts };
}
async function gymImportBackup(d) {
  const ex = (d.exercises || []).filter(e => e && e.id && e.name);
  const ro = (d.routines || []).filter(r => r && r.id && Array.isArray(r.exercises));
  const wo = (d.workouts || []).filter(w => w && w.id && Array.isArray(w.exercises) && w.start);
  await DB.putMany('exercises', ex);
  await DB.putMany('routines', ro);
  await DB.putMany('workouts', wo);
  const up = (arr, list) => { const m = new Map(arr.map(x => [x.id, x])); list.forEach(x => m.set(x.id, x)); return [...m.values()]; };
  G.exercises = up(G.exercises, ex);
  G.routines = up(G.routines, ro);
  G.workouts = up(G.workouts, wo);
  gymDerive();
}
async function gymWipe() {
  await Promise.all(['exercises', 'routines', 'workouts'].map(s => DB.clear(s)));
  await DB.putKey('active', null);
  G.exercises = []; G.routines = []; G.workouts = []; G.active = null;
  stopRest();
  gymDerive();
}

/* ================= Importar CSV de Hevy ================= */
function parseCSV(text) {
  const rows = [];
  let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
      else f += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(f); f = '';
      if (row.length > 1 || row[0] !== '') rows.push(row);
      row = [];
    } else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return rows;
}
const MONTHS = { ene: 0, jan: 0, feb: 1, mar: 2, abr: 3, apr: 3, may: 4, jun: 5, jul: 6, ago: 7, aug: 7, sep: 8, set: 8, oct: 9, nov: 10, dic: 11, dec: 11 };
function parseHevyDate(s) {
  s = String(s || '').trim().replace(/\sde\s/gi, ' ');
  let m = s.match(/^(\d{1,2})\s+([^\s\d,]+)\s+(\d{4}),?\s+(\d{1,2}):(\d{2})/);
  if (m) {
    const mo = MONTHS[norm(m[2]).replace(/\./g, '').slice(0, 3)];
    if (mo == null) return NaN;
    return new Date(+m[3], mo, +m[1], +m[4], +m[5]).getTime();
  }
  m = s.match(/^([^\s\d,]+)\s+(\d{1,2}),?\s+(\d{4}),?\s+(\d{1,2}):(\d{2})/);
  if (m) {
    const mo = MONTHS[norm(m[1]).replace(/\./g, '').slice(0, 3)];
    if (mo == null) return NaN;
    return new Date(+m[3], mo, +m[2], +m[4], +m[5]).getTime();
  }
  m = s.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (m) return new Date(+m[1], m[2] - 1, +m[3], +m[4], +m[5]).getTime();
  m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s+(\d{1,2}):(\d{2})/);
  if (m) return new Date(+m[3], m[2] - 1, +m[1], +m[4], +m[5]).getTime();
  return Date.parse(s);
}
const num = v => { const n = parseFloat(String(v || '').replace(',', '.')); return isNaN(n) ? 0 : n; };
function nameKey(name) {
  return norm(name).replace(/\(.*?\)/g, ' ').replace(/[^a-z0-9 ]/g, ' ').split(' ').filter(Boolean)
    .map(w => (w.length > 4 && w.endsWith('es') ? w.slice(0, -2) : w.length > 3 && w.endsWith('s') ? w.slice(0, -1) : w))
    .filter(w => !['de', 'con', 'en', 'la', 'el', 'a', 'al'].includes(w)).join(' ');
}
function hash(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(36); }

function gymHevyImport(text) {
  const rows = parseCSV(text.replace(/^﻿/, ''));
  if (rows.length < 2) return toast('El CSV está vacío');
  const head = rows[0].map(h => h.trim().toLowerCase());
  const col = k => head.indexOf(k);
  const C = { title: col('title'), start: col('start_time'), end: col('end_time'), desc: col('description'), ex: col('exercise_title'), notes: col('exercise_notes'), idx: col('set_index'), type: col('set_type'), kg: col('weight_kg'), lbs: col('weight_lbs'), reps: col('reps'), km: col('distance_km'), sec: col('duration_seconds'), sup: col('superset_id') };
  if (C.start < 0 || C.ex < 0) return toast('Este CSV no parece de Hevy');
  const sessions = new Map();
  const nameCount = new Map();
  let bad = 0;
  for (const r of rows.slice(1)) {
    const title = (r[C.title] || 'Entreno').trim();
    const st = parseHevyDate(r[C.start]);
    const exn = (r[C.ex] || '').trim();
    if (isNaN(st) || !exn) { bad++; continue; }
    const key = `${title}|${r[C.start]}`;
    if (!sessions.has(key)) {
      let en = parseHevyDate(r[C.end]);
      if (isNaN(en) || en < st) en = st + 60 * 60000;
      sessions.set(key, { title, start: st, end: en, notes: C.desc >= 0 ? (r[C.desc] || '') : '', ex: new Map() });
    }
    const s = sessions.get(key);
    if (!s.ex.has(exn)) s.ex.set(exn, { name: exn, notes: C.notes >= 0 ? (r[C.notes] || '') : '', sup: C.sup >= 0 ? (r[C.sup] || '').trim() : '', sets: [] });
    let kg = C.kg >= 0 ? num(r[C.kg]) : 0;
    if (!kg && C.lbs >= 0 && num(r[C.lbs])) kg = Math.round(num(r[C.lbs]) * 0.45359237 * 100) / 100;
    const type = (r[C.type] || 'normal').trim().toLowerCase().replace(/[^a-z]/g, '');
    const set = { i: num(r[C.idx]), type: SET_TYPES[type] ? type : type === 'drop' ? 'dropset' : 'normal', kg, reps: Math.round(num(r[C.reps])) };
    if (C.km >= 0 && num(r[C.km])) set.km = num(r[C.km]);
    if (C.sec >= 0 && num(r[C.sec])) set.sec = num(r[C.sec]);
    s.ex.get(exn).sets.push(set);
    nameCount.set(exn, (nameCount.get(exn) || 0) + 1);
  }
  if (!sessions.size) return toast('No he encontrado entrenos en el CSV');
  // Grupos de nombres parecidos
  const groups = new Map();
  for (const [n, c] of nameCount) { const k = nameKey(n); if (!groups.has(k)) groups.set(k, []); groups.get(k).push({ n, c }); }
  const accents = n => (n.match(/[áéíóúñü]/gi) || []).length;
  const merges = [...groups.values()].filter(g => g.length > 1).map(g => { g.sort((a, b) => b.c - a.c || accents(b.n) - accents(a.n)); return { names: g, target: g[0].n, on: true }; });
  // Rutinas por título
  const titles = new Map();
  for (const s of sessions.values()) { const t = titles.get(s.title) || { n: 0, last: null }; t.n++; if (!t.last || s.start > t.last.start) t.last = s; titles.set(s.title, t); }
  const routineOpts = [...titles].sort((a, b) => b[1].n - a[1].n).map(([t, v]) => ({ title: t, n: v.n, last: v.last, on: !G.routines.some(r => norm(r.name) === norm(t)) }));
  const already = new Set(G.workouts.map(w => w.id));
  const list = [...sessions.values()];
  const newCount = list.filter(s => !already.has('hevy-' + hash(s.title + '|' + s.start))).length;
  const totalSets = list.reduce((a, s) => a + [...s.ex.values()].reduce((b, e) => b + e.sets.length, 0), 0);
  const dates = list.map(s => s.start).sort((a, b) => a - b);

  const pg = openPage();
  const draw = () => {
    pg.el.innerHTML = `
      <div class="page-bar">
        <button class="icon-btn" data-h="back">${backIcon}</button>
        <div class="page-bar-title"><b>Importar de Hevy</b><small>Se guarda solo en este móvil</small></div>
        <span></span>
      </div>
      <div class="page-body">
        <div class="card">
          <div class="quick-val">${list.length} entrenos</div>
          <p class="sub" style="margin:4px 0 0">${totalSets} series · ${nameCount.size} ejercicios · ${fmtWDate(dates[0])} → ${fmtWDate(dates[dates.length - 1])}</p>
          ${newCount < list.length ? `<p class="sub">${list.length - newCount} ya estaban importados y se saltarán.</p>` : ''}
          ${bad ? `<p class="sub bad">${bad} filas no se han entendido y se ignorarán.</p>` : ''}
        </div>
        ${merges.length ? `<h3 class="section-title">Unificar nombres duplicados</h3>
        <p class="fine">Estos nombres parecen el mismo ejercicio. Marca los que quieras unir; se usará el nombre más usado.</p>
        <div class="card list-wrap">${merges.map((m, i) => `<label class="check-row"><input type="checkbox" class="switch" data-merge="${i}" ${m.on ? 'checked' : ''}>
          <span>${m.names.map(x => `${esc(x.n)} <small class="sub">(${x.c})</small>`).join('<br>')}<small class="accent">→ ${esc(m.target)}</small></span></label>`).join('')}</div>` : ''}
        <h3 class="section-title">Crear rutinas</h3>
        <p class="fine">A partir del último entreno de cada tipo. Desmarca las que no quieras.</p>
        <div class="card list-wrap">${routineOpts.map((r, i) => `<label class="check-row"><input type="checkbox" class="switch" data-rt="${i}" ${r.on ? 'checked' : ''}>
          <span>${esc(r.title)}<small class="sub">${r.n} entrenos · último ${fmtWDate(r.last.start)}</small></span></label>`).join('')}</div>
        <button class="btn btn-primary btn-block btn-big" data-h="go" style="margin-top:18px">Importar ${newCount} entrenos</button>
        <div style="height:40px"></div>
      </div>`;
  };
  draw();
  pg.el.addEventListener('change', e => {
    const t = e.target;
    if (t.dataset.merge != null) merges[+t.dataset.merge].on = t.checked;
    if (t.dataset.rt != null) routineOpts[+t.dataset.rt].on = t.checked;
  });
  pg.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-h]');
    if (!b) return;
    if (b.dataset.h === 'back') { popLayer(); return; }
    b.disabled = true; b.textContent = 'Importando…';
    const rename = new Map();
    merges.filter(m => m.on).forEach(m => m.names.forEach(x => rename.set(x.n, m.target)));
    const idFor = n => findOrCreateExercise(rename.get(n) || n).id;
    const toWorkout = s => {
      const exs = [];
      for (const e2 of s.ex.values()) {
        const id = idFor(e2.name);
        const sets = e2.sets.sort((a, b2) => a.i - b2.i).map(({ i, ...rest }) => rest);
        const prev = exs.find(x => x.exId === id);
        if (prev) prev.sets.push(...sets); else exs.push({ exId: id, notes: e2.notes, ...(e2.sup ? { sup: 'h' + hash(s.title + s.start + e2.sup) } : {}), sets });
      }
      return { id: 'hevy-' + hash(s.title + '|' + s.start), title: s.title, routineId: null, start: s.start, end: s.end, notes: s.notes, exercises: exs };
    };
    // Rutinas
    const newRoutines = [];
    const routineByTitle = new Map(G.routines.map(r => [norm(r.name), r]));
    for (const r of routineOpts) {
      if (!r.on) continue;
      const w = toWorkout(r.last);
      const ro = { id: uid(), name: r.title, order: G.routines.length + newRoutines.length, exercises: w.exercises.map(e2 => ({ exId: e2.exId, rest: null, sets: e2.sets.map(s => ({ type: s.type, kg: s.kg, reps: s.reps })) })) };
      newRoutines.push(ro);
      routineByTitle.set(norm(r.title), ro);
    }
    const ws = list.filter(s => !already.has('hevy-' + hash(s.title + '|' + s.start))).map(s => {
      const w = toWorkout(s);
      const ro = routineByTitle.get(norm(s.title));
      if (ro) w.routineId = ro.id;
      return w;
    });
    await DB.putMany('exercises', G.exercises);
    await DB.putMany('workouts', ws);
    await DB.putMany('routines', newRoutines);
    G.workouts.push(...ws);
    G.routines.push(...newRoutines);
    gymDerive();
    gymRenderAll();
    popLayer();
    showTab('entreno');
    showGymView('rutinas');
    toast(`Importados ${ws.length} entrenos${newRoutines.length ? ` y ${newRoutines.length} rutinas` : ''}`, { ms: 4000 });
  });
}
