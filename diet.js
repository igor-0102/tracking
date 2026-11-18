/* Tracking · dieta: perfil (TMB/GET), objetivos, dietas, comidas, opciones, alimentos y lista de la compra.
   Los cálculos están en nutri.js; aquí solo hay interfaz y guardado. */
'use strict';

const Dt = { diets: [], foods: [], templates: [], log: {} };      // log: { 'AAAA-MM-DD': { ok, extra, kcal } }
const DEFAULT_MEALS = ['Desayuno', 'Almuerzo', 'Comida', 'Merienda', 'Cena'];
const fK = Nutri.fmtKcal, fM = Nutri.fmtMacro;
const starIcon = '<svg viewBox="0 0 24 24"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.8z" fill="currentColor" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';

/* ================= Carga y guardado ================= */
async function dietLoad() {
  const [d, f, t, lg] = await Promise.all([DB.all('diets'), DB.all('foods'), DB.all('templates'), DB.getKey('dietlog')]);
  Dt.log = lg || {};
  Dt.diets = d || [];
  Dt.foods = f || [];
  Dt.templates = t || [];
  dietDerive();
}
function dietDerive() {
  Dt.diets.sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.name.localeCompare(b.name));
  Dt.foods.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  Dt.templates.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  Foods.setCustom(Dt.foods.map(Foods.customToFood));
}
const saveDiet = d => DB.put('diets', d).catch(() => toast('No se pudo guardar la dieta'));
const curDiet = () => Dt.diets.find(d => d.id === S.dietId) || Dt.diets[0] || null;

const saveLog = () => DB.putKey('dietlog', Dt.log).catch(() => toast('No se pudo guardar'));
function dietBackupData() { return { diets: Dt.diets, customFoods: Dt.foods, templates: Dt.templates, dietLog: Dt.log }; }
async function dietImportBackup(d) {
  const ok = (arr, test) => (Array.isArray(arr) ? arr.filter(test) : []);
  const diets = ok(d.diets, x => x && x.id && Array.isArray(x.meals));
  const foods = ok(d.customFoods, x => x && x.id && x.name && x.per100);
  const tpls = ok(d.templates, x => x && x.id && Array.isArray(x.items));
  await DB.putMany('diets', diets);
  await DB.putMany('foods', foods);
  await DB.putMany('templates', tpls);
  const up = (arr, list) => { const m = new Map(arr.map(x => [x.id, x])); list.forEach(x => m.set(x.id, x)); return [...m.values()]; };
  Dt.diets = up(Dt.diets, diets);
  Dt.foods = up(Dt.foods, foods);
  Dt.templates = up(Dt.templates, tpls);
  if (d.dietLog && typeof d.dietLog === 'object') { Dt.log = { ...Dt.log, ...d.dietLog }; await saveLog(); }
  const p = d.settings || {};
  for (const k of ['sex', 'birth', 'age', 'activity', 'goalType', 'dietGoal']) if (p[k] != null && (S[k] == null || S[k] === '')) S[k] = p[k];
  dietDerive();
}
async function dietWipe() {
  await Promise.all(['diets', 'foods', 'templates'].map(s => DB.clear(s)));
  Dt.diets = []; Dt.foods = []; Dt.templates = []; Dt.log = {};
  await DB.putKey('dietlog', null);
  dietDerive();
}

/* ================= Perfil y objetivo ================= */
function profileWeight() {
  if (S.weightMode === 'manual' && S.weightManual) return { kg: S.weightManual, auto: false };
  if (entries.length) return { kg: D.trend[entries.length - 1], auto: true };
  return { kg: S.weightManual || null, auto: false };
}
function dayType() {
  if (S.dayType === 'train' || S.dayType === 'rest') return S.dayType;
  const today = todayISO();
  const trained = !!G.active || G.workouts.some(w => localISO(w.start) === today);
  return trained ? 'train' : 'rest';
}
function profileCalc() {
  const w = profileWeight();
  const age = Nutri.profileAge({ birth: S.birth, age: S.age }, todayISO());
  const bmr = Nutri.bmr({ sex: S.sex, kg: w.kg, cm: S.height, age });
  const getFormula = Nutri.tdee(bmr, S.activity);
  const realGet = getFormula != null && S.getOverride > 0;      // gasto real estimado, si el usuario lo ha aceptado
  const get = realGet ? S.getOverride : getFormula;
  const type = dayType();
  const cfg = (S.dietGoal && S.dietGoal[type]) || { pct: 0, prot: 2, fat: 1 };
  const target = Nutri.goalTargets({ tdee: get, pct: cfg.pct, kg: w.kg, protGkg: cfg.prot, fatGkg: cfg.fat });
  const missing = [];
  if (!S.sex) missing.push('sexo');
  if (age == null) missing.push('edad');
  if (!S.height) missing.push('altura');
  if (!w.kg) missing.push('peso');
  if (!S.activity) missing.push('nivel de actividad');
  return { kg: w.kg, autoKg: w.auto, age, bmr, get, getFormula, realGet, type, cfg, target, missing };
}

function renderProfileSettings() {
  const box = $('#profile-box');
  if (!box) return;
  const pc = profileCalc();
  const act = Nutri.ACTIVITY.find(a => a.id === S.activity);
  const hasBirth = !!S.birth;
  const active = document.activeElement && document.activeElement.id;
  box.innerHTML = `
    <div class="field"><span>Sexo</span>
      <div class="seg seg-small" id="pf-sex"><button data-sex="h" class="${S.sex === 'h' ? 'on' : ''}">Hombre</button><button data-sex="m" class="${S.sex === 'm' ? 'on' : ''}">Mujer</button></div>
    </div>
    <label class="field"><span>Fecha de nacimiento</span>
      <input type="date" id="pf-birth" class="date-inline" value="${S.birth || ''}" max="${todayISO()}">
    </label>
    <label class="field"><span>Edad${hasBirth ? ' (calculada)' : ''}</span>
      <span class="input-unit"><input id="pf-age" type="text" inputmode="numeric" placeholder="—" value="${pc.age != null ? pc.age : ''}" ${hasBirth ? 'disabled' : ''}><em>años</em></span>
    </label>
    <label class="field"><span>Altura</span>
      <span class="input-unit"><input id="height-input" type="text" inputmode="numeric" placeholder="—" autocomplete="off" value="${S.height != null ? S.height : ''}"><em>cm</em></span>
    </label>
    <div class="field"><span>Peso</span>
      <button class="pill-btn" id="pf-weight">${pc.kg ? `${fmt1(pc.kg)} kg · ${pc.autoKg ? 'automático' : 'manual'}` : 'Indicar peso'}</button>
    </div>
    <div class="field"><span>Actividad semanal</span>
      <button class="pill-btn" id="pf-act">${act ? `${act.label} (×${String(act.factor).replace('.', ',')})` : 'Elegir'}</button>
    </div>
    ${act ? `<p class="fine pf-note">${act.desc}.</p>` : ''}
    <div class="pf-result">${pc.bmr != null
      ? `<div><span class="label">Metabolismo basal (TMB)</span><b>${fK(pc.bmr)} kcal</b></div><div><span class="label">Gasto total (GET)${pc.realGet ? ' · real' : ''}</span><b>${pc.get != null ? fK(pc.get) + ' kcal' : '—'}</b></div>${pc.realGet ? `<p class="fine">Usando tu gasto real estimado. Con la fórmula serían ${fK(pc.getFormula)} kcal. <button class="link" style="padding:0" data-dt-global="formula">Volver a la fórmula</button></p>` : ''}`
      : `<p class="fine">Para calcular tu metabolismo falta: ${pc.missing.join(', ')}.</p>`}</div>`;
  if (active && $('#' + active)) $('#' + active).focus();

  const g = $('#goal-box');
  const day = goalEditDay;
  const cfg = S.dietGoal[day];
  const t = Nutri.goalTargets({ tdee: pc.get, pct: cfg.pct, kg: pc.kg, protGkg: cfg.prot, fatGkg: cfg.fat });
  g.innerHTML = `
    <div class="seg seg-block" id="goal-type">${Nutri.GOAL_TYPES.map(x => `<button data-gt="${x.id}" class="${S.goalType === x.id ? 'on' : ''}">${x.label}</button>`).join('')}</div>
    <div class="seg seg-small seg-block" id="goal-day" style="margin-top:10px"><button data-gd="train" class="${day === 'train' ? 'on' : ''}">Día de entreno</button><button data-gd="rest" class="${day === 'rest' ? 'on' : ''}">Día de descanso</button></div>
    <label class="field"><span>Ajuste sobre el GET</span><span class="input-unit"><input data-goal="pct" type="text" inputmode="text" value="${String(cfg.pct).replace('.', ',')}"><em>%</em></span></label>
    <label class="field"><span>Proteína</span><span class="input-unit"><input data-goal="prot" type="text" inputmode="decimal" value="${String(cfg.prot).replace('.', ',')}"><em>g/kg</em></span></label>
    <label class="field"><span>Grasa</span><span class="input-unit"><input data-goal="fat" type="text" inputmode="decimal" value="${String(cfg.fat).replace('.', ',')}"><em>g/kg</em></span></label>
    <div class="pf-result">${t
      ? `<div><span class="label">Objetivo · ${day === 'train' ? 'entreno' : 'descanso'}</span><b>${fK(t.kcal)} kcal</b></div><div><span class="label">Proteína · Carbohidratos · Grasa</span><b>${fK(t.p)} · ${fK(t.c)} · ${fK(t.f)} g</b></div>${t.over ? '<p class="fine bad">La proteína y la grasa ya superan las calorías del objetivo: baja los g/kg o sube el ajuste.</p>' : ''}`
      : '<p class="fine">Completa el perfil para ver tu objetivo.</p>'}</div>`;
}
let goalEditDay = 'train';

