/* Tracking · registro de peso. Todo se guarda en este dispositivo (IndexedDB). */
'use strict';

const APP_VERSION = '2.7.0';

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

/* ================= Fechas ================= */
const DAY = 864e5;
const pad2 = n => String(n).padStart(2, '0');
function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function isoToIdx(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / DAY);
}
function idxToISO(i) {
  const d = new Date(i * DAY);
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`;
}
const isoToDMY = iso => { const [y, m, d] = iso.split('-'); return `${d}-${m}-${y}`; };
const weekday = idx => ((idx + 4) % 7 + 7) % 7; // 0 = domingo
const dtf = o => new Intl.DateTimeFormat('es-ES', { timeZone: 'UTC', ...o });
const F = {
  wdDayMon: dtf({ weekday: 'short', day: 'numeric', month: 'short' }),
  wdDay: dtf({ weekday: 'short', day: 'numeric' }),
  wd: dtf({ weekday: 'short' }),
  dayMonYear: dtf({ day: 'numeric', month: 'short', year: 'numeric' }),
  dayMon: dtf({ day: 'numeric', month: 'short' }),
  day: dtf({ day: 'numeric' }),
  monYear: dtf({ month: 'long', year: 'numeric' }),
  mon: dtf({ month: 'short' }),
  longDate: dtf({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
  tip: dtf({ weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }),
};
const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
const fmtD = (f, iso) => f.format(new Date(isoToIdx(iso) * DAY)).replace(/\./g, '');
const fmtDi = (f, idx) => f.format(new Date(idx * DAY)).replace(/\./g, '');

/* ================= Números ================= */
function fmtKg(n) {
  const r = Math.round(n * 100) / 100;
  const oneDec = Math.abs(r * 10 - Math.round(r * 10)) < 1e-6;
  return (oneDec ? r.toFixed(1) : r.toFixed(2)).replace('.', ',');
}
const fmt1 = n => (Math.round(n * 10) / 10).toFixed(1).replace('.', ',');
function fmtSigned(n, dec = 1) {
  const f = 10 ** dec;
  const r = Math.round(n * f) / f;
  const s = Math.abs(r).toFixed(dec).replace('.', ',');
  if (r === 0) return '±' + s;
  return (r > 0 ? '+' : '−') + s;
}
function parseKg(str) {
  const s = String(str).trim().replace(/\s+/g, '').replace(',', '.');
  if (!/^\d{1,3}(\.\d{0,2})?$/.test(s)) return NaN;
  return Math.round(parseFloat(s) * 100) / 100;
}

/* ================= Base de datos ================= */
const DB = {
  db: null,
  open() {
    return new Promise((res, rej) => {
      const r = indexedDB.open('tracking', 4);
      r.onupgradeneeded = () => {
        const db = r.result;
        if (!db.objectStoreNames.contains('entries')) db.createObjectStore('entries', { keyPath: 'date' });
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
        for (const st of ['exercises', 'routines', 'workouts', 'diets', 'foods', 'templates', 'measures']) {
          if (!db.objectStoreNames.contains(st)) db.createObjectStore(st, { keyPath: 'id' });
        }
      };
      r.onsuccess = () => { this.db = r.result; res(); };
      r.onerror = () => rej(r.error);
    });
  },
  run(store, mode, fn) {
    return new Promise((res, rej) => {
      const t = this.db.transaction(store, mode);
      let req;
      try { req = fn(t.objectStore(store)); } catch (e) { rej(e); return; }
      t.oncomplete = () => {
        if (mode === 'readwrite' && typeof scheduleAutoBackup === 'function') scheduleAutoBackup();
        res(req && 'result' in req ? req.result : undefined);
      };
      t.onerror = () => rej(t.error);
      t.onabort = () => rej(t.error);
    });
  },
  allEntries() { return this.run('entries', 'readonly', s => s.getAll()); },
  putEntry(e) { return this.run('entries', 'readwrite', s => s.put(e)); },
  putEntries(list) { return this.run('entries', 'readwrite', s => { list.forEach(e => s.put(e)); }); },
  delEntry(date) { return this.run('entries', 'readwrite', s => s.delete(date)); },
  replaceEntries(list) { return this.run('entries', 'readwrite', s => { s.clear(); list.forEach(e => s.put(e)); }); },
  getSettings() { return this.run('settings', 'readonly', s => s.get('app')); },
  putSettings(o) { return this.run('settings', 'readwrite', s => s.put(o, 'app')); },
  getKey(key) { return this.run('settings', 'readonly', s => s.get(key)); },
  putKey(key, v) { return this.run('settings', 'readwrite', s => (v == null ? s.delete(key) : s.put(v, key))); },
  all(store) { return this.run(store, 'readonly', s => s.getAll()); },
  put(store, v) { return this.run(store, 'readwrite', s => s.put(v)); },
  putMany(store, list) { return this.run(store, 'readwrite', s => { list.forEach(v => s.put(v)); }); },
  del(store, key) { return this.run(store, 'readwrite', s => s.delete(key)); },
  clear(store) { return this.run(store, 'readwrite', s => s.clear()); },
};

/* ================= Estado ================= */
let entries = [];                       // [{date:'AAAA-MM-DD', kg}] ordenado
const DEFAULTS = { goal: null, height: null, theme: 'dark', lastBackup: null, snoozeUntil: null, firstUse: null, range: '3m', avg: 'week', rest: 90, sound: true, bar: 20, pesoView: 'resumen', gymView: 'rutinas', gymStat: 'count',
  // Perfil y dieta
  sex: null, birth: '', age: null, activity: null, weightMode: 'auto', weightManual: null,
  goalType: 'mant', dietGoal: { train: { pct: 0, prot: 2, fat: 1 }, rest: { pct: 0, prot: 2, fat: 1 } },
  dietId: null, dayType: 'auto', favFoods: [], recentFoods: [], usdaSearch: false, getOverride: null, restMode: 'timer', reminder: { on: false, time: '08:00' }, notifAsked: false };
let S = { ...DEFAULTS };
let D = { idx: [], trend: [] };          // datos derivados

const sortEntries = () => entries.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
const saveSettings = () => DB.putSettings({ ...S }).catch(() => {});

function derive() {
  const n = entries.length;
  const idx = entries.map(e => isoToIdx(e.date));
  const trend = new Array(n);
  let j = 0, sum = 0;
  for (let i = 0; i < n; i++) {
    sum += entries[i].kg;
    while (idx[j] <= idx[i] - 7) { sum -= entries[j].kg; j++; }
    trend[i] = sum / (i - j + 1);     // media de los últimos 7 días naturales
  }
  D = { idx, trend };
}

async function upsert(e) {
  await DB.putEntry(e);
  const i = entries.findIndex(x => x.date === e.date);
  if (i >= 0) entries[i] = e; else { entries.push(e); sortEntries(); }
}
async function removeEntry(date) {
  await DB.delEntry(date);
  entries = entries.filter(e => e.date !== date);
}

/* ================= Cálculos ================= */
// Dirección "buena": bajar, salvo que haya un objetivo por encima del peso actual.
function wantDown() {
  if (S.goal == null || !entries.length) return true;
  return S.goal <= D.trend[D.trend.length - 1];
}
function tone(delta) {
  if (Math.abs(delta) < 0.05) return 'neutral';
  return (delta < 0) === wantDown() ? 'good' : 'bad';
}

function pace() {
  const n = entries.length;
  if (!n) return null;
  const last = D.idx[n - 1];
  const from = last - 28;
  const xs = [], ys = [];
  for (let i = 0; i < n; i++) if (D.idx[i] > from) { xs.push(D.idx[i]); ys.push(entries[i].kg); }
  if (xs.length < 4 || xs[xs.length - 1] - xs[0] < 10) return null;
  const mx = xs.reduce((a, b) => a + b) / xs.length;
  const my = ys.reduce((a, b) => a + b) / ys.length;
  let num = 0, den = 0;
  for (let i = 0; i < xs.length; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  const slope = num / den;                         // kg por día
  return { perWeek: slope * 7, slope, current: my + slope * (last - mx), last };
}

function bmi(kg) {
  if (!S.height) return null;
  const m = S.height / 100;
  const v = kg / (m * m);
  const cat = v < 18.5 ? 'Bajo peso' : v < 25 ? 'Normal' : v < 30 ? 'Sobrepeso' : 'Obesidad';
  return { v, cat };
}

/* ================= Gráfico ================= */
function niceStep(range, maxTicks) {
  const c = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000];
  return c.find(s => range / s <= maxTicks) || 100;
}

class WeightChart {
  constructor(canvas, { interactive = false, onTap = null, trend = true, minMarker = true, tapSelect = false, fmtY = null, tip3 = null, small = false, fmtTag = null } = {}) {
    this.opt = { trend, minMarker, fmtY: fmtY || (v => `${fmtKg(v)} kg`), tip3, fmtTag };
    this.c = canvas;
    this.ctx = canvas.getContext('2d');
    this.interactive = interactive;
    this.pts = [];
    this.goal = null;
    this.minI = -1;
    this.view = [0, 30];
    this.sel = -1;
    this.w = 0; this.h = 0;
    this.pad = interactive ? { l: 12, r: 56, t: 16, b: 30 } : { l: 40, r: 10, t: 12, b: 24 };
    this.yView = null;          // null = escala vertical automática
    new ResizeObserver(() => this.resize()).observe(canvas);
    if (interactive) this.bindGestures();
    else if (onTap) canvas.parentElement.addEventListener('click', onTap);
    else if (tapSelect) canvas.addEventListener('click', e => this.pick(e.clientX - canvas.getBoundingClientRect().left));
    if (small) this.pad = { l: 46, r: 10, t: 12, b: 24 };
  }
  setData(pts, goal) {
    this.pts = pts;
    this.goal = goal;
    this.sel = -1;
    let mi = -1;
    pts.forEach((p, i) => { if (mi < 0 || p.y < pts[mi].y) mi = i; });
    this.minI = mi;
    this.request();
  }
  fullView() {
    const today = isoToIdx(todayISO());
    if (!this.pts.length) return [today - 30, today + 1];
    const a = this.pts[0].x, b = Math.max(this.pts[this.pts.length - 1].x, today);
    const pad = Math.max(1, (b - a) * 0.03);
    return [a - pad, b + pad];
  }
  setRange(key) {
    const [f0, f1] = this.fullView();
    if (key === 'all') { this.view = [f0, f1]; this.request(); return; }
    const days = typeof key === 'number' ? key : { '1w': 7, '1m': 30, '3m': 91, '6m': 182, '1y': 365 }[key];
    const end = f1;
    this.view = [Math.max(f0, end - days - 1), end];
    this.request();
  }
  setView(a, b) {
    const [f0, f1] = this.fullView();
    const full = f1 - f0;
    if (this.interactive) {
      // Movimiento libre: se puede ir más allá de los datos y alejar hasta 3 veces el rango.
      const s = clamp(b - a, 3, Math.max(full * 3, 30));
      const a2 = clamp(a, f0 - s * 0.6, f1 - s * 0.4);
      this.view = [a2, a2 + s];
    } else {
      const s = clamp(b - a, Math.min(6, full), full);
      const a2 = clamp(a, f0, f1 - s);
      this.view = [a2, a2 + s];
    }
    this.request();
  }
  setYAuto(on) {
    if (on) this.yView = null;
    else if (!this.yView) this.yView = [this.lo, this.hi];
    if (this.onYMode) this.onYMode(!this.yView);
    this.request();
  }
  resetAll() {
    const [a, b] = this.fullView();
    this.view = [a, b];
    this.sel = -1;
    this.setYAuto(true);
  }
  resize() {
    const r = this.c.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    this.dpr = dpr;
    this.w = r.width; this.h = r.height;
    this.c.width = Math.round(r.width * dpr);
    this.c.height = Math.round(r.height * dpr);
    this.draw();
  }
  request() {
    if (this.raf) return;
    this.raf = requestAnimationFrame(() => { this.raf = 0; this.draw(); });
  }
  draw() {
    const { ctx, w, h } = this;
    if (!w || !h) return;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const css = getComputedStyle(document.documentElement);
    const col = k => css.getPropertyValue(k).trim();
    const C = { muted: col('--muted'), line: col('--line'), fg: col('--fg'), accent: col('--accent'), goal: col('--goal'), good: col('--good'), point: col('--point'), surface: col('--surface'), surface2: col('--surface-2'), bg: col('--bg') };
    const font = (px, wt = 500) => `${wt} ${px}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    const [x0, x1] = this.view;
    const P = this.pad, L = P.l, R = w - P.r, T = P.t, B = h - P.b, W = R - L, H = B - T;
    const pts = this.pts;

    // Rango vertical: manual (si el usuario lo ha movido) o según lo visible
    let lo = Infinity, hi = -Infinity;
    let goalOff = null;
    if (this.yView) {
      [lo, hi] = this.yView;
      if (this.goal != null) goalOff = this.goal < lo ? 'below' : this.goal > hi ? 'above' : null;
    } else {
    for (const p of pts) if (p.x >= x0 - 0.5 && p.x <= x1 + 0.5) { lo = Math.min(lo, p.y, p.t); hi = Math.max(hi, p.y, p.t); }
    if (lo === Infinity) for (const p of pts) { lo = Math.min(lo, p.y); hi = Math.max(hi, p.y); }
    if (lo === Infinity) { lo = 70; hi = 80; }
    if (this.goal != null) {
      if (this.goal >= lo - 4 && this.goal <= hi + 4) { lo = Math.min(lo, this.goal); hi = Math.max(hi, this.goal); }
      else goalOff = this.goal < lo ? 'below' : 'above';
    }
    if (hi - lo < 1) { const m = (hi + lo) / 2; lo = m - 0.5; hi = m + 0.5; }
    const m = (hi - lo) * 0.1;
    lo -= m; hi += m;
    }
    const X = x => L + (x - x0) / (x1 - x0) * W;
    const Y = y => B - (y - lo) / (hi - lo) * H;
    Object.assign(this, { X, Y, L, R, T, B, W, H, lo, hi });
    const axisR = this.interactive;

    // Rejilla horizontal + etiquetas de peso
    const ys = niceStep(hi - lo, Math.max(2, Math.floor(H / (axisR ? 40 : 34))));
    if (axisR) { ctx.strokeStyle = C.line; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(R + 0.5, T - 8); ctx.lineTo(R + 0.5, B); ctx.lineTo(L, B + 0.5); ctx.stroke(); }
    ctx.font = font(11.5);
    ctx.textAlign = axisR ? 'left' : 'right'; ctx.textBaseline = 'middle';
    ctx.lineWidth = 1;
    for (let v = Math.ceil(lo / ys) * ys; v <= hi + 1e-9; v += ys) {
      const y = Math.round(Y(v)) + 0.5;
      ctx.strokeStyle = C.line; ctx.globalAlpha = 0.8;
      ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = C.muted;
      ctx.fillText((ys < 1 ? v.toFixed(1) : v.toFixed(0)).replace('.', ','), axisR ? R + 8 : L - 7, y);
    }

    // Etiquetas de fechas
    const pxDay = W / (x1 - x0);
    const minPx = 62;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    const ticks = [];
    const dStep = [1, 2, 7, 14].find(s => s * pxDay >= minPx);
    if (dStep) {
      let s = Math.ceil(x0);
      if (dStep >= 7) while (weekday(s) !== 1) s++;
      for (let x = s; x <= x1; x += dStep) ticks.push([x, fmtDi(F.dayMon, x)]);
    } else {
      const mStep = [1, 2, 3, 6, 12].find(s => s * 30.4 * pxDay >= minPx) || 12;
      const d0 = new Date(Math.floor(x0) * DAY);
      const mIdx = k => Math.round(Date.UTC(Math.floor(k / 12), k % 12, 1) / DAY);
      let k = d0.getUTCFullYear() * 12 + d0.getUTCMonth();
      while (mIdx(k) < x0 || (k % 12) % mStep !== 0) k++;
      for (let n = 0; n < 300 && mIdx(k) <= x1; n++, k += mStep) {
        const idx = mIdx(k);
        ticks.push([idx, k % 12 === 0 ? String(Math.floor(k / 12)) : fmtDi(F.mon, idx)]);
      }
    }
    for (const [x, lab] of ticks) {
      const px = X(x);
      if (px < L - 1 || px > R + 1) continue;
      ctx.strokeStyle = C.line; ctx.globalAlpha = 0.45;
      ctx.beginPath(); ctx.moveTo(Math.round(px) + 0.5, T); ctx.lineTo(Math.round(px) + 0.5, B); ctx.stroke();
      ctx.globalAlpha = 1; ctx.fillStyle = C.muted;
      const tw = ctx.measureText(lab).width / 2;
      ctx.fillText(lab, clamp(px, L + tw, R - tw), B + 8);
    }

    // Zona de dibujo
    ctx.save();
    ctx.beginPath(); ctx.rect(L, T - 8, W, H + 16); ctx.clip();

    // Objetivo
    if (this.goal != null) {
      ctx.font = font(11.5, 700);
      ctx.fillStyle = C.goal; ctx.strokeStyle = C.goal;
      const txt = `Objetivo ${fmtKg(this.goal)}`;
      if (!goalOff) {
        const gy = Y(this.goal);
        ctx.setLineDash([6, 5]); ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(L, gy); ctx.lineTo(R, gy); ctx.stroke();
        ctx.setLineDash([]);
        ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
        ctx.fillText(txt, R - 4, gy - 4);
      } else {
        ctx.textAlign = 'right';
        ctx.textBaseline = goalOff === 'below' ? 'bottom' : 'top';
        ctx.fillText((goalOff === 'below' ? '↓ ' : '↑ ') + txt, R - 4, goalOff === 'below' ? B - 2 : T + 2);
      }
    }

    // Índices visibles (con un punto extra a cada lado para las líneas)
    let i0 = pts.findIndex(p => p.x >= x0);
    if (i0 < 0) i0 = pts.length;
    i0 = Math.max(0, i0 - 1);
    let i1 = i0;
    while (i1 < pts.length - 1 && pts[i1].x <= x1) i1++;

    if (pts.length) {
      // Pesos diarios: línea fina + puntos
      ctx.strokeStyle = C.point; ctx.globalAlpha = 0.35; ctx.lineWidth = 1.2; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = i0; i <= i1; i++) { const px = X(pts[i].x), py = Y(pts[i].y); i === i0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
      ctx.stroke();
      ctx.globalAlpha = 0.85; ctx.fillStyle = C.point;
      const r = clamp(pxDay / 3.2, 1.8, this.interactive ? 5 : 3.2);
      for (let i = i0; i <= i1; i++) { ctx.beginPath(); ctx.arc(X(pts[i].x), Y(pts[i].y), r, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;

      // Media de 7 días
      ctx.strokeStyle = C.accent; ctx.lineWidth = this.opt.trend ? (this.interactive ? 3 : 2.6) : 2.2; ctx.lineCap = 'round';
      ctx.beginPath();
      for (let i = i0; i <= i1; i++) { const px = X(pts[i].x), py = Y(pts[i].t); i === i0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py); }
      ctx.stroke();
      if (!this.opt.trend) {
        ctx.fillStyle = C.accent;
        for (let i = i0; i <= i1; i++) { ctx.beginPath(); ctx.arc(X(pts[i].x), Y(pts[i].y), 3.4, 0, 7); ctx.fill(); }
      }

      // Último punto
      const lp = pts[pts.length - 1];
      if (lp.x >= x0 && lp.x <= x1) {
        ctx.fillStyle = C.accent;
        ctx.beginPath(); ctx.arc(X(lp.x), Y(lp.t), 5, 0, 7); ctx.fill();
        ctx.strokeStyle = C.surface; ctx.lineWidth = 2; ctx.stroke();
      }

      // Mínimo histórico
      const mp = this.opt.minMarker ? pts[this.minI] : null;
      if (mp && mp.x >= x0 && mp.x <= x1) {
        const mx = X(mp.x), my = Y(mp.y);
        ctx.strokeStyle = C.good; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(mx, my, 5.5, 0, 7); ctx.stroke();
        ctx.font = font(11, 700); ctx.fillStyle = C.good;
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        const lab = `mín ${fmtKg(mp.y)}`;
        const tw = ctx.measureText(lab).width / 2;
        ctx.fillText(lab, clamp(mx, L + tw + 2, R - tw - 2), Math.min(my + 9, B - 14));
      }
    }
    ctx.restore();

    // Etiqueta del último valor en el eje (como el precio actual en TradingView)
    const tag = (y, text, bg, fg) => {
      if (y < T - 6 || y > B + 6) return;
      ctx.font = font(11.5, 800);
      const tw = ctx.measureText(text).width + 12;
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(R + 2, y - 10, Math.max(tw, P.r - 4), 20, 5) : ctx.rect(R + 2, y - 10, tw, 20); ctx.fill();
      ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(text, R + 8, y);
    };
    const lastP = pts[pts.length - 1];
    if (axisR && lastP) {
      const ly = Y(lastP.t);
      ctx.strokeStyle = C.accent; ctx.globalAlpha = 0.5; ctx.setLineDash([2, 4]); ctx.lineWidth = 1;
      if (ly >= T && ly <= B) { ctx.beginPath(); ctx.moveTo(L, ly); ctx.lineTo(R, ly); ctx.stroke(); }
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      tag(ly, this.opt.fmtTag ? this.opt.fmtTag(lastP.t) : fmt1(lastP.t), C.accent, C.bg);
    }

    // Punto seleccionado
    const sp = pts[this.sel];
    if (sp && sp.x >= x0 && sp.x <= x1) {
      const sx = X(sp.x), sy = Y(sp.y);
      ctx.strokeStyle = C.muted; ctx.globalAlpha = 0.6; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(sx, T); ctx.lineTo(sx, B); ctx.stroke();
      if (axisR) { ctx.beginPath(); ctx.moveTo(L, sy); ctx.lineTo(R, sy); ctx.stroke(); }
      ctx.setLineDash([]); ctx.globalAlpha = 1;
      if (axisR) {
        tag(sy, this.opt.fmtTag ? this.opt.fmtTag(sp.y) : fmtKg(sp.y), C.fg, C.bg);
        const dl = fmtD(F.dayMonYear, sp.date);
        ctx.font = font(11.5, 800);
        const dw = ctx.measureText(dl).width + 14;
        const dx = clamp(sx - dw / 2, L, R - dw);
        ctx.fillStyle = C.fg;
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(dx, B + 4, dw, 20, 5) : ctx.rect(dx, B + 4, dw, 20); ctx.fill();
        ctx.fillStyle = C.bg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(dl, dx + dw / 2, B + 14);
      }
      ctx.fillStyle = C.fg;
      ctx.beginPath(); ctx.arc(sx, sy, 6.5, 0, 7); ctx.fill();
      ctx.strokeStyle = C.bg; ctx.lineWidth = 2.5; ctx.stroke();

      const l1 = cap(fmtD(F.tip, sp.date));
      const l2 = this.opt.fmtY(sp.y);
      const l3 = this.opt.tip3 ? this.opt.tip3(sp) : `Media 7 días: ${fmt1(sp.t)}`;
      ctx.font = font(13, 600); const w1 = ctx.measureText(l1).width;
      ctx.font = font(22, 800); const w2 = ctx.measureText(l2).width;
      ctx.font = font(12.5, 500); const w3 = ctx.measureText(l3).width;
      const bw = Math.max(w1, w2, w3) + 26, bh = 82;
      let bx = sx + 14; if (bx + bw > R) bx = sx - 14 - bw; bx = clamp(bx, L, R - bw);
      let by = sy - bh - 14; if (by < T) by = Math.min(sy + 14, B - bh);
      by = clamp(by, T, B - bh);
      ctx.fillStyle = C.surface2; ctx.strokeStyle = C.line; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.roundRect ? ctx.roundRect(bx, by, bw, bh, 12) : ctx.rect(bx, by, bw, bh); ctx.fill(); ctx.stroke();
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.fillStyle = C.muted; ctx.font = font(13, 600); ctx.fillText(l1, bx + 13, by + 10);
      ctx.fillStyle = C.fg; ctx.font = font(22, 800); ctx.fillText(l2, bx + 13, by + 28);
      ctx.fillStyle = C.accent; ctx.font = font(12.5, 600); ctx.fillText(l3, bx + 13, by + 58);
    }

    if (!pts.length) {
      ctx.fillStyle = C.muted; ctx.font = font(14); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('Sin datos todavía', L + W / 2, T + H / 2);
    }
  }

  /* --- Gestos estilo TradingView ---
     · 1 dedo en el gráfico: mover libremente (horizontal y vertical), con inercia.
     · 2 dedos: zoom (horizontal y, si separas en vertical, también vertical).
     · Arrastrar sobre el eje de precios (derecha): estirar/encoger en vertical.
     · Arrastrar sobre el eje de fechas (abajo): estirar/encoger en horizontal.
     · Tocar: ver un punto. Mantener pulsado y deslizar: cruz que sigue el dedo.
     · Doble toque: volver a la escala automática. */
  bindGestures() {
    const c = this.c;
    this.ptrs = new Map();
    const rel = e => { const r = c.getBoundingClientRect(); return { x: e.clientX - r.left, y: e.clientY - r.top }; };
    const startG = () => {
      this.g = { view: [...this.view], y: this.yView ? [...this.yView] : [this.lo, this.hi], manualY: !!this.yView, pts: [...this.ptrs.values()], zone: this.zone || 'plot', ydy: 0 };
    };
    c.addEventListener('pointerdown', e => {
      e.preventDefault();
      cancelAnimationFrame(this.inertia); this.inertia = 0;
      try { c.setPointerCapture(e.pointerId); } catch (_) {}
      const p = rel(e);
      this.ptrs.set(e.pointerId, p);
      clearTimeout(this.lpTimer);
      this.cross = false;
      if (this.ptrs.size === 1) {
        this.zone = p.x > this.R ? 'y' : p.y > this.B ? 'x' : 'plot';
        this.tap = { ...p, t: performance.now(), ok: true };
        this.vel = [{ ...p, t: performance.now() }];
        if (this.zone === 'plot') this.lpTimer = setTimeout(() => {
          if (this.tap && this.tap.ok && this.ptrs.size === 1) {
            this.cross = true;
            this.pick(this.tap.x, true);
            if (navigator.vibrate) try { navigator.vibrate(8); } catch (_) {}
          }
        }, 380);
      } else { this.tap = null; this.zone = 'plot'; }
      startG();
    });
    c.addEventListener('pointermove', e => {
      if (!this.ptrs.has(e.pointerId)) return;
      const p = rel(e);
      this.ptrs.set(e.pointerId, p);
      if (this.cross) { this.pick(p.x, true); return; }
      if (this.tap && Math.hypot(p.x - this.tap.x, p.y - this.tap.y) > 8) { this.tap.ok = false; clearTimeout(this.lpTimer); }
      if (this.tap && this.tap.ok) return;
      if (this.ptrs.size === 1) { this.vel.push({ ...p, t: performance.now() }); if (this.vel.length > 6) this.vel.shift(); }
      this.move();
    });
    const end = e => {
      if (!this.ptrs.has(e.pointerId)) return;
      const p = rel(e);
      this.ptrs.delete(e.pointerId);
      clearTimeout(this.lpTimer);
      const now = performance.now();
      if (e.type === 'pointerup' && this.ptrs.size === 0) {
        if (this.tap && this.tap.ok && !this.cross && now - this.tap.t < 500) {
          if (this.lastTap && now - this.lastTap.t < 330 && Math.abs(p.x - this.lastTap.x) < 30) { this.lastTap = null; this.sel = -1; this.setYAuto(true); }
          else { this.pick(p.x); this.lastTap = { t: now, x: p.x }; }
        } else if (!this.cross && this.zone === 'plot' && this.g && this.g.pts.length === 1) this.fling();
      }
      this.cross = false;
      if (this.ptrs.size) this.tap = null;
      this.zone = 'plot';
      startG();
    };
    c.addEventListener('pointerup', end);
    c.addEventListener('pointercancel', end);
    c.addEventListener('wheel', e => {
      e.preventDefault();
      const p = rel({ clientX: e.clientX, clientY: e.clientY });
      if (e.shiftKey || p.x > this.R) {
        const f = Math.exp(e.deltaY * 0.0015);
        const [lo, hi] = this.yView || [this.lo, this.hi];
        const mid = (lo + hi) / 2, hs = (hi - lo) * f / 2;
        this.setYManual([mid - hs, mid + hs]);
        return;
      }
      const [a, b] = this.view, s = b - a;
      const d = a + (p.x - this.L) / this.W * s;
      const ns = s * Math.exp(e.deltaY * 0.0015);
      const na = d - (p.x - this.L) / this.W * ns;
      this.setView(na, na + ns);
    }, { passive: false });
  }
  setYManual(r) {
    let [lo, hi] = r;
    const sp = clamp(hi - lo, 0.2, 5000);
    const mid = (lo + hi) / 2;
    this.yView = [mid - sp / 2, mid + sp / 2];
    if (this.onYMode) this.onYMode(false);
    this.request();
  }
  move() {
    const g = this.g;
    if (!g || !this.W) return;
    const cur = [...this.ptrs.values()];
    const [v0, v1] = g.view, s = v1 - v0;
    if (cur.length === 1 && g.pts.length === 1) {
      const dx = cur[0].x - g.pts[0].x, dy = cur[0].y - g.pts[0].y;
      const [y0, y1] = g.y, ys = y1 - y0;
      if (g.zone === 'y') {
        const f = Math.exp(dy * 0.006);
        const mid = (y0 + y1) / 2;
        this.setYManual([mid - ys * f / 2, mid + ys * f / 2]);
        return;
      }
      if (g.zone === 'x') {
        const ns = s * Math.exp(-dx * 0.006);
        this.setView(v1 - ns, v1);
        return;
      }
      this.setView(v0 - dx / this.W * s, v1 - dx / this.W * s);
      if (!g.manualY && Math.abs(dy) > 14) { g.manualY = true; g.y = [this.lo, this.hi]; g.ydy = dy; }
      if (g.manualY) {
        const [a0, a1] = g.y;
        const sh = (dy - g.ydy) / this.H * (a1 - a0);
        this.setYManual([a0 + sh, a1 + sh]);
      }
    } else if (cur.length >= 2 && g.pts.length >= 2) {
      const [p1, p2] = g.pts, [q1, q2] = cur;
      // Horizontal: zoom con la separación de los dedos, o solo mover si están casi alineados en vertical
      if (Math.abs(p2.x - p1.x) >= 30 && Math.abs(q2.x - q1.x) >= 20 && Math.sign(p2.x - p1.x) === Math.sign(q2.x - q1.x)) {
        const toD = px => v0 + (px - this.L) / this.W * s;
        const d1 = toD(p1.x), d2 = toD(p2.x);
        const ns = (d2 - d1) * this.W / (q2.x - q1.x);
        if (ns > 0) {
          const mid = (q1.x + q2.x) / 2, dm = (d1 + d2) / 2;
          const na = dm - (mid - this.L) / this.W * ns;
          this.setView(na, na + ns);
        }
      } else {
        const dx = ((q1.x + q2.x) - (p1.x + p2.x)) / 2;
        this.setView(v0 - dx / this.W * s, v1 - dx / this.W * s);
      }
      // Vertical: si separas los dedos en vertical, también hace zoom en el peso
      const pdy = Math.abs(p2.y - p1.y), qdy = Math.abs(q2.y - q1.y);
      const yZoom = pdy > 60 && qdy > 30 && Math.abs(qdy - pdy) > 10;
      if (yZoom || g.manualY) {
        const [y0, y1] = g.y, ys = y1 - y0;
        const nys = yZoom ? ys * pdy / qdy : ys;
        const toY = py => y0 + (this.B - py) / this.H * ys;
        const dm = toY((p1.y + p2.y) / 2);
        const nlo = dm - (this.B - (q1.y + q2.y) / 2) / this.H * nys;
        g.manualY = true;
        this.setYManual([nlo, nlo + nys]);
      }
    }
  }
  fling() {
    const v = this.vel || [];
    if (v.length < 2) return;
    const a = v[0], b = v[v.length - 1];
    const dt = b.t - a.t;
    if (dt <= 0 || performance.now() - b.t > 90) return;
    let vx = (b.x - a.x) / dt;            // px por ms
    if (Math.abs(vx) < 0.25) return;
    let last = performance.now();
    const step = () => {
      const now = performance.now(), d = now - last;
      last = now;
      const [x0, x1] = this.view, s = x1 - x0;
      const dx = vx * d;
      this.setView(x0 - dx / this.W * s, x1 - dx / this.W * s);
      vx *= Math.pow(0.995, d);
      this.inertia = Math.abs(vx) > 0.03 ? requestAnimationFrame(step) : 0;
    };
    this.inertia = requestAnimationFrame(step);
  }
  pick(px, keep = false) {
    let best = -1, bd = keep ? Infinity : 30;
    this.pts.forEach((p, i) => {
      if (p.x < this.view[0] || p.x > this.view[1]) return;
      const d = Math.abs(this.X(p.x) - px);
      if (d < bd) { bd = d; best = i; }
    });
    this.sel = keep ? best : (best === this.sel ? -1 : best);
    this.request();
  }
}

