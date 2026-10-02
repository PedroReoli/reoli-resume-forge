import type { ResumeProfile, ResumeTemplate } from '../types/resume';

export interface ResumeAuditItem {
  id: string;
  level: 'pass' | 'warning';
  title: string;
  detail: string;
}

export function auditResume(
  profile: ResumeProfile,
  template: ResumeTemplate,
  pageCount: number | null,
): ResumeAuditItem[] {
  const bullets = profile.experience.flatMap((item) => item.bullets);
  const longBullets = bullets.filter((item) => wordCount(item) > 35).length;
  const invalidLinks = [profile.person.linkedin, profile.person.portfolio, profile.person.github]
    .filter(Boolean)
    .filter((value) => !/^https?:\/\//i.test(value)).length;
  const visible = new Set(profile.layout.section_order.filter((id) => !profile.layout.hidden_sections.includes(id)));
  const unsetLevels = profile.layout.skills_style === 'levels'
    ? Object.values(profile.skills)
      .flatMap((value) => Array.isArray(value) ? value : [value])
      .filter((skill) => !profile.layout.skill_levels[String(skill)]).length
    : 0;

  return [
    pageCount == null
      ? result('pages', false, 'Extensão do documento', 'Abra o Preview para medir as páginas A4.')
      : result('pages', pageCount <= 2, 'Extensão do documento', pageCount <= 2 ? `${pageCount} página(s), dentro do alvo do Vault.` : `${pageCount} páginas; priorize evidências para chegar a no máximo 2.`),
    result('summary', wordCount(profile.summary) <= 110, 'Resumo profissional', wordCount(profile.summary) <= 110 ? 'Resumo direto, com até 110 palavras.' : `Resumo com ${wordCount(profile.summary)} palavras; o alvo é até 110.`),
    result('bullets', longBullets === 0, 'Leitura dos resultados', longBullets === 0 ? 'Bullets dentro do limite recomendado de 35 palavras.' : `${longBullets} bullet(s) passam de 35 palavras.`),
    result('sections', visible.has('summary') && visible.has('experience') && visible.has('skills'), 'Seções essenciais', 'Resumo, competências e experiência devem permanecer visíveis.'),
    result('links', invalidLinks === 0, 'Links profissionais', invalidLinks === 0 ? 'Links usam URLs completas e clicáveis.' : `${invalidLinks} link(s) precisam começar com http:// ou https://.`),
    result('levels', unsetLevels === 0, 'Níveis de competência', unsetLevels === 0 ? 'Nenhuma proficiência é presumida.' : `${unsetLevels} nível(is) ainda não foram definidos manualmente.`),
    result('layout', template !== 'modern-split', 'Ordem de leitura ATS', template === 'modern-split' ? 'Duas colunas têm maior risco em ATS antigos; use Classic ou Compact para máxima compatibilidade.' : 'Layout linear ou hierarquia conservadora para parsing.'),
  ];
}

function result(id: string, passed: boolean, title: string, detail: string): ResumeAuditItem {
  return { id, level: passed ? 'pass' : 'warning', title, detail };
}

function wordCount(value: string): number {
  return value.trim() ? value.trim().split(/\s+/).length : 0;
}