async function saveProfile(msg) {
  await saveSettings();
  renderAll();
  if (msg) toast(msg);
}
document.addEventListener('click', async e => {
  const t = e.target;
  const sex = t.closest('#pf-sex [data-sex]');
  if (sex) { S.sex = sex.dataset.sex; return saveProfile(); }
  if (t.closest('#pf-act')) {
    const v = await actionSheet('Actividad semanal', Nutri.ACTIVITY.map(a => ({ label: `${a.label} · ×${String(a.factor).replace('.', ',')}`, sub: a.desc, value: a.id, on: a.id === S.activity })));
    if (v) { S.activity = v; saveProfile(); }
    return;
  }
  if (t.closest('#pf-weight')) {
    const last = entries.length ? D.trend[entries.length - 1] : null;
    const v = await actionSheet('Peso para los cálculos', [
      { label: 'Automático', sub: last ? `Tu media de 7 días de la pestaña Peso (${fmt1(last)} kg). Se actualiza sola.` : 'Usará tus registros de la pestaña Peso cuando los tengas.', value: 'auto', on: S.weightMode !== 'manual' },
      { label: 'Escribirlo a mano', sub: S.weightManual ? `Ahora: ${fmt1(S.weightManual)} kg` : '', value: 'manual', on: S.weightMode === 'manual' },
    ]);
    if (v === 'auto') { S.weightMode = 'auto'; saveProfile(); }
    else if (v === 'manual') {
      const txt = await promptText('Peso (kg)', S.weightManual ? fmtKg(S.weightManual) : '');
      if (txt == null) return;
      const kg = parseKg(txt);
      const err = Nutri.validateProfile({ kg: isNaN(kg) ? -1 : kg });
      if (err.length) return toast(err[0]);
      S.weightManual = kg; S.weightMode = 'manual'; saveProfile();
    }
    return;
  }
  const gt = t.closest('#goal-type [data-gt]');
  if (gt) {
    const type = Nutri.GOAL_TYPES.find(x => x.id === gt.dataset.gt);
    S.goalType = type.id;
    S.dietGoal.train.pct = type.pct; S.dietGoal.rest.pct = type.pct;
    return saveProfile();
  }
  const gd = t.closest('#goal-day [data-gd]');
  if (gd) { goalEditDay = gd.dataset.gd; renderProfileSettings(); }
});
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'pf-birth') {
    if (t.value && t.value > todayISO()) return toast('La fecha no puede ser futura');
    const age = Nutri.ageFromBirth(t.value, todayISO());
    if (t.value && Nutri.validateProfile({ age }).length) { toast(Nutri.validateProfile({ age })[0]); renderProfileSettings(); return; }
    S.birth = t.value || '';
    saveProfile();
  } else if (t.id === 'pf-age') {
    const v = t.value.trim();
    if (!v) { S.age = null; return saveProfile(); }
    const age = parseInt(v, 10);
    const err = Nutri.validateProfile({ age: isNaN(age) ? -1 : age });
    if (err.length) { toast(err[0]); renderProfileSettings(); return; }
    S.age = age; saveProfile();
  } else if (t.dataset && t.dataset.goal) {
    const k = t.dataset.goal;
    const v = parseFloat(t.value.replace(',', '.').replace('−', '-'));
    const lim = { pct: [-50, 50], prot: [0.5, 4], fat: [0.3, 2.5] }[k];
    if (isNaN(v) || v < lim[0] || v > lim[1]) { toast(`Valor entre ${lim[0]} y ${lim[1]}`.replace(/\./g, ',')); renderProfileSettings(); return; }
    S.dietGoal[goalEditDay][k] = v;
    saveProfile();
  }
});

/* ================= Pestaña Dieta ================= */
const macroLine = m => `${fK(m.kcal)} kcal · P ${fM(m.p)} · C ${fM(m.c)} · G ${fM(m.f)}`;
const itemQtyText = it => (it.unit === 'portion' ? `${fmtN(it.qty)} × ${it.portionName} (${Nutri.fmtGrams(Nutri.itemGrams(it))})` : `${fmtN(it.qty)} g`);
const selectedOptions = d => d.meals.map(m => m.options.find(o => o.id === d.sel[m.id]) || null);

function dietRenderAll() {
  renderProfileSettings();
  renderDietTab();
  renderDietHome();
}

function barHTML(label, val, target, unit, cls = '') {
  const pct = target > 0 ? Math.min(100, val / target * 100) : 0;
  const over = target > 0 && val > target * 1.05;
  return `<div class="mbar ${cls}"><div class="mbar-top"><span>${label}</span><b>${unit === 'kcal' ? fK(val) : fM(val)}${target > 0 ? ` <small>/ ${unit === 'kcal' ? fK(target) : fK(target)} ${unit}</small>` : ` <small>${unit}</small>`}</b></div>${target > 0 ? `<div class="mbar-track"><div class="${over ? 'over' : ''}" style="width:${pct.toFixed(1)}%"></div></div>` : ''}</div>`;
}

