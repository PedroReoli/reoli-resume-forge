import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyResumePalette,
  applyResumeTemplate,
  normalizeResumeProfile,
  profilePalette,
  profileTemplate,
  RESUME_PALETTE_IDS,
  RESUME_PALETTES,
  RESUME_TEMPLATE_IDS,
  TEMPLATE_OPTIONS,
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
  assert.equal(normalized.config.palette, 'template');
});

test('troca o template sem alterar o perfil de origem', () => {
  const original = normalizeResumeProfile(profileWith('classic'));
  const updated = applyResumeTemplate(original, 'tech-minimalist');

  assert.equal(original.config.template, 'classic');
  assert.equal(updated.config.template, 'tech-minimalist');
  assert.notEqual(updated, original);
  assert.notEqual(updated.config, original.config);
});

test('aplica uma paleta profissional sem alterar o perfil de origem', () => {
  const original = normalizeResumeProfile(profileWith('classic'));
  const updated = applyResumePalette(original, 'forest');

  assert.equal(profilePalette(original), 'template');
  assert.equal(profilePalette(updated), 'forest');
  assert.equal(updated.config.colors.primary, '#174A3B');
  assert.equal(updated.config.colors.dark, '#102F27');
  assert.notEqual(updated.config, original.config);
});

test('mantém o catálogo de paletas seguro e sem IDs duplicados', () => {
  const catalogIds = RESUME_PALETTES.map((option) => option.id);

  assert.equal(new Set(catalogIds).size, 6);
  assert.deepEqual([...catalogIds].sort(), [...RESUME_PALETTE_IDS].sort());
  assert.ok(RESUME_PALETTES.every((option) => option.label && option.description));
  assert.ok(RESUME_PALETTES.filter((option) => option.colors).every((option) => (
    Object.values(option.colors).every((color) => /^#[0-9A-F]{6}$/i.test(color))
  )));
});

test('mantém o catálogo visual alinhado aos templates suportados', () => {
  const catalogIds = TEMPLATE_OPTIONS.map((option) => option.id);

  assert.equal(new Set(catalogIds).size, 8);
  assert.deepEqual([...catalogIds].sort(), [...RESUME_TEMPLATE_IDS].sort());
  assert.ok(TEMPLATE_OPTIONS.every((option) => option.label && option.description && option.bestFor));
  assert.ok(TEMPLATE_OPTIONS.some((option) => option.atsMode === 'visual'));
  assert.ok(TEMPLATE_OPTIONS.some((option) => option.atsMode === 'linear'));
});
