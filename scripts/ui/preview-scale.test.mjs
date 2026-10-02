import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateFitZoom,
  MAX_FIT_ZOOM,
  MIN_PREVIEW_ZOOM,
} from '../../src/domain/previewScale.ts';

test('desconta paddings reais ao encaixar o A4 em uma coluna desktop', () => {
  assert.equal(calculateFitZoom(825, 68, 68), 84);
});

test('encaixa o A4 em uma tela mobile sem provocar overflow', () => {
  assert.equal(calculateFitZoom(375, 10, 10), 42);
});

test('não amplia automaticamente o documento acima de 100%', () => {
  assert.equal(calculateFitZoom(1200, 24, 24), MAX_FIT_ZOOM);
});

test('preserva um limite legível em áreas extremamente estreitas', () => {
  assert.equal(calculateFitZoom(180, 20, 20), MIN_PREVIEW_ZOOM);
});

test('mantém fallback estável antes da primeira medição do palco', () => {
  assert.equal(calculateFitZoom(0), MAX_FIT_ZOOM);
  assert.equal(calculateFitZoom(Number.NaN), MAX_FIT_ZOOM);
});