function renderDietTab() {
  const box = $('#diet-root');
  if (!box) return;
  const pc = profileCalc();
  const d = curDiet();
  let html = '';

  // Cabecera: TMB, GET y objetivo
  if (pc.bmr != null && pc.get != null) {
    html += `<div class="card diet-head">
      <div class="stats stats-flat">
        <div class="stat"><div class="label">TMB</div><div class="val">${fK(pc.bmr)}</div></div>
        <div class="stat"><div class="label">GET${pc.realGet ? ' real' : ''}</div><div class="val">${fK(pc.get)}</div></div>
        <div class="stat"><div class="label">Objetivo</div><div class="val accent-t">${pc.target ? fK(pc.target.kcal) : '—'}</div></div>
      </div>
      <div class="seg seg-small seg-block" id="day-seg">
        <button data-day="auto" class="${S.dayType === 'auto' || !S.dayType ? 'on' : ''}">Auto · ${dayTypeAuto() === 'train' ? 'entreno' : 'descanso'}</button>
        <button data-day="train" class="${S.dayType === 'train' ? 'on' : ''}">Entreno</button>
        <button data-day="rest" class="${S.dayType === 'rest' ? 'on' : ''}">Descanso</button>
      </div>
    </div>`;
  } else {
    html += `<div class="card diet-head"><p class="fine" style="margin:0 0 10px">Completa tu perfil para calcular tu metabolismo y tu objetivo de calorías. Falta: ${pc.missing.join(', ')}.</p><button class="btn btn-secondary btn-block btn-small" data-goto="ajustes">Completar perfil</button></div>`;
  }

  if (!d) {
    html += `<div class="card welcome"><div class="welcome-icon">🥗</div><h2>Tu primera dieta</h2>
      <p>Crea una dieta con sus comidas (desayuno, comida, cena…) y varias opciones para cada una. Luego eliges una opción por comida y ves las calorías y los macros del día.</p>
      <button class="btn btn-primary btn-block" data-dt="new-diet">Crear dieta</button></div>`;
    box.innerHTML = html;
    return;
  }

  html += doneCardHTML(d);
  html += `<div class="diet-bar"><button class="diet-pick" data-dt="pick-diet"><span>${esc(d.name)}</span>${downIcon}</button><button class="icon-btn" data-dt="diet-menu" aria-label="Opciones de la dieta">${dotsIcon}</button></div>`;

  // Total del día
  const tot = Nutri.dayMacros(selectedOptions(d));
  const tg = pc.target;
  html += `<div class="card day-total">
    <div class="card-head"><h2>Total del día</h2>${tg ? `<span class="sub">${tot.kcal > tg.kcal ? `+${fK(tot.kcal - tg.kcal)} kcal` : `faltan ${fK(tg.kcal - tot.kcal)} kcal`}</span>` : ''}</div>
    ${barHTML('Calorías', tot.kcal, tg ? tg.kcal : 0, 'kcal', 'mbar-k')}
    <div class="mbar-grid">
      ${barHTML('Proteína', tot.p, tg ? tg.p : 0, 'g', 'mbar-p')}
      ${barHTML('Carbohidratos', tot.c, tg ? tg.c : 0, 'g', 'mbar-c')}
      ${barHTML('Grasa', tot.f, tg ? tg.f : 0, 'g', 'mbar-f')}
    </div>
    ${gkgLine(tot, tg, pc.kg)}${tot.fiber || tot.sugar || tot.salt ? `<p class="fine" style="margin:10px 0 0">Fibra ${fM(tot.fiber)} g · Azúcar ${fM(tot.sugar)} g · Sal ${fM(tot.salt)} g</p>` : ''}
  </div>`;

  html += theoryCardHTML(tot.kcal, pc) + adjustCardHTML(pc);

  // Comidas
  d.meals.forEach(m => {
    const sel = m.options.find(o => o.id === d.sel[m.id]);
    html += `<div class="card meal" data-meal="${m.id}">
      <div class="meal-head"><h3>${esc(m.name)}</h3>${sel ? `<span class="sub">${macroLine(Nutri.optionMacros(sel))}</span>` : ''}</div>
      <div class="chips">${m.options.map(o => `<button class="chip${sel && sel.id === o.id ? ' on' : ''}" data-dt="sel" data-opt="${o.id}">${esc(o.name)}</button>`).join('')}<button class="chip chip-add" data-dt="add-opt" aria-label="Añadir opción">＋</button></div>
      ${sel ? `<div class="meal-items">${sel.items.length ? sel.items.map(it => `<div><span>${esc(it.name)}</span><small>${esc(itemQtyText(it))}</small></div>`).join('') : '<p class="fine" style="margin:0">Esta opción aún no tiene ingredientes.</p>'}</div>
        <button class="btn btn-ghost btn-small btn-block" data-dt="edit-opt" data-opt="${sel.id}">${sel.items.length ? 'Editar opción' : 'Añadir ingredientes'}</button>`
      : `<p class="fine" style="margin:8px 0 0">${m.options.length ? 'Elige una opción para este día.' : 'Pulsa ＋ para crear la primera opción.'}</p>`}
    </div>`;
  });

  html += `<button class="btn btn-secondary btn-block" data-dt="shopping">🛒 Lista de la compra</button>
    <button class="btn btn-ghost btn-block" data-dt="edit-meals">Editar comidas</button>
    <p class="fine center">Datos nutricionales: USDA SR28 (dominio público) y tus alimentos.</p>`;
  box.innerHTML = html;
}
/* ----- Dieta cumplida, peso teórico y gasto real ----- */
let logDate = todayISO();
const dietKcalNow = () => { const d = curDiet(); return d ? Nutri.dayMacros(selectedOptions(d)).kcal : 0; };
const recentLogs = (days = 28) => {
  const t = isoToIdx(todayISO());
  return Object.entries(Dt.log).map(([date, l]) => ({ ...l, date, x: isoToIdx(date) })).filter(l => l.x > t - days && l.x <= t);
};
function doneCardHTML() {
  const today = todayISO();
  if (logDate > today) logDate = today;
  const cur = Dt.log[logDate];
  const t = isoToIdx(today);
  const strip = Array.from({ length: 7 }, (_, i) => {
    const iso = idxToISO(t - 6 + i), l = Dt.log[iso];
    return `<button class="wday${iso === logDate ? ' sel' : ''}${l ? (l.ok ? ' ok' : ' no') : ''}" data-logday="${iso}"><small>${fmtD(F.wd, iso).slice(0, 2)}</small><b>${l ? (l.ok ? '✓' : '✗') : '·'}</b></button>`;
  }).join('');
  const a = Nutri.adherence(recentLogs());
  return `<div class="card done-card">
    <div class="done-head">
      <div><h2>Dieta cumplida</h2><span class="sub">${logDate === today ? 'Hoy' : cap(fmtD(F.wdDayMon, logDate))}</span></div>
      <div class="done-btns">
        <button class="sq sq-ok${cur && cur.ok ? ' on' : ''}" data-dt="done-ok" aria-label="Sí, cumplida">✓</button>
        <button class="sq sq-no${cur && !cur.ok ? ' on' : ''}" data-dt="done-no" aria-label="No cumplida">✗</button>
      </div>
    </div>
    ${cur && !cur.ok ? `<p class="done-extra">${cur.extra ? `${cur.extra > 0 ? '+' : '−'}${fK(Math.abs(cur.extra))} kcal extra estimadas` : 'Sin calorías extra apuntadas'} · <button class="link" style="padding:0" data-dt="done-extra">cambiar</button></p>` : ''}
    <div class="wstrip">${strip}</div>
    <p class="fine" style="margin:8px 0 0">${a.marked ? `Últimas 4 semanas: cumplida <b>${a.ok}</b> de ${a.marked} días marcados (${fK(a.pct)} %).` : 'Marca cada día si has seguido la dieta. Toca un día de la semana para marcar uno anterior.'}</p>
  </div>`;
}
function theoryCardHTML(dietKcal, pc) {
  const wk = Nutri.weeklyChangeKg(dietKcal, pc.get);
  if (wk == null) return '';
  const diff = dietKcal - pc.get;
  const flat = Math.abs(wk) < 0.02;
  return `<div class="card theory-card"><div class="label">Con esta dieta, a rajatabla</div>
    <div class="theory-val ${flat ? '' : tone(wk)}">${flat ? 'Peso estable' : `${fmtSigned(wk, 2)} kg/semana`}</div>
    <div class="sub">${flat ? 'Comes lo mismo que gastas.' : `${diff < 0 ? 'Déficit' : 'Superávit'} de ${fK(Math.abs(diff))} kcal al día respecto a tu gasto (${fK(pc.get)} kcal).`}</div></div>`;
}
function realTdeeEstimate() {
  const logs = recentLogs();
  const weights = entries.map((e, i) => ({ x: D.idx[i], kg: e.kg }));
  return Nutri.estimateRealTdee({ logs, weights });
}
function adjustCardHTML(pc) {
  if (pc.getFormula == null) return '';
  const r = realTdeeEstimate();
  let body;
  if (r.ok) {
    const real = Math.round(r.tdee / 10) * 10;
    const d = real - pc.getFormula;
    body = `<div class="theory-val">${fK(real)} kcal</div>
      <div class="sub">Con ${r.strict} días cumplidos a rajatabla (${fK(r.avgKcal)} kcal de media) tu peso ha cambiado ${fmtSigned(r.kgPerWeek, 2)} kg/semana. La fórmula daba ${fK(pc.getFormula)} kcal (${d >= 0 ? '+' : '−'}${fK(Math.abs(d))}).</div>
      ${S.getOverride === real ? '<p class="fine" style="margin:8px 0 0">Ya estás usando este gasto real para tu objetivo.</p>'
        : `<button class="btn btn-secondary btn-block btn-small" style="margin-top:10px" data-dt="use-real" data-real="${real}">Usar mi gasto real en el objetivo</button>`}`;
  } else {
    const why = {
      few_strict: `Necesito al menos ${r.need} días cumplidos a rajatabla en las últimas 4 semanas (llevas ${r.strict}).`,
      short: `Necesito al menos ${r.need} días entre el primer y el último día marcado (llevas ${r.span}).`,
      low_ratio: `En el periodo marcado solo has cumplido ${fK((r.ratio || 0) * 100)} % de los días. Hace falta al menos un ${fK((r.need || 0) * 100)} %: los días no cumplidos también mueven el peso y falsearían el cálculo.`,
      few_weights: `Necesito al menos ${r.need} pesajes en ese periodo (hay ${r.weighIns || 0}).`,
    }[r.reason];
    body = `<div class="sub" style="margin-top:4px">${why}</div>`;
  }
  return `<div class="card theory-card"><div class="label">Tu gasto real estimado</div>${body}
    ${S.getOverride > 0 ? '<button class="link" style="padding:8px 0 0" data-dt="formula">Volver a la fórmula</button>' : ''}</div>`;
}
// Línea para la pestaña Peso: fecha teórica del objetivo siguiendo la dieta.
function dietTheoryLine(currentKg, goalKg) {
  if (goalKg == null || !currentKg) return '';
  const pc = profileCalc();
  const wk = Nutri.weeklyChangeKg(dietKcalNow(), pc.get);
  if (wk == null) return '';
  const days = Nutri.daysToGoal(currentKg, goalKg, wk);
  let txt;
  if (days === 0) return '';
  if (days == null) txt = `tu dieta actual (${fmtSigned(wk, 2)} kg/semana) no te lleva hacia el objetivo.`;
  else if (days > 3 * 365) txt = `tardarías más de 3 años (${fmtSigned(wk, 2)} kg/semana).`;
  else txt = `lo alcanzarías hacia el <b>${fmtDi(F.dayMonYear, Math.round(isoToIdx(todayISO()) + days))}</b> (${fmtSigned(wk, 2)} kg/semana).`;
  return `<p class="projection theory-line">Siguiendo la dieta a rajatabla, ${txt}</p>`;
}
async function setLog(date, val) {
  if (val) Dt.log[date] = val; else delete Dt.log[date];
  await saveLog();
  renderAll();
}
async function askExtra(cur) {
  const txt = await promptText('Calorías extra estimadas', cur ? String(cur) : '');
  if (txt == null) return null;
  const v = txt.trim() === '' ? 0 : parseInt(txt.replace(/[^\d-−]/g, '').replace('−', '-'), 10);
  if (isNaN(v) || Math.abs(v) > 10000) { toast('Escribe un número de calorías, por ejemplo 400'); return null; }
  return v;
}
document.addEventListener('click', async e => {
  if (e.target.closest('[data-dt-global="formula"]')) { S.getOverride = null; await saveSettings(); renderAll(); toast('Vuelves a usar la fórmula'); }
});