/* ================= Capas (paneles, pantalla completa) y botón atrás ================= */
const layers = [];
function pushLayer(close) { layers.push(close); history.pushState({ layer: layers.length }, ''); }
function popLayer() { if (layers.length) history.back(); }
window.addEventListener('popstate', () => {
  if (dialogDone) { dialogDone(false); if (layers.length) history.pushState({ layer: layers.length }, ''); return; }
  const close = layers.pop();
  if (close) close();
});

const backdrop = $('#backdrop');
let openSheetEl = null;
let lockCount = 0;
const lockBody = () => { lockCount++; document.body.classList.add('locked'); };
const unlockBody = () => { lockCount = Math.max(0, lockCount - 1); if (!lockCount) document.body.classList.remove('locked'); };
function openSheet(el, onClose) {
  openSheetEl = el;
  el.hidden = false; backdrop.hidden = false;
  lockBody();
  requestAnimationFrame(() => { el.classList.add('open'); backdrop.classList.add('open'); });
  pushLayer(() => {
    el.classList.remove('open'); backdrop.classList.remove('open');
    document.activeElement && document.activeElement.blur && document.activeElement.blur();
    openSheetEl = null;
    unlockBody();
    setTimeout(() => { if (!el.classList.contains('open')) el.hidden = true; if (!openSheetEl) backdrop.hidden = true; }, 260);
    if (onClose) onClose();
  });
}
const closeSheet = () => popLayer();
backdrop.addEventListener('click', closeSheet);

