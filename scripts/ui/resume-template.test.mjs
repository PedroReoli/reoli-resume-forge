import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyResumePalette,
  applyResumeStylePreset,
  applyResumeTemplate,
  normalizeResumeProfile,
  profilePalette,
  profileStylePreset,
  profileTemplate,
  RESUME_PALETTE_IDS,
  RESUME_PALETTES,
  RESUME_STYLE_PRESETS,
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

test('aplica uma aparência completa em uma única alteração imutável', () => {
  const original = normalizeResumeProfile(profileWith('classic'));
  const updated = applyResumeStylePreset(original, 'tech-focus');

  assert.equal(profileTemplate(updated), 'tech-minimalist');
  assert.equal(profilePalette(updated), 'cobalt');
  assert.equal(updated.layout.density, 'compact');
  assert.equal(updated.layout.skills_style, 'tags');
  assert.equal(updated.layout.experience_style, 'metrics');
  assert.equal(updated.layout.projects_style, 'metrics');
  assert.equal(profileStylePreset(updated), 'tech-focus');
  assert.equal(profileTemplate(original), 'classic');
  assert.notEqual(updated, original);
  assert.notEqual(updated.layout, original.layout);
});

test('mantém conteúdo, ordem e visibilidade ao aplicar aparência pronta', () => {
  const original = normalizeResumeProfile(profileWith('classic'));
  original.summary = 'Resumo preservado';
  original.layout.hidden_sections = ['languages'];
  const order = [...original.layout.section_order].reverse();
  original.layout.section_order = order;

  const updated = applyResumeStylePreset(original, 'editorial');

  assert.equal(updated.summary, 'Resumo preservado');
  assert.deepEqual(updated.layout.section_order, order);
  assert.deepEqual(updated.layout.hidden_sections, ['languages']);
  assert.equal(profileStylePreset(updated), 'editorial');
});

test('mantém seis aparências curadas, completas e sem IDs duplicados', () => {
  assert.equal(RESUME_STYLE_PRESETS.length, 6);
  assert.equal(new Set(RESUME_STYLE_PRESETS.map((option) => option.id)).size, 6);
  assert.ok(RESUME_STYLE_PRESETS.every((option) => (
    option.label
    && option.description
    && option.bestFor
    && RESUME_TEMPLATE_IDS.includes(option.template)
    && RESUME_PALETTE_IDS.includes(option.palette)
  )));
});
