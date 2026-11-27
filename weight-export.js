/* Conecta el botón de exportación con el generador XLSX, sin tocar la lógica principal. */
'use strict';

(() => {
  // A calendar check keeps impossible dates out of exported reports even if their shape is ISO-like.
  function isISODate(value) {
    if (typeof value !== 'string') return false;
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!match) return false;
    const [, yearText, monthText, dayText] = match;
    const year = Number(yearText), month = Number(monthText), day = Number(dayText);
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const monthDays = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    return month >= 1 && month <= 12 && day >= 1 && day <= monthDays[month - 1];
  }

  function weightRowsForExport(items) {
    return (Array.isArray(items) ? items : [])
      .filter(item => item && isISODate(item.date) && Number.isFinite(item.kg) && item.kg > 0)
      .map(item => ({ date: item.date, kg: item.kg }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function blobAsBase64(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
      reader.onerror = () => reject(reader.error || new Error('No se pudo preparar el archivo'));
      reader.readAsDataURL(blob);
    });
  }

  function download(blob, name) {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 2000);
  }

  async function exportWeightHistory() {
    const rows = weightRowsForExport(typeof entries === 'undefined' ? [] : entries);
    if (!rows.length) return toast('No hay pesos válidos que exportar');
    const today = typeof todayISO === 'function' ? todayISO() : new Date().toISOString().slice(0, 10);
    const name = `tracking-pesos-${today}.xlsx`;
    const blob = window.createWeightWorkbook(rows);
    if (typeof isNative === 'function' && isNative() && typeof nativeCall === 'function') {
      const file = await nativeCall('Filesystem', 'writeFile', {
        path: name, data: await blobAsBase64(blob), directory: 'CACHE',
      });
      await nativeCall('Share', 'share', {
        title: 'Pesos de Tracking', dialogTitle: 'Guardar o compartir Excel', files: [file.uri],
      });
      return toast('Excel exportado');
    }
    download(blob, name);
    toast('Excel descargado');
  }

  function onExportClick(event) {
    if (!event.target.closest('[data-action="export-excel"]')) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    exportWeightHistory().catch(error => {
      if (!/cancel|abort/i.test(String(error && (error.message || error.name) || error))) toast('No se pudo exportar el Excel');
    });
  }

  window.weightRowsForExport = weightRowsForExport;
  document.addEventListener('click', onExportClick, true);
})();
