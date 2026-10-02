import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyResumeTemplate,
  normalizeResumeProfile,
  profileTemplate,
} from '../../src/domain/resumeLayout.ts';

function profileWith(template) {
  return {
    config: {
      tech_label: 'Tecnologias',
      section_names: {},
      ...(template === undefined ? {} : { template }),
    },
    person: { name: 'Ada' },
    headline: 'Engenheira',
    summary: 'Resumo',
    skills: {},
    layout: undefined,
  };
}

test('mantém o template persistido ao normalizar uma variante', () => {
  const normalized = normalizeResumeProfile(profileWith('modern-split'));

  assert.equal(normalized.config.template, 'modern-split');
  assert.equal(profileTemplate(normalized), 'modern-split');
});

test('mantém compatibilidade com perfis antigos sem template', () => {
  const normalized = normalizeResumeProfile(profileWith(undefined));

  assert.equal(normalized.config.template, 'classic');
});

test('troca o template sem alterar o perfil de origem', () => {
  const original = normalizeResumeProfile(profileWith('classic'));
  const updated = applyResumeTemplate(original, 'tech-minimalist');

  assert.equal(original.config.template, 'classic');
  assert.equal(updated.config.template, 'tech-minimalist');
  assert.notEqual(updated, original);
  assert.notEqual(updated.config, original.config);
});
