/* Tracking · extras del peso: celebración al acercarte a tu objetivo y exportar los pesos a Excel.
   (Entregado por Codex; Claude lo sacó de app.js, que ya supera las 800 líneas.)
   El archivo .xlsx lo genera weight-xlsx.js. */
'use strict';

/* ---------- Celebración: nuevo peso más cerca del objetivo que cualquier registro anterior ---------- */
function closerToGoal(kg, goal, history) {
  if (!(goal > 0) || !history.length) return false;
  const previous = Math.min(...history.map(e => Math.abs(e.kg - goal)));
  return Math.abs(kg - goal) < previous - 0.005;
}
function celebrateGoalProgress() {
  const hero = $('#summary .hero');
  if (!hero) return;
  hero.classList.remove('goal-celebrate');
  void hero.offsetWidth;      // reinicia la animación
  hero.classList.add('goal-celebrate');
  setTimeout(() => hero.classList.remove('goal-celebrate'), 1500);
}
// Aviso tras guardar un peso. before: registros que había antes de guardar.
function weightSavedToast(kg, date, wasEdit, before) {
  const progress = !wasEdit && closerToGoal(kg, S.goal, before.filter(e => e.date !== date));
  if (!progress) { toast(wasEdit ? 'Registro actualizado' : `Guardado: ${fmtKg(kg)} kg`); return; }
  celebrateGoalProgress();
  toast(`🎉 ¡Nuevo peso más cerca de tu objetivo de ${fmtKg(S.goal)} kg!`);
}

/* ---------- Exportar los pesos a Excel ---------- */
async function shareNativeBlob(blob, name) {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  const file = await nativeCall('Filesystem', 'writeFile', { path: name, data: btoa(binary), directory: 'CACHE', encoding: 'base64' });
  await nativeCall('Share', 'share', { title: 'Pesos de Tracking', dialogTitle: 'Guardar o enviar Excel', files: [file.uri] });
}
async function exportWeightExcel() {
  if (!entries.length) return toast('No hay pesos que exportar');
  const blob = createWeightWorkbook(entries);
  const name = `tracking-pesos-${todayISO()}.xlsx`;
  if (isNative()) {
    try { await shareNativeBlob(blob, name); toast('Excel exportado'); }
    catch (e) { if (!/cancel/i.test(String((e && e.message) || e))) toast('No se pudo exportar el Excel'); }
    return;
  }
  const url = URL.createObjectURL(blob), a = document.createElement('a');
  a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
  toast('Excel descargado');
}
document.addEventListener('click', e => { if (e.target.closest('[data-action="export-excel"]')) exportWeightExcel(); });
