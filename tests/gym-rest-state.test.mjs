// Comprueba pausas, reinicios y ajuste de tiempo con reloj simulado, sin temporizadores reales.
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../gym-rest-state.js', import.meta.url), 'utf8');
const context = vm.createContext({ window: {} });
vm.runInContext(source, context);
const rest = context.window.GymRest;

test('pausar y reanudar conserva el tiempo que quedaba', () => {
  const state = { restTotal: 90 };
  rest.start(state, 90, 1000, false);
  rest.pause(state, 31000, false);
  assert.equal(state.restRemaining, 60);
  assert.equal(state.restEnd, 0);
  rest.resume(state, 80000, false);
  assert.equal(state.restEnd, 140000);
  assert.equal(rest.read(state, 80000, false).seconds, 60);
});

test('el cronómetro también se puede pausar, reanudar y reiniciar', () => {
  const state = {};
  rest.start(state, 0, 1000, true);
  rest.pause(state, 11000, true);
  assert.equal(rest.read(state, 30000, true).seconds, 10);
  rest.resume(state, 50000, true);
  assert.equal(rest.read(state, 55000, true).seconds, 15);
  rest.reset(state, 60000, true);
  assert.equal(rest.read(state, 63000, true).seconds, 3);
});

test('reiniciar y ajustar el temporizador conserva límites mínimos', () => {
  const state = {};
  rest.start(state, 30, 5000, false);
  rest.adjust(state, 15, 5000);
  assert.equal(state.restEnd, 50000);
  assert.equal(state.restTotal, 45);
  rest.pause(state, 10000, false);
  rest.adjust(state, -100, 10000);
  assert.equal(state.restRemaining, 1);
  rest.reset(state, 10000, false);
  assert.equal(state.restEnd, 11000);
  rest.stop(state);
  assert.equal(state.restPaused, false);
  assert.equal(state.restEnd, 0);
});
