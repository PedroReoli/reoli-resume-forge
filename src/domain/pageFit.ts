import type { ResumeDensity } from '../types/resume';

export type PageFitTone = 'concise' | 'ideal' | 'warning' | 'review';

export interface PageFitRecommendation {
  tone: PageFitTone;
  title: string;
  description: string;
  actionLabel?: string;
  nextDensity?: ResumeDensity;
}

export function recommendPageFit(
  pageCount: number,
  density: ResumeDensity,
): PageFitRecommendation {
  const pages = Math.max(1, Math.floor(pageCount));

  if (pages === 1 && density === 'compact') {
    return {
      tone: 'concise',
      title: 'Uma página com espaço disponível',
      description: 'Você pode dar mais respiro ao texto sem alterar o conteúdo.',
      actionLabel: 'Usar densidade equilibrada',
      nextDensity: 'balanced',
    };
  }

  if (pages === 1) {
    return {
      tone: 'concise',
      title: 'Leitura direta em uma página',
      description: 'O documento está enxuto e dentro da meta de leitura do Vault.',
    };
  }

  if (pages === 2) {
    return {
      tone: 'ideal',
      title: 'Faixa ideal para o currículo completo',
      description: 'Duas páginas preservam evidências sem alongar a leitura.',
    };
  }

  if (density !== 'compact') {
    return {
      tone: 'warning',
      title: `${pages} páginas ultrapassam a meta`,
      description: 'A compactação reduz espaços e entrelinhas, sem apagar nenhuma evidência.',
      actionLabel: 'Aplicar densidade compacta',
      nextDensity: 'compact',
    };
  }

  return {
    tone: 'review',
    title: `${pages} páginas mesmo no modo compacto`,
    description: 'Priorize resultados ligados à vaga ou oculte seções opcionais antes de exportar.',
  };
}