const dayTypeAuto = () => { const keep = S.dayType; S.dayType = 'auto'; const t = dayType(); S.dayType = keep; return t; };

function renderDietHome() {
  const box = $('#home-diet');
  if (!box) return;
  const d = curDiet();
  if (!d) { box.innerHTML = ''; return; }
  const tot = Nutri.dayMacros(selectedOptions(d));
  const tg = profileCalc().target;
  box.innerHTML = `<button class="card quick" data-goto="dieta">
    <div><div class="label">Dieta · ${esc(d.name)}</div><div class="quick-val">${fK(tot.kcal)}${tg ? ` <small class="sub">/ ${fK(tg.kcal)}</small>` : ''} kcal</div>
    <small class="sub">P ${fM(tot.p)} · C ${fM(tot.c)} · G ${fM(tot.f)} g</small></div>${chevIcon}</button>`;
}

function newDiet(name) {
  const meals = DEFAULT_MEALS.map(n => ({ id: uid(), name: n, options: [{ id: uid(), name: 'A', items: [] }] }));
  const sel = {};
  meals.forEach(m => { sel[m.id] = m.options[0].id; });
  return { id: uid(), name, order: Dt.diets.length, meals, sel };
}
function nextOptionName(meal) {
  for (let i = 0; i < 26; i++) { const n = String.fromCharCode(65 + i); if (!meal.options.some(o => o.name === n)) return n; }
  return 'Opción ' + (meal.options.length + 1);
}
// Copia una dieta/opción con identificadores nuevos
function cloneOption(o) { return { id: uid(), name: o.name, items: o.items.map(it => ({ ...it, id: uid(), per100: { ...it.per100 } })) }; }
function cloneDiet(d, name) {
  const sel = {};
  const meals = d.meals.map(m => {
    const nm = { id: uid(), name: m.name, options: m.options.map(cloneOption) };
    const i = m.options.findIndex(o => o.id === d.sel[m.id]);
    if (i >= 0) sel[nm.id] = nm.options[i].id;
    return nm;
  });
  return { id: uid(), name, order: Dt.diets.length, meals, sel };
}

