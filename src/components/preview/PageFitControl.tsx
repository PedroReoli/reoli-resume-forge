import { Check, ChevronDown, FileText, Gauge, WandSparkles } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { recommendPageFit } from '../../domain/pageFit';
import type { ResumeDensity } from '../../types/resume';

interface PageFitControlProps {
  pageCount: number;
  density: ResumeDensity;
  onDensity: (density: ResumeDensity) => void;
}

export function PageFitControl({ pageCount, density, onDensity }: PageFitControlProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const recommendation = useMemo(
    () => recommendPageFit(pageCount, density),
    [density, pageCount],
  );

  useEffect(() => {
    if (!open) return undefined;
    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsideClick);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsideClick);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [open]);

  const applyRecommendation = () => {
    if (!recommendation.nextDensity) return;
    onDensity(recommendation.nextDensity);
    setOpen(false);
  };

  return (
    <div className={`page-fit-control tone-${recommendation.tone}`} ref={rootRef}>
      <button
        type="button"
        className="page-fit-trigger"
        aria-label={`Meta de duas páginas: documento com ${pageCount} ${pageCount === 1 ? 'página' : 'páginas'}`}
        aria-expanded={open}
        aria-controls="page-fit-panel"
        onClick={() => setOpen((current) => !current)}
      >
        <span className="page-fit-signal" aria-hidden="true">
          {pageCount <= 2 ? <Check size={13} /> : <FileText size={13} />}
        </span>
        <span className="page-fit-trigger-copy">
          <small>Meta de páginas</small>
          <strong>{pageCount} / 2 A4</strong>
        </span>
        <ChevronDown className="page-fit-chevron" size={13} aria-hidden="true" />
      </button>

      {open ? (
        <section id="page-fit-panel" className="page-fit-panel" aria-label="Assistente de páginas">
          <header>
            <span aria-hidden="true"><Gauge size={16} /></span>
            <div>
              <strong>Orçamento A4</strong>
              <small>Referência do gerador validado no Vault</small>
            </div>
          </header>

          <div className="page-fit-meter" aria-hidden="true">
            <i style={{ '--page-fit-progress': `${Math.min(100, (pageCount / 2) * 100)}%` } as React.CSSProperties} />
            <span />
          </div>

          <div className="page-fit-message">
            <strong>{recommendation.title}</strong>
            <p>{recommendation.description}</p>
          </div>

          {recommendation.nextDensity ? (
            <button type="button" className="page-fit-action" onClick={applyRecommendation}>
              <WandSparkles size={14} />
              {recommendation.actionLabel}
            </button>
          ) : null}

          <footer>
            <span>Densidade atual: {densityLabel(density)}</span>
            <span>{recommendation.nextDensity ? 'Reversível com Ctrl+Z' : 'Conteúdo preservado'}</span>
          </footer>
        </section>
      ) : null}
    </div>
  );
}

function densityLabel(density: ResumeDensity): string {
  if (density === 'compact') return 'compacta';
  if (density === 'relaxed') return 'confortável';
  return 'equilibrada';
}
