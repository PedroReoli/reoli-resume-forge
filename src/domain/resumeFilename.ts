import type { ExportFormat } from '../types/resume';

export function resumeFilename(personName: string, format: ExportFormat): string {
  const extension = format === 'markdown' ? 'md' : format;
  const name = personName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 72)
    .replace(/_+$/g, '');
  return `curriculo${name ? `_${name}` : ''}.${extension}`;
}