$('#tab-dieta').addEventListener('click', async e => {
  const ld = e.target.closest('[data-logday]');
  if (ld) { logDate = ld.dataset.logday; renderDietTab(); return; }
  const day = e.target.closest('#day-seg [data-day]');
  if (day) { S.dayType = day.dataset.day; await saveSettings(); dietRenderAll(); return; }
  const b = e.target.closest('[data-dt]');
  if (!b) return;
  const act = b.dataset.dt;
  const d = curDiet();
  const meal = d && d.meals.find(m => m.id === (b.closest('[data-meal]') || {}).dataset?.meal);

  if (act === 'new-diet') {
    const name = await promptText('Nombre de la dieta', Dt.diets.length ? '' : 'Mi dieta');
    if (!name || !name.trim()) return;
    const nd = newDiet(name.trim());
    Dt.diets.push(nd); S.dietId = nd.id;
    await saveDiet(nd); await saveSettings(); dietDerive(); dietRenderAll();
  } else if (act === 'pick-diet') {
    const v = await actionSheet('Mis dietas', [...Dt.diets.map(x => ({ label: x.name, sub: `${x.meals.length} comidas`, value: x.id, on: x.id === d.id })), { label: '＋ Nueva dieta', value: '__new' }]);
    if (v === '__new') { const name = await promptText('Nombre de la dieta', ''); if (!name || !name.trim()) return; const nd = newDiet(name.trim()); Dt.diets.push(nd); S.dietId = nd.id; await saveDiet(nd); }
    else if (v) S.dietId = v;
    else return;
    await saveSettings(); dietDerive(); dietRenderAll();
  } else if (act === 'diet-menu') {
    const v = await actionSheet(d.name, [{ label: 'Renombrar', value: 'ren' }, { label: 'Duplicar', value: 'dup' }, { label: 'Editar comidas', value: 'meals' }, { label: 'Borrar dieta', value: 'del', danger: true }]);
    if (v === 'ren') {
      const name = await promptText('Renombrar dieta', d.name);
      if (name && name.trim()) { d.name = name.trim(); await saveDiet(d); dietRenderAll(); }
    } else if (v === 'dup') {
      const c = cloneDiet(d, d.name + ' (copia)');
      Dt.diets.push(c); S.dietId = c.id;
      await saveDiet(c); await saveSettings(); dietDerive(); dietRenderAll(); toast('Dieta duplicada');
    } else if (v === 'meals') editMeals(d);
    else if (v === 'del') {
      const ok = await ask({ title: `¿Borrar «${d.name}»?`, message: 'Se borrarán sus comidas y opciones.', ok: 'Borrar', cancel: 'Cancelar', danger: true });
      if (!ok) return;
      Dt.diets = Dt.diets.filter(x => x !== d);
      await DB.del('diets', d.id);
      S.dietId = Dt.diets[0] ? Dt.diets[0].id : null;
      await saveSettings(); dietRenderAll();
      toast('Dieta borrada', { action: 'Deshacer', ms: 6000, onAction: async () => { Dt.diets.push(d); S.dietId = d.id; await saveDiet(d); await saveSettings(); dietDerive(); dietRenderAll(); } });
    }
  } else if (act === 'edit-meals') editMeals(d);
  else if (act === 'done-ok' || act === 'done-no' || act === 'done-extra') {
    const cur = Dt.log[logDate];
    const kcal = Math.round(dietKcalNow());
    if (!kcal) return toast('Primero añade ingredientes a las opciones elegidas');
    if (act === 'done-ok') return setLog(logDate, cur && cur.ok ? null : { ok: true, extra: 0, kcal });
    if (act === 'done-no' && cur && !cur.ok) return setLog(logDate, null);
    const extra = await askExtra(cur && !cur.ok ? cur.extra : 0);
    if (extra == null) return;
    setLog(logDate, { ok: false, extra, kcal: cur ? cur.kcal || kcal : kcal });
  } else if (act === 'use-real') {
    S.getOverride = +b.dataset.real; await saveSettings(); renderAll(); toast('Objetivo recalculado con tu gasto real');
  } else if (act === 'formula') {
    S.getOverride = null; await saveSettings(); renderAll(); toast('Vuelves a usar la fórmula');
  } else if (act === 'shopping') openShopping(d);
  else if (!meal) return;
  else if (act === 'sel') {
    const id = b.dataset.opt;
    if (d.sel[meal.id] === id) delete d.sel[meal.id]; else d.sel[meal.id] = id;
    await saveDiet(d); dietRenderAll();
  } else if (act === 'add-opt') {
    const o = { id: uid(), name: nextOptionName(meal), items: [] };
    meal.options.push(o); d.sel[meal.id] = o.id;
    await saveDiet(d); dietRenderAll();
    editOption(d, meal, o);
  } else if (act === 'edit-opt') {
    const o = meal.options.find(x => x.id === b.dataset.opt);
    if (o) editOption(d, meal, o);
  }
});

/* ================= Editor de comidas ================= */
function editMeals(d) {
  const pg = openPage();
  pg.onClose = () => dietRenderAll();
  const draw = () => {
    pg.el.innerHTML = `
      <div class="page-bar"><button class="icon-btn" data-m="back">${backIcon}</button><div class="page-bar-title"><b>Comidas</b><small>${esc(d.name)}</small></div><span></span></div>
      <div class="page-body">
        ${d.meals.map((m, i) => `<div class="card r-ex" data-i="${i}"><div class="ex-head">
          <input class="meal-name" value="${esc(m.name)}" aria-label="Nombre de la comida">
          <span class="r-tools"><button class="icon-btn icon-btn-sm" data-m="up" ${i ? '' : 'disabled'}>↑</button><button class="icon-btn icon-btn-sm" data-m="down" ${i < d.meals.length - 1 ? '' : 'disabled'}>↓</button><button class="icon-btn icon-btn-sm danger" data-m="del">✕</button></span>
        </div><small class="sub">${m.options.length} ${m.options.length === 1 ? 'opción' : 'opciones'}</small></div>`).join('')}
        <button class="btn btn-secondary btn-block" data-m="add">＋ Añadir comida</button>
        <div style="height:60px"></div>
      </div>`;
  };
  draw();
  pg.el.addEventListener('change', e => {
    if (!e.target.classList.contains('meal-name')) return;
    const m = d.meals[+e.target.closest('[data-i]').dataset.i];
    m.name = e.target.value.trim() || m.name;
    saveDiet(d);
  });
  pg.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-m]');
    if (!b) return;
    const a = b.dataset.m;
    const i = +((b.closest('[data-i]') || {}).dataset?.i ?? -1);
    if (a === 'back') return popLayer();
    if (a === 'add') {
      const name = await promptText('Nombre de la comida', '');
      if (!name || !name.trim()) return;
      const o = { id: uid(), name: 'A', items: [] };
      const m = { id: uid(), name: name.trim(), options: [o] };
      d.meals.push(m); d.sel[m.id] = o.id;
    } else if (a === 'up' || a === 'down') {
      const j = a === 'up' ? i - 1 : i + 1;
      [d.meals[i], d.meals[j]] = [d.meals[j], d.meals[i]];
    } else if (a === 'del') {
      const m = d.meals[i];
      const n = m.options.reduce((x, o) => x + o.items.length, 0);
      if (n) {
        const ok = await ask({ title: `¿Quitar «${m.name}»?`, message: `Se borrarán sus ${m.options.length} opciones.`, ok: 'Quitar', cancel: 'Cancelar', danger: true });
        if (!ok) return;
      }
      d.meals.splice(i, 1); delete d.sel[m.id];
    } else return;
    await saveDiet(d);
    draw();
  });
}