/* ================= Diálogo y avisos ================= */
let dialogDone = null;
function ask({ title, message, ok = 'Aceptar', cancel = 'Cancelar', danger = false }) {
  return new Promise(res => {
    const d = $('#dialog');
    $('#dialog-title').textContent = title;
    $('#dialog-msg').textContent = message;
    const okB = $('#dialog-ok'), caB = $('#dialog-cancel');
    okB.textContent = ok;
    okB.className = 'btn ' + (danger ? 'btn-danger' : 'btn-primary');
    caB.textContent = cancel || '';
    caB.hidden = !cancel;
    d.hidden = false;
    requestAnimationFrame(() => d.classList.add('open'));
    const done = v => {
      dialogDone = null;
      d.classList.remove('open');
      setTimeout(() => { if (!dialogDone) d.hidden = true; }, 170);
      res(v);
    };
    dialogDone = done;
    okB.onclick = () => done(true);
    caB.onclick = () => done(false);
    setTimeout(() => okB.focus({ preventScroll: true }), 50);
  });
}

let toastTimer = 0;
function toast(text, { action = null, onAction = null, ms = 2600 } = {}) {
  const t = $('#toast'), a = $('#toast-action');
  $('#toast-text').textContent = text;
  a.hidden = !action;
  a.textContent = action || '';
  a.onclick = () => { hide(); onAction && onAction(); };
  t.hidden = false;
  requestAnimationFrame(() => t.classList.add('open'));
  clearTimeout(toastTimer);
  function hide() { t.classList.remove('open'); setTimeout(() => { if (!t.classList.contains('open')) t.hidden = true; }, 220); }
  toastTimer = setTimeout(hide, ms);
}

