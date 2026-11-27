import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import test from 'node:test';
import assert from 'node:assert/strict';

const source = await readFile(new URL('../get-adjustment-help.js', import.meta.url), 'utf8');

function setup() {
  const buttons = [];
  const title = { children: [], appendChild(button) { this.children.push(button); buttons.push(button); } };
  const field = { children: [title], querySelector: selector => selector === '[data-info="get-adjustment"]' ? buttons[0] || null : null };
  const input = { closest: selector => selector === '.field' ? field : null };
  const root = { querySelectorAll: selector => selector === '[data-goal="pct"]' ? [input] : [] };
  const listeners = {};
  let observer;
  const document = {
    querySelector: selector => selector === '#goal-box' ? root : null,
    createElement: tag => ({ tagName: tag, dataset: {}, setAttribute(name, value) { this[name] = value; } }),
    addEventListener: (type, handler, capture) => { listeners[type] = { handler, capture }; },
  };
  class Observer {
    constructor(callback) { this.callback = callback; observer = this; }
    observe(target, options) { this.target = target; this.options = options; }
  }
  const genSheet = {};
  const opened = [];
  vm.runInNewContext(source, {
    document, MutationObserver: Observer, genSheet,
    openSheet: (sheet, onClose) => opened.push({ sheet, onClose }), closeSheet() {},
  });
  return { buttons, field, genSheet, listeners, observer, opened, root };
}

test('inserta un botón i junto al porcentaje incluso después de volver a pintar la dieta', () => {
  const state = setup();
  assert.equal(state.buttons.length, 1);
  assert.equal(state.buttons[0].type, 'button');
  assert.equal(state.buttons[0].dataset.info, 'get-adjustment');
  assert.equal(state.buttons[0].textContent, 'i');
  assert.equal(state.observer.target, state.root);
  assert.equal(state.observer.options.subtree, true);
  state.observer.callback();
  assert.equal(state.buttons.length, 1);
});

test('la ayuda explica el ajuste y limita el consejo del 1% a una referencia deportiva', () => {
  const state = setup();
  const event = {
    target: { closest: selector => selector === '[data-info="get-adjustment"]' ? {} : null },
    preventDefault() { this.prevented = true; },
    stopPropagation() { this.stopped = true; },
    stopImmediatePropagation() { this.immediate = true; },
  };
  state.listeners.click.handler(event);
  assert.equal(state.listeners.click.capture, true);
  assert.ok(event.prevented && event.stopped && event.immediate);
  assert.match(state.genSheet.innerHTML, /déficit/);
  assert.match(state.genSheet.innerHTML, /−10 %/);
  assert.match(state.genSheet.innerHTML, /\+10 %/);
  assert.match(state.genSheet.innerHTML, /0 % lo iguala/);
  assert.match(state.genSheet.innerHTML, /0,5–1 % del peso por semana/);
  assert.match(state.genSheet.innerHTML, /No es universal ni garantiza evitar/);
  assert.match(state.genSheet.innerHTML, /alteraciones hormonales/);
  assert.equal(state.opened.length, 1);
});