/* ================= Editor de una opción ================= */
function editOption(d, meal, opt) {
  const pg = openPage();
  pg.onClose = () => dietRenderAll();
  const totals = () => {
    const m = Nutri.optionMacros(opt);
    const el = pg.el.querySelector('.opt-total');
    if (el) el.innerHTML = `<div><b>${fK(m.kcal)}</b><small>kcal</small></div><div><b>${fM(m.p)}</b><small>Proteína</small></div><div><b>${fM(m.c)}</b><small>Carbos</small></div><div><b>${fM(m.f)}</b><small>Grasa</small></div>`;
    const ex = pg.el.querySelector('.opt-extra');
    if (ex) ex.textContent = m.fiber || m.sugar || m.salt ? `Fibra ${fM(m.fiber)} g · Azúcar ${fM(m.sugar)} g · Sal ${fM(m.salt)} g` : '';
  };
  const draw = () => {
    pg.el.innerHTML = `
      <div class="page-bar">
        <button class="icon-btn" data-o="back">${backIcon}</button>
        <div class="page-bar-title"><input class="wk-title" data-o="name" value="${esc(opt.name)}" aria-label="Nombre de la opción"><small>${esc(meal.name)} · ${esc(d.name)}</small></div>
        <button class="icon-btn" data-o="menu">${dotsIcon}</button>
      </div>
      <div class="opt-total-wrap"><div class="opt-total"></div><p class="fine center opt-extra"></p></div>
      <div class="page-body">
        ${opt.items.map((it, i) => `<div class="card ing" data-i="${i}">
          <div class="ing-top"><button class="ing-name" data-o="edit">${esc(it.name)}</button><button class="icon-btn icon-btn-sm danger" data-o="del" aria-label="Quitar">✕</button></div>
          <div class="ing-row">
            <span class="input-unit"><input class="ing-qty" inputmode="decimal" value="${fmtN(it.qty)}" aria-label="Cantidad"><em>${it.unit === 'portion' ? esc(it.portionName) : 'g'}</em></span>
            <small class="sub ing-mac">${macroLine(Nutri.itemMacros(it))}</small>
          </div>
        </div>`).join('')}
        ${!opt.items.length ? '<p class="fine center" style="margin:26px 0 8px">Añade los ingredientes de esta opción.</p>' : ''}
        <button class="btn btn-primary btn-block" data-o="add">＋ Añadir ingrediente</button>
        ${Dt.templates.length ? '<button class="btn btn-ghost btn-block" data-o="tpl">Añadir desde plantilla</button>' : ''}
        <div style="height:60px"></div>
      </div>`;
    totals();
  };
  draw();
  pg.el.addEventListener('input', e => {
    const t = e.target;
    if (t.classList.contains('ing-qty')) {
      const card = t.closest('[data-i]');
      const it = opt.items[+card.dataset.i];
      const v = parseFloat(t.value.replace(',', '.'));
      it.qty = isNaN(v) || v < 0 ? 0 : v;
      card.querySelector('.ing-mac').textContent = macroLine(Nutri.itemMacros(it));
      totals();
      saveDiet(d);
    } else if (t.dataset.o === 'name') { opt.name = t.value.trim() || opt.name; saveDiet(d); }
  });
  pg.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-o]');
    if (!b || b.tagName === 'INPUT') return;
    const a = b.dataset.o;
    const i = +((b.closest('[data-i]') || {}).dataset?.i ?? -1);
    if (a === 'back') return popLayer();
    if (a === 'add') {
      const food = await pickFood();
      if (!food) return;
      const item = await askQuantity(food);
      if (!item) return;
      opt.items.push(item);
      rememberFood(food);
    } else if (a === 'edit') {
      const it = opt.items[i];
      const item = await askQuantity({ key: it.key, name: it.name, per100: it.per100, portions: it.portions || (it.portionG ? [{ name: it.portionName, g: it.portionG }] : []) }, it);
      if (!item) return;
      opt.items[i] = { ...item, id: it.id };
    } else if (a === 'del') {
      const it = opt.items.splice(i, 1)[0];
      toast(`Quitado: ${it.name}`, { action: 'Deshacer', ms: 5000, onAction: () => { opt.items.splice(i, 0, it); saveDiet(d); draw(); } });
    } else if (a === 'tpl') {
      const t = await actionSheet('Plantillas', Dt.templates.map(x => ({ label: x.name, sub: `${x.items.length} ingredientes · ${fK(Nutri.optionMacros(x).kcal)} kcal`, value: x.id })));
      const tpl = Dt.templates.find(x => x.id === t);
      if (!tpl) return;
      const v = await actionSheet(tpl.name, [{ label: 'Añadir sus ingredientes a esta opción', value: 'add' }, { label: 'Borrar plantilla', value: 'del', danger: true }]);
      if (v === 'add') opt.items.push(...cloneOption(tpl).items);
      else if (v === 'del') { Dt.templates = Dt.templates.filter(x => x !== tpl); await DB.del('templates', tpl.id); toast('Plantilla borrada'); }
      else return;
    } else if (a === 'menu') {
      const v = await actionSheet(`${meal.name} · ${opt.name}`, [
        { label: 'Guardar como plantilla', sub: 'Para reutilizarla en otras comidas o dietas', value: 'save' },
        { label: 'Duplicar opción', value: 'dup' },
        { label: 'Borrar opción', value: 'del', danger: true },
      ]);
      if (v === 'save') {
        if (!opt.items.length) return toast('Añade ingredientes antes de guardarla');
        const name = await promptText('Nombre de la plantilla', `${meal.name} ${opt.name}`);
        if (!name || !name.trim()) return;
        const tpl = { ...cloneOption(opt), name: name.trim() };
        Dt.templates.push(tpl); await DB.put('templates', tpl); dietDerive();
        toast('Plantilla guardada');
      } else if (v === 'dup') {
        const c = cloneOption(opt); c.name = nextOptionName(meal);
        meal.options.push(c); await saveDiet(d);
        toast(`Creada la opción ${c.name}`);
        return;
      } else if (v === 'del') {
        const ok = await ask({ title: `¿Borrar la opción ${opt.name}?`, message: `${meal.name} · ${opt.items.length} ingredientes`, ok: 'Borrar', cancel: 'Cancelar', danger: true });
        if (!ok) return;
        meal.options = meal.options.filter(o => o !== opt);
        if (d.sel[meal.id] === opt.id) { if (meal.options[0]) d.sel[meal.id] = meal.options[0].id; else delete d.sel[meal.id]; }
        await saveDiet(d);
        return popLayer();
      } else return;
    } else return;
    await saveDiet(d);
    draw();
  });
}

/* ================= Alimentos: buscar, recientes, favoritos, personalizados ================= */
const isFav = key => (S.favFoods || []).some(f => f.key === key);
const slimFood = f => ({ key: f.key, name: f.name, per100: f.per100, portions: f.portions || [] });
function rememberFood(food) {
  S.recentFoods = [slimFood(food), ...(S.recentFoods || []).filter(f => f.key !== food.key)].slice(0, 25);
  saveSettings();
}
function toggleFav(food) {
  S.favFoods = isFav(food.key) ? S.favFoods.filter(f => f.key !== food.key) : [slimFood(food), ...(S.favFoods || [])];
  saveSettings();
}
const foodRow = f => `<div class="food-row" data-key="${esc(f.key)}">
  <button class="food-main"><span>${esc(f.name)}</span><small>${fK(f.per100.kcal)} kcal · P ${fM(f.per100.p)} · C ${fM(f.per100.c)} · G ${fM(f.per100.f)} <i>por 100 g</i></small></button>
  ${f.key.startsWith('c:') ? '<button class="food-side" data-fa="edit" aria-label="Editar">✎</button>' : ''}
  <button class="food-side fav${isFav(f.key) ? ' on' : ''}" data-fa="fav" aria-label="Favorito">${starIcon}</button>
</div>`;

