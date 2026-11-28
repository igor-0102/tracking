// Claude: asegura que el análisis de sesiones no modifique los registros originales.
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const analysis = require('../gym-dashboard-analysis.js');

test('el resumen excluye calentamientos y calcula volumen, series y duración', () => {
  const workout = { start: 1000, end: 61000, exercises: [
    { sets: [{ kg: 20, reps: 10 }, { kg: 5, reps: 5, type: 'warmup' }] },
    { sets: [{ kg: 30, reps: 8 }] },
  ] };
  assert.deepEqual(analysis.analyzeWorkout(workout, 2), {
    exerciseCount: 2, setCount: 2, volumeKg: 440, durationMs: 60000, recordCount: 2,
  });
});

test('el análisis de ejercicio conserva la marca máxima estimada y compara las dos últimas sesiones', () => {
  const newer = { w: { id: 'new', start: 200 }, ex: { sets: [{ kg: 50, reps: 8 }, { kg: 10, reps: 2, type: 'warmup' }] } };
  const older = { w: { id: 'old', start: 100 }, ex: { sets: [{ kg: 45, reps: 8 }] } };
  const result = analysis.analyzeExercise([older, newer]);
  assert.equal(result.latest.w.id, 'new');
  assert.equal(result.previous.w.id, 'old');
  assert.equal(result.maxWeightKg, 50);
  assert.equal(result.personalBest1RM.kg, 50 * (1 + 8 / 30));
  assert.ok(result.estimated1RMDeltaKg > 0);
  assert.equal(result.recentSetCount, 1);
});

test('un ejercicio de cardio sin carga devuelve métricas seguras y sin RM inventado', () => {
  const result = analysis.analyzeExercise([{ w: { id: 'cardio', start: 1 }, ex: { sets: [{ km: 3, sec: 600 }] } }]);
  assert.equal(result.recentVolumeKg, 0);
  assert.equal(result.recentTopSet, null);
  assert.equal(result.personalBest1RM, null);
});
