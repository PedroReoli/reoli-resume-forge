import catalogSource from '../data/ats-keywords.json';
import type { DetectedJobDomain } from '../types/resume';

interface AtsCatalogSource {
  domains: Array<{ id: string; label: string }>;
  keywords: Array<{ canonical: string; aliases: string[]; domains: string[] }>;
}

const catalog = catalogSource as AtsCatalogSource;
const compiledKeywords = catalog.keywords.map((keyword) => ({
  ...keyword,
  aliases: Array.from(new Set([keyword.canonical, ...keyword.aliases].map(normalizeTerm))),
}));

export function detectJobDomains(jobDescription: string): DetectedJobDomain[] {
  const text = normalizeTerm(jobDescription);
  const recognized = compiledKeywords.filter((keyword) =>
    keyword.aliases.some((alias) => containsTerm(text, alias)),
  );
  const domains = catalog.domains
    .map((domain) => ({
      id: domain.id,
      label: domain.label,
      matchedKeywords: recognized
        .filter((keyword) => keyword.domains.includes(domain.id))
        .map((keyword) => keyword.canonical),
    }))
    .filter((domain) => domain.matchedKeywords.length > 0);

  const highestMatchCount = Math.max(0, ...domains.map((domain) => domain.matchedKeywords.length));
  const minimumMatchCount = highestMatchCount >= 2 ? 2 : 1;
  return domains
    .filter((domain) => domain.matchedKeywords.length >= minimumMatchCount)
    .sort((left, right) => (
      right.matchedKeywords.length - left.matchedKeywords.length
      || left.label.localeCompare(right.label, 'pt-BR')
    ))
    .slice(0, 4);
}

function containsTerm(text: string, term: string): boolean {
  let position = text.indexOf(term);
  while (position >= 0) {
    const before = text[position - 1];
    const after = text[position + term.length];
    if (!isWordCharacter(before) && !isWordCharacter(after)) return true;
    position = text.indexOf(term, position + term.length);
  }
  return false;
}

function isWordCharacter(character: string | undefined): boolean {
  return character != null && /[\p{L}\p{N}_]/u.test(character);
}

function normalizeTerm(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/\s+/g, ' ')
    .trim();
}