function pickFood() {
  return new Promise(res => {
    let result = null, shown = new Map(), timer = 0;
    genSheet.innerHTML = `<div class="grabber"></div><h2>Añadir ingrediente</h2>
      <div class="search"><input type="search" id="fd-q" placeholder="Buscar alimento: pollo, arroz, huevo…" autocomplete="off"></div>
      <label class="usda-toggle"><input type="checkbox" class="switch" id="fd-usda" ${S.usdaSearch ? 'checked' : ''}><span>Buscar también en la base completa <small>8.789 alimentos, en inglés («chicken», «rice»)</small></span></label>
      <div class="pick-list" id="fd-list"></div>
      <button class="btn btn-ghost btn-block" id="fd-new">＋ Crear alimento a mano</button>`;
    const q = $('#fd-q', genSheet), list = $('#fd-list', genSheet), usda = $('#fd-usda', genSheet);
    const section = (title, foods) => (foods.length ? `<div class="pick-title">${title}</div>${foods.map(foodRow).join('')}` : '');
    const draw = () => {
      shown = new Map();
      const txt = q.value.trim();
      let html;
      if (!txt) {
        const favs = S.favFoods || [], rec = (S.recentFoods || []).filter(f => !isFav(f.key));
        const mine = Dt.foods.map(Foods.customToFood).filter(f => !isFav(f.key));
        [...favs, ...rec, ...mine].forEach(f => shown.set(f.key, f));
        html = section('Favoritos', favs) + section('Recientes', rec) + section('Mis alimentos', mine)
          || '<p class="fine center" style="margin:18px 0">Escribe para buscar. Aquí aparecerán tus alimentos recientes y favoritos.</p>';
      } else {
        const r = Foods.search(txt, { usda: usda.checked });
        r.forEach(f => shown.set(f.key, f));
        html = r.length ? r.map(foodRow).join('')
          : `<p class="fine center" style="margin:18px 0">Sin resultados para «${esc(txt)}».${usda.checked ? '' : ' Prueba a activar la base completa (en inglés) o'} ${usda.checked ? 'Puedes' : ''} crea${usda.checked ? 'r' : ''} el alimento a mano.</p>`;
      }
      list.innerHTML = html;
    };
    q.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(draw, 120); });
    usda.addEventListener('change', async () => {
      S.usdaSearch = usda.checked; saveSettings();
      if (usda.checked && !Foods.usdaReady()) {
        list.innerHTML = '<p class="fine center" style="margin:18px 0">Cargando la base completa…</p>';
        const ok = await Foods.loadUsda();
        if (!ok) { toast('No se pudo cargar la base completa'); usda.checked = false; S.usdaSearch = false; saveSettings(); }
      }
      draw();
    });
    genSheet.onclick = async e => {
      if (e.target.closest('#fd-new')) { result = { __new: q.value.trim() }; closeSheet(); return; }
      const row = e.target.closest('.food-row');
      if (!row) return;
      const f = shown.get(row.dataset.key);
      if (!f) return;
      const side = e.target.closest('[data-fa]');
      if (side && side.dataset.fa === 'fav') { toggleFav(f); side.classList.toggle('on', isFav(f.key)); return; }
      if (side && side.dataset.fa === 'edit') { result = { __edit: f.key.slice(2) }; closeSheet(); return; }
      result = f; closeSheet();
    };
    if (S.usdaSearch && !Foods.usdaReady()) Foods.loadUsda().then(draw);
    draw();
    openSheet(genSheet, async () => {
      genSheet.onclick = null;
      if (result && (result.__new != null || result.__edit)) {
        const created = await editCustomFood(result.__edit ? Dt.foods.find(x => x.id === result.__edit) : null, result.__new || '');
        res(created || (await pickFood()));
      } else res(result);
    });
    setTimeout(() => q.focus(), 280);
  });
}

// Cantidad: gramos o una de las porciones del alimento. Devuelve el ingrediente listo, o null.
function askQuantity(food, current = null) {
  return new Promise(res => {
    let result = null;
    const portions = food.portions || [];
    let unit = current ? (current.unit === 'portion' ? portions.findIndex(p => p.name === current.portionName && p.g === current.portionG) : -1) : -1;
    if (current && current.unit === 'portion' && unit < 0) unit = -1;
    let qty = current ? current.qty : 100;
    if (current && current.unit === 'portion' && unit < 0) qty = Nutri.itemGrams(current);
    const build = () => {
      const p = portions[unit];
      return { id: uid(), key: food.key, name: food.name, qty, unit: p ? 'portion' : 'g', portionName: p ? p.name : null, portionG: p ? p.g : null, per100: { ...food.per100 }, portions };
    };
    const preview = () => {
      const m = Nutri.itemMacros(build());
      $('#qt-prev', genSheet).innerHTML = `<div><b>${fK(m.kcal)}</b><small>kcal</small></div><div><b>${fM(m.p)}</b><small>Proteína</small></div><div><b>${fM(m.c)}</b><small>Carbos</small></div><div><b>${fM(m.f)}</b><small>Grasa</small></div>`;
      $('#qt-unit', genSheet).textContent = portions[unit] ? portions[unit].name : 'g';
      $('#qt-g', genSheet).textContent = portions[unit] ? `= ${Nutri.fmtGrams(Nutri.itemGrams(build()))}` : '';
    };
    genSheet.innerHTML = `<div class="grabber"></div><h2>${esc(food.name)}</h2>
      <p class="fine center">Por 100 g: ${fK(food.per100.kcal)} kcal · P ${fM(food.per100.p)} · C ${fM(food.per100.c)} · G ${fM(food.per100.f)}</p>
      ${portions.length ? `<div class="chips chips-center" id="qt-units"><button class="chip${unit < 0 ? ' on' : ''}" data-u="-1">Gramos</button>${portions.map((p, i) => `<button class="chip${unit === i ? ' on' : ''}" data-u="${i}">${esc(p.name)} (${fmtN(p.g)} g)</button>`).join('')}</div>` : ''}
      <div class="weight-input"><input id="qt-in" type="text" inputmode="decimal" value="${fmtN(qty)}" aria-label="Cantidad"><span id="qt-unit">g</span></div>
      <p class="fine center" id="qt-g"></p>
      <div class="opt-total" id="qt-prev"></div>
      <button class="btn btn-primary btn-block btn-big" id="qt-ok" style="margin-top:14px">${current ? 'Guardar' : 'Añadir'}</button>`;
    const inp = $('#qt-in', genSheet);
    inp.addEventListener('input', () => { const v = parseFloat(inp.value.replace(',', '.')); qty = isNaN(v) || v < 0 ? 0 : v; preview(); });
    genSheet.onclick = e => {
      const u = e.target.closest('[data-u]');
      if (u) {
        const nu = +u.dataset.u;
        if (nu !== unit) { unit = nu; qty = unit < 0 ? 100 : 1; inp.value = fmtN(qty); }
        $$('#qt-units .chip', genSheet).forEach(c => c.classList.toggle('on', c === u));
        preview();
        return;
      }
      if (e.target.closest('#qt-ok')) {
        if (!(qty > 0)) return toast('Escribe una cantidad');
        result = build(); closeSheet();
      }
    };
    preview();
    openSheet(genSheet, () => { genSheet.onclick = null; res(result); });
    setTimeout(() => { inp.focus(); inp.select(); }, 280);
  });
}