/* ================= Pestañas ================= */
let currentTab = 'inicio';
function showTab(name) {
  currentTab = name;
  $$('.tab').forEach(s => { s.hidden = s.id !== 'tab-' + name; });
  $$('#tabbar button').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
  $('#page-title').textContent = $('#tab-' + name).dataset.title;
  $('#fab').hidden = name !== 'peso';
  window.scrollTo(0, 0);
}
function showPesoView(v) {
  S.pesoView = v;
  $$('#peso-seg button').forEach(b => b.classList.toggle('on', b.dataset.view === v));
  ['resumen', 'medias', 'historial', 'medidas'].forEach(k => { $('#peso-' + k).hidden = k !== v; });
}
$$('#peso-seg button').forEach(b => b.addEventListener('click', () => { showPesoView(b.dataset.view); saveSettings(); }));
$$('#tabbar button').forEach(b => b.addEventListener('click', () => showTab(b.dataset.tab)));

/* ================= Render ================= */
let chart, fsChart;

function chartPoints() {
  return entries.map((e, i) => ({ x: D.idx[i], y: e.kg, t: D.trend[i], date: e.date }));
}

function renderAll() {
  derive();
  renderHome();
  renderAverages();
  renderHistory();
  renderSettings();
  if (typeof gymRenderAll === 'function') gymRenderAll();
  if (typeof dietRenderAll === 'function') dietRenderAll();
  if (typeof renderMeasures === 'function') renderMeasures();
  if (typeof nativeAfterRender === 'function') nativeAfterRender();
}

