// Claude: comprueba que cada tecnicismo registrado tenga una explicación breve.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';

const source = await readFile(new URL('../ui-info-hints.js', import.meta.url), 'utf8');
const module = { exports: {} };
vm.runInNewContext(source, { module, globalThis: {}, document: undefined, window: undefined });
const hints = module.exports;

test('reconoce metabolismo basal, GET y ajuste aunque el texto lleve tildes', () => {
  assert.equal(hints.hintFor('Metabolismo basal (TMB)'), 'tmb');
  assert.equal(hints.hintFor('Gasto total (GET) real'), 'get');
  assert.equal(hints.hintFor('Ajuste sobre el GET'), 'adjustment');
});

test('ofrece explicaciones breves para términos del entrenamiento', () => {
  assert.equal(hints.hintFor('1RM estimado'), 'oneRm');
  assert.equal(hints.hintFor('Volumen de la sesión'), 'volume');
  assert.equal(hints.hintFor('Superserie'), 'superset');
  assert.ok(hints.explanations.oneRm.includes('orientativo'));
});