// Crear o editar un alimento personalizado. Devuelve el alimento (formato de Foods) o null.
function editCustomFood(existing, name = '') {
  return new Promise(res => {
    let result = null;
    const c = existing || { id: uid(), name, per100: {}, portions: [] };
    const v = k => (c.per100[k] != null && c.per100[k] !== 0 ? fmtN(c.per100[k]) : (existing && ['kcal', 'p', 'c', 'f'].includes(k) ? '0' : ''));
    const p0 = (c.portions || [])[0];
    const row = (k, label, unit, req) => `<label class="field"><span>${label}${req ? '' : ' <small class="sub">(opcional)</small>'}</span><span class="input-unit"><input data-cf="${k}" type="text" inputmode="decimal" value="${v(k)}" placeholder="${req ? '0' : '—'}"><em>${unit}</em></span></label>`;
    genSheet.innerHTML = `<div class="grabber"></div><h2>${existing ? 'Editar alimento' : 'Crear alimento'}</h2>
      <input class="big-name" id="cf-name" placeholder="Nombre del alimento" value="${esc(c.name)}">
      <p class="fine">Valores por 100 g (los de la etiqueta del producto).</p>
      <div class="card form-card">
        ${row('kcal', 'Calorías', 'kcal', true)}${row('p', 'Proteínas', 'g', true)}${row('c', 'Carbohidratos', 'g', true)}${row('f', 'Grasas', 'g', true)}
        ${row('fiber', 'Fibra', 'g')}${row('sugar', 'Azúcares', 'g')}${row('salt', 'Sal', 'g')}
      </div>
      <p class="fine">Porción habitual (opcional), por ejemplo «unidad» = 125 g.</p>
      <div class="card form-card">
        <label class="field"><span>Nombre de la porción</span><span class="input-unit"><input id="cf-pn" type="text" value="${p0 ? esc(p0.name) : ''}" placeholder="unidad" style="width:120px"></span></label>
        <label class="field"><span>Peso de la porción</span><span class="input-unit"><input id="cf-pg" type="text" inputmode="decimal" value="${p0 ? fmtN(p0.g) : ''}" placeholder="—"><em>g</em></span></label>
      </div>
      <button class="btn btn-primary btn-block btn-big" id="cf-ok" style="margin-top:14px">Guardar alimento</button>
      ${existing ? '<button class="btn btn-danger-ghost btn-block" id="cf-del">Borrar alimento</button>' : ''}`;
    genSheet.onclick = async e => {
      if (e.target.closest('#cf-del')) {
        Dt.foods = Dt.foods.filter(x => x.id !== c.id);
        await DB.del('foods', c.id);
        S.favFoods = (S.favFoods || []).filter(f => f.key !== 'c:' + c.id);
        S.recentFoods = (S.recentFoods || []).filter(f => f.key !== 'c:' + c.id);
        saveSettings(); dietDerive();
        toast('Alimento borrado. Las opciones que ya lo usaban lo conservan.');
        closeSheet();
        return;
      }
      if (!e.target.closest('#cf-ok')) return;
      const nm = $('#cf-name', genSheet).value.trim();
      if (!nm) return toast('Ponle un nombre al alimento');
      const per100 = {};
      for (const inp of $$('[data-cf]', genSheet)) {
        const k = inp.dataset.cf, raw = inp.value.trim();
        const n = raw === '' ? 0 : parseFloat(raw.replace(',', '.'));
        if (isNaN(n) || n < 0) return toast('Hay un valor que no es un número válido');
        per100[k] = n;
      }
      if (per100.kcal > 900) return toast('Las calorías por 100 g no pueden pasar de 900');
      if (per100.p + per100.c + per100.f > 100.5) return toast('Proteínas + carbohidratos + grasas no pueden sumar más de 100 g');
      if (!per100.kcal && !per100.p && !per100.c && !per100.f) return toast('Rellena al menos las calorías o algún macro');
      const pn = $('#cf-pn', genSheet).value.trim(), pg = parseFloat($('#cf-pg', genSheet).value.replace(',', '.'));
      c.name = nm; c.per100 = per100;
      c.portions = pg > 0 ? [{ name: pn || 'porción', g: pg }] : [];
      if (!existing) Dt.foods.push(c);
      await DB.put('foods', c);
      dietDerive();
      result = Foods.customToFood(c);
      const up = l => (l || []).map(f => (f.key === result.key ? slimFood(result) : f));
      S.favFoods = up(S.favFoods); S.recentFoods = up(S.recentFoods); saveSettings();
      toast(existing ? 'Alimento actualizado' : 'Alimento creado');
      closeSheet();
    };
    openSheet(genSheet, async () => {
      genSheet.onclick = null;
      if (result && !existing) res(await askQuantityThenFood(result)); else res(null);
    });
    if (!existing) setTimeout(() => $('#cf-name', genSheet).focus(), 280);
  });
}
// Tras crear un alimento se sigue el flujo normal: devolverlo para pedir la cantidad.
const askQuantityThenFood = food => Promise.resolve(food);

/* ================= Lista de la compra ================= */
function openShopping(d) {
  const pg = openPage();
  let days = 7;
  const sel = selectedOptions(d);
  const portionOf = new Map();
  sel.filter(Boolean).forEach(o => o.items.forEach(it => { if (it.unit === 'portion' && it.portionG) portionOf.set(it.key, { name: it.portionName, g: it.portionG }); }));
  const lines = () => Nutri.shoppingList(sel, days).map(x => {
    const p = portionOf.get(x.key);
    return { name: x.name, text: Nutri.fmtGrams(x.grams) + (p ? ` (≈ ${fmtN(Math.round(x.grams / p.g * 10) / 10)} × ${p.name})` : '') };
  });
  const draw = () => {
    const ls = lines();
    pg.el.innerHTML = `
      <div class="page-bar"><button class="icon-btn" data-s="back">${backIcon}</button><div class="page-bar-title"><b>Lista de la compra</b><small>${esc(d.name)}</small></div><span></span></div>
      <div class="page-body">
        <div class="card"><div class="r-row" style="margin:0"><span>Días</span><span class="stepper"><button data-s="minus">−</button><b>${days}</b><button data-s="plus">＋</button></span></div>
        <p class="fine" style="margin:10px 0 0">Con las opciones elegidas ahora: ${d.meals.map((m, i) => (sel[i] ? `${esc(m.name)} ${esc(sel[i].name)}` : null)).filter(Boolean).join(' · ') || 'ninguna'}.</p></div>
        ${ls.length ? `<div class="card list-wrap">${ls.map(l => `<div class="pr-row"><span>${esc(l.name)}</span><b>${esc(l.text)}</b></div>`).join('')}</div>
        <button class="btn btn-secondary btn-block" data-s="copy">Copiar lista</button>` : '<p class="fine center" style="margin-top:30px">No hay ingredientes en las opciones elegidas.</p>'}
        <div style="height:40px"></div>
      </div>`;
  };
  draw();
  pg.el.addEventListener('click', async e => {
    const b = e.target.closest('[data-s]');
    if (!b) return;
    const a = b.dataset.s;
    if (a === 'back') popLayer();
    else if (a === 'plus') { days = Math.min(31, days + 1); draw(); }
    else if (a === 'minus') { days = Math.max(1, days - 1); draw(); }
    else if (a === 'copy') {
      const text = `Lista de la compra · ${d.name} · ${days} ${days === 1 ? 'día' : 'días'}\n` + lines().map(l => `- ${l.name}: ${l.text}`).join('\n');
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch (_) { ok = legacyCopy(text); }
      toast(ok ? 'Lista copiada' : 'No se pudo copiar');
    }
  });
}