function renderHome() {
  const has = entries.length > 0;
  $('#welcome').hidden = has;
  $('#home-content').hidden = !has;
  renderBackupBanner();
  if (!has) return;

  const n = entries.length;
  const last = entries[n - 1];
  const lastT = D.trend[n - 1];
  const first = entries[0];
  const total = lastT - first.kg;
  const lastIdx = D.idx[n - 1];

  let k = -1;
  for (let i = n - 1; i >= 0; i--) if (D.idx[i] <= lastIdx - 30) { k = i; break; }
  const d30 = k >= 0 ? lastT - D.trend[k] : null;

  let mi = 0;
  entries.forEach((e, i) => { if (e.kg < entries[mi].kg) mi = i; });
  const b = bmi(last.kg);
  const isToday = last.date === todayISO();

  $('#summary').innerHTML = `
    <div class="card hero">
      <div class="hero-main">
        <div class="label">Último peso</div>
        <div class="big">${fmtKg(last.kg)}<span class="unit">kg</span></div>
        <div class="sub">${isToday ? 'Hoy' : cap(fmtD(F.wdDayMon, last.date))}</div>
      </div>
      <div class="hero-side">
        <div><span class="label">Media 7 días</span><b>${fmt1(lastT)} kg</b></div>
        <div><span class="label">IMC</span>${b ? `<b>${fmt1(b.v)}</b><span class="sub">${b.cat}</span>` : `<button class="link" style="padding:0" data-goto="ajustes">Añadir estatura</button>`}</div>
      </div>
    </div>
    <div class="stats">
      <div class="card stat"><div class="label">Total</div><div class="val ${tone(total)}">${fmtSigned(total)}</div><div class="sub">desde ${fmtD(F.dayMon, first.date)}</div></div>
      <div class="card stat"><div class="label">30 días</div><div class="val ${d30 == null ? 'neutral' : tone(d30)}">${d30 == null ? '—' : fmtSigned(d30)}</div><div class="sub">${d30 == null ? 'pocos datos' : 'media 7 días'}</div></div>
      <div class="card stat"><div class="label">Mínimo</div><div class="val good">${fmtKg(entries[mi].kg)}</div><div class="sub">${fmtD(F.dayMonYear, entries[mi].date)}</div></div>
    </div>`;

  // Gráfico
  const pts = chartPoints();
  chart.setData(pts, S.goal);
  renderRanges();      // botones de periodo configurables (chart-ranges.js)
  $('#legend').innerHTML = `<span><i class="lg-dot"></i>Peso diario</span><span><i class="lg-line"></i>Media 7 días</span>${S.goal != null ? '<span><i class="lg-dash"></i>Objetivo</span>' : ''}<span><i class="lg-min"></i>Mínimo</span>`;
  if (!$('#fs').hidden) fsChart.setData(pts, S.goal);

  // Ritmo y objetivo
  const p = pace();
  let html = '<div class="card pace">';
  if (p) {
    const cls = Math.abs(p.perWeek) < 0.05 ? 'neutral' : tone(p.perWeek);
    html += `<div class="label">Ritmo actual</div>
      <div class="pace-row"><div class="val ${cls}">${fmtSigned(p.perWeek, 2)} <span style="font-size:16px">kg/semana</span></div></div>
      <div class="sub">Tendencia de las últimas 4 semanas</div>`;
  } else {
    html += `<div class="label">Ritmo actual</div><div class="sub" style="margin-top:4px">Necesito al menos 4 registros en las últimas 4 semanas para calcularlo.</div>`;
  }
  if (S.goal != null) {
    const g = S.goal;
    const left = lastT - g;
    const startGap = first.kg - g;
    const prog = startGap !== 0 && Math.sign(startGap) === Math.sign(left || startGap) ? clamp(1 - left / startGap, 0, 1) : (Math.abs(left) < 0.1 ? 1 : 0);
    let proj;
    if (Math.abs(left) < 0.1 || (startGap > 0 && left <= 0) || (startGap < 0 && left >= 0)) {
      proj = '🎉 ¡Objetivo alcanzado!';
    } else if (!p) {
      proj = 'Cuando haya más datos te diré cuándo lo alcanzarías.';
    } else {
      const toward = (g - p.current) / p.slope;
      if (p.slope !== 0 && toward > 0 && Math.abs(p.perWeek) >= 0.02) {
        if (toward > 3 * 365) proj = 'Al ritmo actual tardarías más de 3 años.';
        else proj = `Lo alcanzarías hacia el <b>${fmtDi(F.dayMonYear, Math.round(p.last + toward))}</b>`;
      } else if (Math.abs(p.perWeek) < 0.05) {
        proj = 'Al ritmo actual estás estable: no te acercas al objetivo.';
      } else {
        proj = 'Al ritmo actual te estás alejando del objetivo.';
      }
    }
    html += `<div class="goal-box">
      <div class="pace-row"><span class="label">Objetivo ${fmtKg(g)} kg</span><span class="sub">${Math.abs(left) < 0.1 ? '' : `faltan ${fmt1(Math.abs(left))} kg`}</span></div>
      <div class="progress"><div style="width:${(prog * 100).toFixed(1)}%"></div></div>
      <p class="projection">${proj}</p>
      ${typeof dietTheoryLine === 'function' ? dietTheoryLine(lastT, g) : ''}
    </div>`;
  } else {
    html += `<div class="goal-box"><button class="link" style="padding:0" data-goto="ajustes">Define un peso objetivo</button><div class="sub">y te digo cuándo lo alcanzarías.</div></div>`;
  }
  html += '</div>';
  $('#pace').innerHTML = html;
}

function renderBackupBanner() {
  const el = $('#backup-banner');
  if (!entries.length || !S.firstUse) { el.hidden = true; return; }
  const t = isoToIdx(todayISO());
  const base = S.lastBackup || S.firstUse;
  const due = t - isoToIdx(base) >= 30 && !(S.snoozeUntil && t < isoToIdx(S.snoozeUntil));
  el.hidden = !due;
  if (due) $('#backup-banner-sub').textContent = S.lastBackup
    ? `La última fue el ${fmtD(F.dayMonYear, S.lastBackup)}. Expórtala para no perder nada.`
    : 'Aún no has hecho ninguna. Expórtala para no perder nada.';
}

function renderAverages() {
  const box = $('#avg-list');
  $$('#avg-seg button').forEach(b => b.classList.toggle('on', b.dataset.avg === S.avg));
  if (!entries.length) { box.innerHTML = '<p class="fine center" style="margin-top:30px">Aún no hay registros.</p>'; return; }
  const groups = new Map();
  entries.forEach((e, i) => {
    const idx = D.idx[i];
    let key;
    if (S.avg === 'week') key = idx - ((weekday(idx) + 6) % 7);           // lunes
    else key = e.date.slice(0, 7);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e.kg);
  });
  const rows = [...groups].map(([key, list]) => ({ key, avg: list.reduce((a, b) => a + b) / list.length, n: list.length }));
  const lo = Math.min(...rows.map(r => r.avg)), hi = Math.max(...rows.map(r => r.avg));
  const thisYear = todayISO().slice(0, 4);
  let html = '<div class="card list-wrap">';
  for (let i = rows.length - 1; i >= 0; i--) {
    const r = rows[i], prev = rows[i - 1];
    let name, sub;
    if (S.avg === 'week') {
      const a = r.key, b = r.key + 6;
      const sameMonth = fmtDi(F.mon, a) === fmtDi(F.mon, b);
      const yr = idxToISO(b).slice(0, 4);
      name = sameMonth ? `${fmtDi(F.day, a)}–${fmtDi(F.dayMon, b)}` : `${fmtDi(F.dayMon, a)} – ${fmtDi(F.dayMon, b)}`;
      if (yr !== thisYear) name += ` ${yr}`;
      if (a <= isoToIdx(todayISO()) && isoToIdx(todayISO()) <= b) name = 'Esta semana · ' + name;
    } else {
      name = cap(fmtD(F.monYear, r.key + '-01'));
    }
    sub = `${r.n} ${r.n === 1 ? 'registro' : 'registros'}`;
    const diff = prev ? r.avg - prev.avg : null;
    const w = hi > lo ? 12 + (r.avg - lo) / (hi - lo) * 88 : 60;
    html += `<div class="avg-row">
      <div class="avg-name">${name}<small>${sub}</small></div>
      <div class="avg-vals"><b>${fmt1(r.avg)} kg</b>${diff == null ? '<small class="sub">—</small>' : `<small class="${tone(diff)}">${fmtSigned(diff)} ${diff < -0.05 ? '↓' : diff > 0.05 ? '↑' : ''}</small>`}</div>
      <div class="avg-bar"><div style="width:${w.toFixed(1)}%"></div></div>
    </div>`;
  }
  box.innerHTML = html + '</div>';
}

