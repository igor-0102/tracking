/* Tracking · funciones de la app Android: notificación del entreno (con botón «Hecha»),
   recordatorio diario para pesarse y widget de peso. En la versión web no hace nada. */
'use strict';

const TN = 'TrackingNative';
const LN = 'LocalNotifications';
const REMINDER_ID = 1001;
const hasPlugin = name => isNative() && typeof window.Capacitor.isPluginAvailable === 'function' && window.Capacitor.isPluginAvailable(name);
function callNative(plugin, method, opts) {
  return nativeCall(plugin, method, opts).catch(e => { console.warn(`${plugin}.${method}:`, e); return null; });
}
function whenReady(fn) {
  if (dbReady) fn(); else setTimeout(() => whenReady(fn), 250);
}

/* ================= Notificación del entreno ================= */
function workoutTarget() {
  const a = G.active;
  if (!a) return null;
  const n = a.next;
  if (n && a.exercises[n[0]] && a.exercises[n[0]].sets[n[1]] && !a.exercises[n[0]].sets[n[1]].done) return { ex: a.exercises[n[0]], ei: n[0], si: n[1] };
  for (let ei = 0; ei < a.exercises.length; ei++) {
    const si = a.exercises[ei].sets.findIndex(s => !s.done);
    if (si >= 0) return { ex: a.exercises[ei], ei, si };
  }
  return null;
}
const setValues = s => ({ kg: s.kg ?? (s.ph ? s.ph.kg : null), reps: s.reps ?? (s.ph ? s.ph.reps : null) });

function workoutPayload() {
  const a = G.active, t = workoutTarget();
  const all = a.exercises.flatMap(e => e.sets), done = all.filter(s => s.done).length;
  const resting = a.restEnd > Date.now();
  const sub = `${a.title || 'Entreno'} · ${done}/${all.length} series${resting ? ' · descanso' : ''}`;
  if (!t) return { title: '¡Todas las series hechas!', text: 'Abre Tracking para terminar el entreno.', sub, startMs: a.start, restEndMs: 0, restStartMs: 0, canCheck: false };
  const v = setValues(t.ex.sets[t.si]);
  const prev = (prevSetsFor(t.ex.exId, a.id) || [])[t.si];
  const parts = [];
  if (v.kg != null || v.reps != null) parts.push(`Toca: ${fmtSet({ kg: v.kg || 0, reps: v.reps || 0 })}`);
  parts.push(prev ? `Anterior: ${fmtSet(prev)}` : 'Sin datos de la última sesión');
  return {
    title: `${exName(t.ex.exId)} · ${t.ex.sets[t.si].type === 'warmup' ? 'Calentamiento' : `Serie ${setLabel(t.ex, t.si)} de ${t.ex.sets.length}`}`,
    text: parts.join(' · '), sub,
    startMs: a.start, restEndMs: resting ? a.restEnd : 0, restStartMs: a.restStart || 0,
    canCheck: v.kg != null || v.reps != null,
  };
}

let lastWorkoutSig = '';
function nativeWorkoutSync() {
  if (!hasPlugin(TN)) return;
  if (!G.active) {
    if (lastWorkoutSig && lastWorkoutSig !== 'none') callNative(TN, 'workoutClear');
    lastWorkoutSig = 'none';
    return;
  }
  if (!S.notifAsked) { S.notifAsked = true; saveSettings(); callNative(TN, 'requestNotifications'); }
  const p = workoutPayload();
  const sig = JSON.stringify(p);
  if (sig === lastWorkoutSig) return;
  lastWorkoutSig = sig;
  callNative(TN, 'workoutShow', p);
}
setInterval(nativeWorkoutSync, 1000);

// Botón «Hecha» de la notificación: marca la serie que toca (también si se pulsó con la app cerrada).
async function applyPendingChecks() {
  if (!hasPlugin(TN) || !G.active) return;
  const r = await callNative(TN, 'consumePendingChecks');
  const n = (r && r.n) || 0;
  for (let i = 0; i < n; i++) {
    const t = workoutTarget();
    if (!t) break;
    const v = setValues(t.ex.sets[t.si]);
    if (v.kg == null && v.reps == null) break;
    if (!wkPage) { wkData = G.active; wkMode = 'active'; }
    checkSet(t.ex, t.ei, t.si, null, false);
  }
  nativeWorkoutSync();
}

