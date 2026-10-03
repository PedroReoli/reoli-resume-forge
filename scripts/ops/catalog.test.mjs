import assert from 'node:assert/strict';
import test from 'node:test';
import { directActions, normalizeDirectAction } from './catalog.mjs';

test('mantém Tauri Dev como ação direta padrão de desenvolvimento', () => {
  assert.equal(normalizeDirectAction('dev'), 'dev');
  assert.equal(normalizeDirectAction('tauri'), 'dev');
  assert.equal(normalizeDirectAction('--ui'), 'dev');
});

test('aceita apenas aliases declarados no catálogo', () => {
  assert.equal(normalizeDirectAction('BUILD'), 'build-release');
  assert.equal(normalizeDirectAction('installer'), 'build-installer');
  assert.equal(normalizeDirectAction(' desconhecido '), null);
  assert.ok(Object.isFrozen(directActions));
});
