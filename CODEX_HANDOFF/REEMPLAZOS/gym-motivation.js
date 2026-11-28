/* Permite apagar los avisos positivos sin ocultar errores, descansos ni notificaciones nativas. */
'use strict';

(() => {
  const enabled = () => S.motivation !== false;
  const weightToast = weightSavedToast;
  const recordToast = livePR;
  weightSavedToast = (...args) => enabled() ? weightToast(...args) : undefined;
  livePR = (...args) => enabled() ? recordToast(...args) : undefined;

  const control = document.querySelector('#set-motivation');
  if (control) {
    const baseSettings = renderGymSettings;
    renderGymSettings = (...args) => { baseSettings(...args); control.checked = enabled(); };
    control.checked = enabled();
    control.addEventListener('change', async () => {
      S.motivation = control.checked;
      await saveSettings();
      toast(control.checked ? 'Avisos motivadores activados' : 'Avisos motivadores desactivados');
    });
  }
  window.GymMotivation = Object.freeze({ enabled });
})();