/* ================= Acciones al abrir la app (widget, recordatorio) ================= */
async function applyLaunchAction() {
  if (!hasPlugin(TN)) return;
  const r = await callNative(TN, 'consumeLaunchAction');
  if (r && r.action === 'add-weight') openAdd();
}

/* ================= Widget de peso ================= */
let lastWidgetSig = '';
function nativeWidgetSync() {
  if (!hasPlugin(TN) || !entries.length) return;
  const n = entries.length, last = entries[n - 1];
  const data = { kg: `${fmtKg(last.kg)} kg`, sub: `${cap(fmtD(F.wdDayMon, last.date))} · media 7 días ${fmt1(D.trend[n - 1])}` };
  const sig = JSON.stringify(data);
  if (sig === lastWidgetSig) return;
  lastWidgetSig = sig;
  callNative(TN, 'setWidget', data);
}
function nativeAfterRender() {
  nativeWidgetSync();
  renderReminder();
}

/* ================= Recordatorio diario para pesarse ================= */
const reminder = () => S.reminder || { on: false, time: '08:00' };
function renderReminder() {
  const box = $('#reminder-box');
  if (!box) return;
  if (!hasPlugin(LN)) { box.innerHTML = ''; return; }
  const r = reminder();
  box.innerHTML = `<button class="card quick" data-rem="open">
    <div><div class="label">🔔 Recordatorio para pesarte</div><div class="quick-val">${r.on ? `Cada día a las ${esc(r.time)}` : 'Desactivado'}</div></div>${chevIcon}
  </button>`;
}
async function scheduleReminder(r) {
  await callNative(LN, 'cancel', { notifications: [{ id: REMINDER_ID }] });
  if (!r.on) return true;
  const perm = await callNative(LN, 'requestPermissions');
  if (!perm || perm.display !== 'granted') return false;
  const [hour, minute] = r.time.split(':').map(Number);
  const res = await callNative(LN, 'schedule', { notifications: [{
    id: REMINDER_ID, title: 'Tracking', body: 'Es hora de pesarte ⚖️',
    schedule: { on: { hour, minute }, allowWhileIdle: true },
    extra: { action: 'add-weight' },
  }] });
  return !!res;
}
function openReminderSheet() {
  const r = reminder();
  genSheet.innerHTML = `<div class="grabber"></div><h2>Recordatorio para pesarte</h2>
    <div class="card form-card">
      <label class="field"><span>Activado</span><input type="checkbox" class="switch" id="rem-on" ${r.on ? 'checked' : ''}></label>
      <label class="field"><span>Hora</span><input type="time" id="rem-time" class="date-inline" value="${esc(r.time)}"></label>
    </div>
    <p class="fine">Te llegará una notificación cada día a esa hora; al tocarla se abre «Añadir peso». En Xiaomi, si no llega, quita la restricción de batería a Tracking (Ajustes → Aplicaciones → Tracking → Ahorro de batería → Sin restricciones).</p>
    <button class="btn btn-primary btn-block btn-big" id="rem-ok">Guardar</button>`;
  genSheet.onclick = async e => {
    if (!e.target.closest('#rem-ok')) return;
    const next = { on: $('#rem-on', genSheet).checked, time: $('#rem-time', genSheet).value || '08:00' };
    const ok = await scheduleReminder(next);
    if (!ok) { toast('Necesito permiso de notificaciones para el recordatorio'); return; }
    S.reminder = next;
    await saveSettings();
    closeSheet();
    renderReminder();
    toast(next.on ? `Recordatorio a las ${next.time}` : 'Recordatorio desactivado');
  };
  openSheet(genSheet, () => { genSheet.onclick = null; });
}
document.addEventListener('click', e => { if (e.target.closest('[data-rem="open"]')) openReminderSheet(); });

/* ================= Arranque ================= */
if (hasPlugin(TN)) {
  window.Capacitor.addListener(TN, 'workoutCheck', () => whenReady(applyPendingChecks));
  window.Capacitor.addListener(TN, 'launchAction', () => whenReady(applyLaunchAction));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') whenReady(() => { applyPendingChecks(); applyLaunchAction(); });
  });
  whenReady(() => { applyPendingChecks(); applyLaunchAction(); nativeAfterRender(); });
}
if (hasPlugin(LN)) {
  window.Capacitor.addListener(LN, 'localNotificationActionPerformed', ev => {
    const extra = ev && ev.notification && ev.notification.extra;
    if (extra && extra.action === 'add-weight') whenReady(openAdd);
  });
}