function renderHistory() {
  const box = $('#history-list');
  if (!entries.length) { box.innerHTML = '<p class="fine center" style="margin-top:30px">Aún no hay registros.</p>'; return; }
  let html = '', month = null;
  const chev = '<svg class="chev" viewBox="0 0 24 24"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  for (let i = entries.length - 1; i >= 0; i--) {
    const e = entries[i];
    const m = e.date.slice(0, 7);
    if (m !== month) {
      if (month) html += '</div>';
      const cnt = entries.filter(x => x.date.startsWith(m)).length;
      html += `<div class="month-head"><span>${cap(fmtD(F.monYear, m + '-01'))}</span><span>${cnt}</span></div><div class="card list-wrap">`;
      month = m;
    }
    const prev = entries[i - 1];
    const diff = prev ? e.kg - prev.kg : null;
    html += `<button class="hist-row" data-date="${e.date}">
      <span class="hist-date">${cap(fmtD(F.wdDay, e.date))}<small>${fmtD(F.mon, e.date)}</small></span>
      <span class="hist-kg">${fmtKg(e.kg)}</span>
      <span class="hist-diff ${diff == null ? 'sub' : tone(diff)}">${diff == null ? '' : fmtSigned(diff)}</span>
      ${chev}
    </button>`;
  }
  box.innerHTML = html + '</div>';
}

function renderSettings() {
  const gi = $('#goal-input');
  if (document.activeElement !== gi) gi.value = S.goal != null ? fmtKg(S.goal) : '';

  $$('#theme-seg button').forEach(b => b.classList.toggle('on', b.dataset.themeOpt === S.theme));
  $('#last-backup').textContent = S.lastBackup ? `Última copia: ${fmtD(F.dayMonYear, S.lastBackup)}` : 'Aún no has hecho ninguna copia.';
  $('#version').innerHTML = isNative()
    ? `Tracking ${APP_VERSION} · app Android<br>Tus datos se guardan en este móvil y entran en la copia de seguridad de Android (cuenta de Google), si la tienes activada.`
    : `Tracking ${APP_VERSION}<br>Tus datos se guardan solo en este dispositivo.`;
}

/* ================= Añadir / editar ================= */
const addForm = $('#sheet-add');
const kgInput = $('#add-kg');
const dateInput = $('#add-date');
let editing = null;

function setDateLabel() {
  const d = dateInput.value || todayISO();
  $('#add-date-label').textContent = d === todayISO() ? `Hoy · ${fmtD(F.wdDayMon, d)}` : cap(fmtD(F.longDate, d));
}
function showError(msg) {
  const e = $('#add-error');
  e.textContent = msg; e.hidden = !msg;
  if (msg) { const w = $('.weight-input'); w.classList.remove('shake'); void w.offsetWidth; w.classList.add('shake'); }
}
function openAdd() {
  editing = null;
  $('#add-title').textContent = 'Añadir peso';
  kgInput.value = '';
  dateInput.value = todayISO();
  dateInput.max = todayISO();
  dateInput.hidden = true;
  $('#add-date-btn').hidden = false;
  $('#add-delete').hidden = true;
  showError('');
  setDateLabel();
  openSheet(addForm);
  kgInput.focus();
}
function openEdit(date) {
  const e = entries.find(x => x.date === date);
  if (!e) return;
  editing = date;
  $('#add-title').textContent = 'Editar registro';
  kgInput.value = fmtKg(e.kg);
  dateInput.value = date;
  dateInput.max = todayISO();
  dateInput.hidden = false;
  $('#add-date-btn').hidden = true;
  $('#add-delete').hidden = false;
  showError('');
  setDateLabel();
  openSheet(addForm);
}
$('#fab').addEventListener('click', openAdd);
$('#add-date-btn').addEventListener('click', () => {
  dateInput.hidden = false;
  $('#add-date-btn').hidden = true;
  try { dateInput.showPicker && dateInput.showPicker(); } catch (_) { dateInput.focus(); }
});
dateInput.addEventListener('change', setDateLabel);
dateInput.addEventListener('input', setDateLabel);
kgInput.addEventListener('input', () => {
  // Solo números y un separador decimal
  const v = kgInput.value.replace(/[^\d.,]/g, '');
  if (v !== kgInput.value) kgInput.value = v;
  showError('');
});

let saving = false;
addForm.addEventListener('submit', async ev => {
  ev.preventDefault();
  if (saving) return;
  const kg = parseKg(kgInput.value);
  if (isNaN(kg)) return showError('Escribe el peso, por ejemplo 83,5');
  if (kg < 30 || kg > 300) return showError('El peso debe estar entre 30 y 300 kg');
  const date = dateInput.value || todayISO();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return showError('Fecha no válida');
  if (date > todayISO()) return showError('La fecha no puede ser futura');
  saving = true;
  try {
    const others = entries.filter(e => e.date !== editing);
    const prev = [...others].reverse().find(e => e.date < date);
    if (prev && Math.abs(kg - prev.kg) > 2) {
      const ok = await ask({
        title: '¿Seguro que es correcto?',
        message: `${fmtKg(kg)} kg es ${fmtKg(Math.abs(kg - prev.kg))} kg ${kg > prev.kg ? 'más' : 'menos'} que tu registro anterior (${fmtKg(prev.kg)} kg, ${fmtD(F.dayMonYear, prev.date)}).`,
        ok: 'Sí, guardar', cancel: 'Corregir',
      });
      if (!ok) { kgInput.focus(); kgInput.select(); return; }
    }
    const existing = others.find(e => e.date === date);
    if (existing && existing.kg !== kg) {
      const ok = await ask({
        title: date === todayISO() ? 'Ya hay un peso para hoy' : 'Ya hay un peso ese día',
        message: `El ${fmtD(F.dayMonYear, date)} tienes ${fmtKg(existing.kg)} kg. ¿Lo sustituyo por ${fmtKg(kg)} kg?`,
        ok: 'Sustituir', cancel: 'Cancelar',
      });
      if (!ok) return;
    }
    if (editing && editing !== date) await removeEntry(editing);
    const before = entries.slice();
    await upsert({ date, kg });
    if (navigator.vibrate) try { navigator.vibrate(18); } catch (_) {}
    const wasEdit = !!editing;
    closeSheet();
    renderAll();
    weightSavedToast(kg, date, wasEdit, before);      // weight-extras.js
  } catch (err) {
    showError('No se pudo guardar. Inténtalo de nuevo.');
  } finally {
    saving = false;
  }
});

$('#add-delete').addEventListener('click', async () => {
  const date = editing;
  closeSheet();
  await deleteWithUndo(date);
});

async function deleteWithUndo(date) {
  const e = entries.find(x => x.date === date);
  if (!e) return;
  await removeEntry(date);
  renderAll();
  toast(`Borrado ${fmtKg(e.kg)} kg del ${fmtD(F.dayMon, date)}`, {
    action: 'Deshacer', ms: 6000,
    onAction: async () => { await upsert(e); renderAll(); toast('Registro restaurado'); },
  });
}

$('#history-list').addEventListener('click', e => {
  const row = e.target.closest('.hist-row');
  if (row) openEdit(row.dataset.date);
});

/* ================= Copias de seguridad ================= */
const backupText = () => entries.map(e => `${isoToDMY(e.date)} ${fmtKg(e.kg)}`).join('\n');

async function markBackup() {
  S.lastBackup = todayISO();
  S.snoozeUntil = null;
  await saveSettings();
  renderBackupBanner();
  renderSettings();
}

function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px';
  document.body.appendChild(ta);
  ta.select();
  ta.setSelectionRange(0, text.length);
  let ok = false;
  try { ok = document.execCommand('copy'); } catch (_) {}
  ta.remove();
  return ok;
}

async function copyAll() {
  if (!entries.length) return toast('No hay registros que copiar');
  const text = backupText();
  let ok = false;
  try { await navigator.clipboard.writeText(text); ok = true; } catch (_) { ok = legacyCopy(text); }
  if (ok) { toast(`Copiado · ${entries.length} registros`); markBackup(); }
  else toast('No se pudo copiar');
}

