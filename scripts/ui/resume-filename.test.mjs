import assert from 'node:assert/strict';
import test from 'node:test';
import { resumeFilename } from '../../src/domain/resumeFilename.ts';

test('cria nome reconhecível para a variante editável', () => {
  assert.equal(resumeFilename('Pessoa Exemplo', 'json'), 'curriculo_pessoa_exemplo.json');
});

test('normaliza acentos e extensão Markdown', () => {
  assert.equal(resumeFilename("Érica D'Ávila", 'markdown'), 'curriculo_erica_d_avila.md');
});

test('mantém fallback seguro quando o nome está vazio', () => {
  assert.equal(resumeFilename('   ', 'pdf'), 'curriculo.pdf');
});
