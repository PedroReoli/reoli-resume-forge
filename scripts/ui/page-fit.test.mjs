import assert from 'node:assert/strict';
import test from 'node:test';
import { recommendPageFit } from '../../src/domain/pageFit.ts';

test('recomenda mais respiro quando uma página já está compacta', () => {
  const result = recommendPageFit(1, 'compact');

  assert.equal(result.tone, 'concise');
  assert.equal(result.nextDensity, 'balanced');
});

test('considera duas páginas como a faixa ideal sem alterar o layout', () => {
  const result = recommendPageFit(2, 'balanced');

  assert.equal(result.tone, 'ideal');
  assert.equal(result.nextDensity, undefined);
});

test('oferece compactação sem remoção de conteúdo acima da meta', () => {
  const result = recommendPageFit(3, 'relaxed');

  assert.equal(result.tone, 'warning');
  assert.equal(result.nextDensity, 'compact');
  assert.match(result.description, /sem apagar/i);
});

test('orienta revisão quando a compactação já chegou ao limite', () => {
  const result = recommendPageFit(4, 'compact');

  assert.equal(result.tone, 'review');
  assert.equal(result.nextDensity, undefined);
  assert.match(result.description, /priorize/i);
});

test('normaliza contagem inválida para ao menos uma página', () => {
  assert.equal(recommendPageFit(0, 'balanced').tone, 'concise');
});