/* ----- App nativa (Android con Capacitor) ----- */
const isNative = () => !!(window.Capacitor && typeof window.Capacitor.isNativePlatform === 'function' && window.Capacitor.isNativePlatform());
const nativeCall = (plugin, method, opts) => window.Capacitor.nativePromise(plugin, method, opts || {});
const AUTO_FILE = 'tracking-auto.json';
let autoTimer = 0;
let dbReady = false;

function backupData() {
  const gym = typeof gymBackupData === 'function' ? gymBackupData() : {};
  const diet = typeof dietBackupData === 'function' ? dietBackupData() : {};
  return {
    app: 'tracking', version: 3, exported: new Date().toISOString(),
    entries,
    settings: { goal: S.goal, height: S.height, rest: S.rest, bar: S.bar, sex: S.sex, birth: S.birth, age: S.age, activity: S.activity, goalType: S.goalType, dietGoal: S.dietGoal },
    ...gym, ...diet, ...(typeof bodyBackupData === 'function' ? bodyBackupData() : {}),
  };
}
const hasData = d => !!(d.entries.length || (d.workouts && d.workouts.length) || (d.routines && d.routines.length) || (d.diets && d.diets.length) || (d.customFoods && d.customFoods.length) || (d.measures && d.measures.length));

// Copia automática: en la app nativa se guarda un archivo con todo en la carpeta privada de la app.
// Android incluye esa carpeta en la copia de seguridad de la cuenta de Google del móvil.
function scheduleAutoBackup() {
  if (!isNative() || !dbReady) return;
  clearTimeout(autoTimer);
  autoTimer = setTimeout(writeAutoBackup, 4000);
}
async function writeAutoBackup() {
  clearTimeout(autoTimer); autoTimer = 0;
  if (!isNative() || !dbReady) return;
  try {
    const d = backupData();
    if (!hasData(d)) return;
    await nativeCall('Filesystem', 'writeFile', { path: AUTO_FILE, data: JSON.stringify(d), directory: 'DATA', encoding: 'utf8' });
  } catch (e) { console.warn('Copia automática:', e); }
}
async function offerAutoRestore() {
  if (!isNative() || hasData(backupData())) return;
  try {
    const r = await nativeCall('Filesystem', 'readFile', { path: AUTO_FILE, directory: 'DATA', encoding: 'utf8' });
    if (r && r.data) await importJSON(r.data, 'He encontrado una copia automática de tus datos. ');
  } catch (_) { /* no hay copia */ }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden' && autoTimer) writeAutoBackup(); });

async function exportFile() {
  const data = backupData();
  if (!hasData(data)) return toast('No hay datos que exportar');
  const name = `tracking-${todayISO()}.json`;
  const text = JSON.stringify(data);
  if (isNative()) {
    try {
      const w = await nativeCall('Filesystem', 'writeFile', { path: name, data: text, directory: 'CACHE', encoding: 'utf8' });
      await nativeCall('Share', 'share', { title: 'Copia de Tracking', dialogTitle: 'Guardar o enviar la copia', files: [w.uri] });
      toast('Copia exportada');
      markBackup();
    } catch (e) {
      if (!/cancel/i.test(String((e && e.message) || e))) toast('No se pudo exportar la copia');
    }
    return;
  }
  const blob = new Blob([text], { type: 'application/json' });
  try {
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare && navigator.canShare({ files: [file] }) && /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
      await navigator.share({ files: [file], title: 'Copia de Tracking' });
      toast('Copia exportada');
      markBackup();
      return;
    }
  } catch (e) {
    if (e && e.name === 'AbortError') return;
  }
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  toast('Archivo descargado');
  markBackup();
}

function parseBackup(text) {
  const map = new Map();
  const errors = [];
  text.split(/\r?\n/).forEach((line, i) => {
    const l = line.trim();
    if (!l) return;
    const m = l.match(/^(\d{1,2})[-\/.](\d{1,2})[-\/.](\d{4})[\s;,\t]+(\d{1,3}(?:[.,]\d{1,2})?)\s*(?:kg)?$/i);
    if (!m) { errors.push({ n: i + 1, l }); return; }
    const iso = `${m[3]}-${pad2(m[2])}-${pad2(m[1])}`;
    const kg = parseKg(m[4]);
    const valid = +m[2] >= 1 && +m[2] <= 12 && idxToISO(isoToIdx(iso)) === iso;
    if (!valid || isNaN(kg) || kg < 30 || kg > 300) { errors.push({ n: i + 1, l }); return; }
    map.set(iso, kg);
  });
  const items = [...map].map(([date, kg]) => ({ date, kg })).sort((a, b) => (a.date < b.date ? -1 : 1));
  return { items, errors };
}

let pendingImport = null;
const esc = s => s.replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function openImport(text = '') {
  $('#import-text').value = text;
  $('#import-preview').hidden = true;
  $('#import-actions-check').hidden = false;
  $('#import-actions-apply').hidden = true;
  pendingImport = null;
  openSheet($('#sheet-import'));
  if (text) checkImport();
  else setTimeout(() => $('#import-text').focus(), 280);
}

function checkImport() {
  const { items, errors } = parseBackup($('#import-text').value);
  const prev = $('#import-preview');
  prev.hidden = false;
  if (!items.length) {
    prev.innerHTML = `<b class="err">No he encontrado ningún registro válido.</b><div class="sub">Cada línea debe ser como: 21-02-2026 88,8</div>`;
    $('#import-actions-apply').hidden = true;
    $('#import-actions-check').hidden = false;
    pendingImport = null;
    return;
  }
  const cur = new Map(entries.map(e => [e.date, e.kg]));
  let nuevos = 0, iguales = 0, distintos = 0;
  items.forEach(it => { if (!cur.has(it.date)) nuevos++; else if (cur.get(it.date) === it.kg) iguales++; else distintos++; });
  let html = `<b>${items.length} registros válidos</b> (${fmtD(F.dayMonYear, items[0].date)} → ${fmtD(F.dayMonYear, items[items.length - 1].date)})<ul>`;
  html += `<li>${nuevos} nuevos</li>`;
  if (entries.length) html += `<li>${iguales} ya los tenías</li><li>${distintos} con un peso distinto al tuyo${distintos ? ' (se usará el importado)' : ''}</li>`;
  html += '</ul>';
  if (errors.length) {
    html += `<div class="err" style="margin-top:8px">${errors.length} ${errors.length === 1 ? 'línea no se entiende y se ignorará' : 'líneas no se entienden y se ignorarán'}:</div><ul class="err">`;
    errors.slice(0, 3).forEach(e => { html += `<li>Línea ${e.n}: «${esc(e.l.slice(0, 40))}»</li>`; });
    html += '</ul>';
  }
  prev.innerHTML = html;
  pendingImport = items;
  $('#import-actions-check').hidden = true;
  $('#import-actions-apply').hidden = false;
  $('#import-merge').textContent = entries.length ? 'Combinar con mis datos' : `Importar ${items.length} registros`;
  $('#import-replace').hidden = !entries.length;
  document.activeElement && document.activeElement.blur && document.activeElement.blur();
}

$('#import-check').addEventListener('click', checkImport);
$('#import-text').addEventListener('input', () => {
  if (pendingImport) {
    pendingImport = null;
    $('#import-preview').hidden = true;
    $('#import-actions-check').hidden = false;
    $('#import-actions-apply').hidden = true;
  }
});
$('#import-merge').addEventListener('click', async () => {
  if (!pendingImport) return;
  const items = pendingImport;
  await DB.putEntries(items);
  const map = new Map(entries.map(e => [e.date, e]));
  items.forEach(it => map.set(it.date, it));
  entries = [...map.values()];
  sortEntries();
  closeSheet();
  renderAll();
  showTab('peso'); showPesoView('resumen');
  toast(`Importados ${items.length} registros`);
});
$('#import-replace').addEventListener('click', async () => {
  if (!pendingImport) return;
  const items = pendingImport;
  const ok = await ask({
    title: '¿Reemplazar todos tus datos?',
    message: `Se borrarán tus ${entries.length} registros actuales y se quedarán solo los ${items.length} importados.`,
    ok: 'Reemplazar', cancel: 'Cancelar', danger: true,
  });
  if (!ok) return;
  await DB.replaceEntries(items);
  entries = items.slice();
  sortEntries();
  closeSheet();
  renderAll();
  showTab('peso'); showPesoView('resumen');
  toast(`Datos reemplazados · ${items.length} registros`);
});

const fileInput = $('#file-input');
fileInput.addEventListener('change', async () => {
  const f = fileInput.files && fileInput.files[0];
  fileInput.value = '';
  if (!f) return;
  try {
    const text = await f.text();
    const head = text.trimStart();
    if (head.startsWith('{')) await importJSON(text);
    else if (/exercise_title/i.test(head.split(/\r?\n/, 1)[0])) gymHevyImport(text);
    else openImport(text);
  } catch (_) { toast('No se pudo leer el archivo'); }
});

