/* Lógica pura del descanso para poder pausar, reanudar y reiniciar también sin conexión. */
'use strict';

(() => {
  function start(active, seconds, now, stopwatch) {
    active.restPaused = false;
    active.restRemaining = 0;
    active.restElapsed = 0;
    active.restTotal = seconds;
    active.restEnd = stopwatch ? 0 : now + seconds * 1000;
    active.restStart = stopwatch ? now : 0;
    return active;
  }

  function pause(active, now, stopwatch) {
    if (active.restPaused) return active;
    if (stopwatch && active.restStart) {
      active.restElapsed = (active.restElapsed || 0) + Math.max(0, now - active.restStart) / 1000;
      active.restStart = 0;
    } else if (active.restEnd) {
      active.restRemaining = Math.max(0, active.restEnd - now) / 1000;
      active.restEnd = 0;
    } else return active;
    active.restPaused = true;
    return active;
  }

  function resume(active, now, stopwatch) {
    if (!active.restPaused) return active;
    if (stopwatch) active.restStart = now;
    else active.restEnd = now + (active.restRemaining || 0) * 1000;
    active.restPaused = false;
    return active;
  }

  function toggle(active, now, stopwatch) {
    return active.restPaused ? resume(active, now, stopwatch) : pause(active, now, stopwatch);
  }

  function reset(active, now, stopwatch) {
    active.restPaused = false;
    active.restRemaining = 0;
    active.restElapsed = 0;
    active.restEnd = stopwatch ? 0 : now + (active.restTotal || 0) * 1000;
    active.restStart = stopwatch ? now : 0;
    return active;
  }

  function adjust(active, deltaSeconds, now) {
    if (active.restPaused) active.restRemaining = Math.max(1, (active.restRemaining || 0) + deltaSeconds);
    else if (active.restEnd) active.restEnd = Math.max(now + 1000, active.restEnd + deltaSeconds * 1000);
    active.restTotal = Math.max(1, (active.restTotal || 1) + deltaSeconds);
    return active;
  }

  function stop(active) {
    active.restEnd = 0;
    active.restStart = 0;
    active.restRemaining = 0;
    active.restElapsed = 0;
    active.restPaused = false;
    return active;
  }

  function read(active, now, stopwatch) {
    if (active.restPaused) return { seconds: stopwatch ? active.restElapsed || 0 : active.restRemaining || 0, fraction: 0 };
    if (stopwatch) return { seconds: (active.restElapsed || 0) + Math.max(0, now - (active.restStart || now)) / 1000, fraction: 1 };
    const seconds = Math.max(0, (active.restEnd - now) / 1000);
    return { seconds, fraction: Math.min(1, seconds / (active.restTotal || 1)) };
  }

  window.GymRest = Object.freeze({ start, pause, resume, toggle, reset, adjust, stop, read });
})();