async function importJSON(text, intro = '') {
  let d;
  try { d = JSON.parse(text); } catch (_) { return toast('El archivo no es una copia válida'); }
  if (!d || d.app !== 'tracking') return toast('El archivo no es una copia de Tracking');
  const ents = (d.entries || []).filter(e => e && /^\d{4}-\d{2}-\d{2}$/.test(e.date) && typeof e.kg === 'number');
  const n = k => (Array.isArray(d[k]) ? d[k].length : 0);
  const ok = await ask({
    title: 'Importar copia',
    message: `${intro}Copia del ${d.exported ? fmtD(F.dayMonYear, d.exported.slice(0, 10)) : '¿?'}: ${ents.length} pesos, ${n('workouts')} entrenos, ${n('routines')} rutinas y ${n('diets')} dietas. Se combinará con lo que ya tienes (si algo coincide, gana la copia).`,
    ok: 'Importar', cancel: 'Cancelar',
  });
  if (!ok) return;
  await DB.putEntries(ents);
  const map = new Map(entries.map(e => [e.date, e]));
  ents.forEach(e => map.set(e.date, e));
  entries = [...map.values()];
  sortEntries();
  const st = d.settings || {};
  if (S.goal == null && st.goal != null) S.goal = st.goal;
  if (S.height == null && st.height != null) S.height = st.height;
  if (st.rest) S.rest = st.rest;
  if (st.bar) S.bar = st.bar;
  await saveSettings();
  if (typeof gymImportBackup === 'function') await gymImportBackup(d);
  if (typeof dietImportBackup === 'function') await dietImportBackup(d);
  if (typeof bodyImportBackup === 'function') await bodyImportBackup(d);
  await saveSettings();
  renderAll();
  toast('Copia importada');
}

async function wipeAll() {
  const ok1 = await ask({ title: '¿Borrar todos los datos?', message: `Se borrarán tus pesos, entrenos, rutinas, ejercicios y ajustes de este móvil.`, ok: 'Continuar', cancel: 'Cancelar', danger: true });
  if (!ok1) return;
  const ok2 = await ask({ title: '¿Seguro del todo?', message: 'Esto no se puede deshacer. Si no tienes copia, perderás tu historial.', ok: 'Borrar todo', cancel: 'No, volver', danger: true });
  if (!ok2) return;
  await DB.replaceEntries([]);
  entries = [];
  if (typeof gymWipe === 'function') await gymWipe();
  if (typeof dietWipe === 'function') await dietWipe();
  if (typeof bodyWipe === 'function') await bodyWipe();
  if (isNative()) { clearTimeout(autoTimer); autoTimer = 0; try { await nativeCall('Filesystem', 'deleteFile', { path: AUTO_FILE, directory: 'DATA' }); } catch (_) {} }
  S = { ...DEFAULTS, theme: S.theme, firstUse: todayISO() };
  S.dietGoal = JSON.parse(JSON.stringify(DEFAULTS.dietGoal));
  await saveSettings();
  renderAll();
  showTab('inicio');
  toast('Datos borrados');
}

/* ================= Acciones con data-* ================= */
document.addEventListener('click', e => {
  const a = e.target.closest('[data-action]');
  if (a) {
    const act = a.dataset.action;
    if (act === 'copy') copyAll();
    else if (act === 'add-weight') openAdd();
    else if (act === 'start-workout') gymStartMenu();
    else if (act === 'export') exportFile();
    else if (act === 'import-file') fileInput.click();
    else if (act === 'import-text') openImport();
    else if (act === 'wipe') wipeAll();
    return;
  }
  const g = e.target.closest('[data-goto]');
  if (g) showTab(g.dataset.goto);
});

$('#backup-now').addEventListener('click', exportFile);
$('#backup-later').addEventListener('click', async () => {
  S.snoozeUntil = idxToISO(isoToIdx(todayISO()) + 3);
  await saveSettings();
  renderBackupBanner();
  toast('Te lo recordaré en 3 días');
});

/* ================= Ajustes ================= */
$('#goal-input').addEventListener('change', async e => {
  const v = e.target.value.trim();
  if (!v) { S.goal = null; await saveSettings(); renderAll(); toast('Objetivo quitado'); return; }
  const kg = parseKg(v);
  if (isNaN(kg) || kg < 30 || kg > 300) { toast('Objetivo no válido'); renderSettings(); return; }
  S.goal = kg;
  await saveSettings();
  renderAll();
  toast(`Objetivo: ${fmtKg(kg)} kg`);
});
// La altura se pinta dentro del Perfil (diet.js), así que se escucha por delegación.
document.addEventListener('change', async e => {
  if (e.target.id !== 'height-input') return;
  const v = e.target.value.trim();
  if (!v) { S.height = null; await saveSettings(); renderAll(); return; }
  const cm = Math.round(parseFloat(v.replace(',', '.')));
  if (isNaN(cm) || cm < 100 || cm > 250) { toast('La altura debe estar entre 100 y 250 cm'); renderAll(); return; }
  S.height = cm;
  await saveSettings();
  renderAll();
});
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target.matches && e.target.matches('#tab-ajustes input[type="text"]')) e.target.blur(); });

const mqLight = matchMedia('(prefers-color-scheme: light)');
function applyTheme() {
  const t = S.theme === 'auto' ? (mqLight.matches ? 'light' : 'dark') : S.theme;
  document.documentElement.dataset.theme = t;
  const bg = getComputedStyle(document.documentElement).getPropertyValue('--bg').trim();
  $('meta[name="theme-color"]').setAttribute('content', bg);
  try { localStorage.setItem('tracking-theme', S.theme); } catch (_) {}
  chart && chart.request();
  fsChart && fsChart.request();
}
mqLight.addEventListener && mqLight.addEventListener('change', applyTheme);
$$('#theme-seg button').forEach(b => b.addEventListener('click', async () => {
  S.theme = b.dataset.themeOpt;
  applyTheme();
  renderSettings();
  await saveSettings();
}));

/* ================= Gráfico: filtros y pantalla completa ================= */
$$('#avg-seg button').forEach(b => b.addEventListener('click', async () => {
  S.avg = b.dataset.avg;
  renderAverages();
  await saveSettings();
}));

function openFullscreen() {
  if (!entries.length) return;
  const fs = $('#fs');
  fs.hidden = false;
  lockBody();
  fsChart.setData(chartPoints(), S.goal);
  fsChart.view = [...chart.view];
  fsRangesSync();
  fsChart.yView = null;
  fsChart.onYMode && fsChart.onYMode(true);
  fsChart.resize();
  pushLayer(() => {
    fs.hidden = true;
    unlockBody();
  });
}
$('#fs-close').addEventListener('click', () => popLayer());
$('#fs-auto').addEventListener('click', () => fsChart.setYAuto(!!fsChart.yView));

/* ================= Teclado en iOS (paneles sobre el teclado) ================= */
if (window.visualViewport) {
  const vv = window.visualViewport;
  const f = () => {
    const kb = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
    document.documentElement.style.setProperty('--kb', kb + 'px');
  };
  vv.addEventListener('resize', f);
  vv.addEventListener('scroll', f);
}

/* ================= Actualizaciones (service worker) ================= */
function setupSW() {
  if (!('serviceWorker' in navigator)) return;
  let refreshing = false;
  // Solo se recarga al actualizar; en la primera instalación no había versión anterior que sustituir.
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing || !hadController) return;
    refreshing = true;
    location.reload();
  });
  navigator.serviceWorker.register('./sw.js').then(reg => {
    const show = w => {
      $('#update-banner').hidden = false;
      $('#update-btn').onclick = () => { $('#update-btn').textContent = 'Actualizando…'; w.postMessage('skipWaiting'); };
    };
    if (reg.waiting && navigator.serviceWorker.controller) show(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const w = reg.installing;
      if (!w) return;
      w.addEventListener('statechange', () => {
        if (w.state === 'installed' && navigator.serviceWorker.controller) show(w);
      });
    });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') reg.update().catch(() => {}); });
  }).catch(() => {});
}

/* ================= Arranque ================= */
async function init() {
  chart = new WeightChart($('#chart'), { onTap: openFullscreen });
  fsChart = new WeightChart($('#fs-canvas'), { interactive: true });
  fsChart.onYMode = auto => $('#fs-auto').classList.toggle('on', auto);
  try {
    await DB.open();
    const [list, st] = await Promise.all([DB.allEntries(), DB.getSettings()]);
    entries = (list || []).filter(e => e && e.date && typeof e.kg === 'number');
    sortEntries();
    S = { ...DEFAULTS, ...(st || {}) };
    if (!S.dietGoal || !S.dietGoal.train || !S.dietGoal.rest) S.dietGoal = DEFAULTS.dietGoal;
    S.dietGoal = JSON.parse(JSON.stringify(S.dietGoal));       // copia propia: no tocar los valores por defecto
    if (!S.firstUse) { S.firstUse = todayISO(); await saveSettings(); }
    await gymLoad();
    await dietLoad();
    await bodyLoad();
    dbReady = true;
  } catch (err) {
    console.error(err);
    toast('No se puede guardar en este navegador (¿modo privado?)', { ms: 8000 });
  }
  applyTheme();
  showPesoView(S.pesoView || 'resumen');
  renderAll();
  offerAutoRestore();
  // Pide al navegador que no borre los datos para liberar espacio.
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  setupSW();
}

// Si cambia el día con la app abierta, refresca "Hoy" y el gráfico.
let lastDay = todayISO();
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && todayISO() !== lastDay) { lastDay = todayISO(); renderAll(); }
});

// Arranca cuando todos los scripts (gym.js, diet.js…) ya están cargados.
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
