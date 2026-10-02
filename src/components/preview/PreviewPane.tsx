import { ChevronLeft, ChevronRight, FileCheck2, Maximize2, Minus, Palette, PencilLine, Plus } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { A4_PREVIEW_WIDTH, calculateFitZoom } from '../../domain/previewScale';
import { TEMPLATE_OPTIONS } from '../../domain/resumeLayout';
import { usePdfPreview } from '../../hooks/usePdfPreview';
import { isDesktop } from '../../services/tauriBridge';
import type { ResumeProfile, ResumeTemplate } from '../../types/resume';
import { PageFitControl } from './PageFitControl';
import { PdfDocumentPreview } from './PdfDocumentPreview';
import { ResumePreview } from './ResumePreview';

const A4_PREVIEW_HEIGHT = 1123;
const PDF_PAGE_GAP = 20;
type PreviewMode = 'proof' | 'edit';

interface PreviewPaneProps {
  profile: ResumeProfile;
  template: ResumeTemplate;
  onTemplate: (template: ResumeTemplate) => void;
  onProfile: (profile: ResumeProfile) => void;
  onPageCount?: (count: number) => void;
}

export function PreviewPane({ profile, template, onTemplate, onProfile, onPageCount }: PreviewPaneProps) {
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState(true);
  const [pageCount, setPageCount] = useState(1);
  const [htmlDocumentHeight, setHtmlDocumentHeight] = useState(A4_PREVIEW_HEIGHT);
  const [mode, setMode] = useState<PreviewMode>(() => (isDesktop() ? 'proof' : 'edit'));
  const [proofRenderError, setProofRenderError] = useState<string | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const pdfPreview = usePdfPreview(profile, template, mode === 'proof');
  const isProofMode = mode === 'proof' && pdfPreview.isDesktop;

  const updatePageCount = useCallback((count: number) => {
    setPageCount(count);
    onPageCount?.(count);
  }, [onPageCount]);

  useEffect(() => {
    if (isProofMode) return undefined;
    const element = documentRef.current;
    if (!element) return undefined;
    const update = () => {
      const measuredHeight = element.scrollHeight;
      if (measuredHeight < 100) return;
      setHtmlDocumentHeight(Math.max(A4_PREVIEW_HEIGHT, measuredHeight));
      const count = Math.max(1, Math.ceil(measuredHeight / A4_PREVIEW_HEIGHT));
      updatePageCount(count);
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => observer.disconnect();
  }, [isProofMode, profile, template, updatePageCount]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !fitMode) return undefined;
    const fit = () => {
      const styles = window.getComputedStyle(stage);
      setZoom(calculateFitZoom(
        stage.clientWidth,
        Number.parseFloat(styles.paddingLeft),
        Number.parseFloat(styles.paddingRight),
      ));
    };
    const observer = new ResizeObserver(fit);
    observer.observe(stage);
    fit();
    return () => observer.disconnect();
  }, [fitMode]);

  useEffect(() => {
    const fitOnNarrowViewport = () => {
      if (window.innerWidth <= 1040) setFitMode(true);
    };
    window.addEventListener('resize', fitOnNarrowViewport);
    return () => window.removeEventListener('resize', fitOnNarrowViewport);
  }, []);

  const cycleTemplate = (direction: -1 | 1) => {
    const index = TEMPLATE_OPTIONS.findIndex((option) => option.id === template);
    const next = (index + direction + TEMPLATE_OPTIONS.length) % TEMPLATE_OPTIONS.length;
    onTemplate(TEMPLATE_OPTIONS[next].id);
  };

  const documentHeight = isProofMode
    ? (pageCount * A4_PREVIEW_HEIGHT) + (Math.max(0, pageCount - 1) * PDF_PAGE_GAP)
    : htmlDocumentHeight;
  const proofError = pdfPreview.error || proofRenderError;

  return (
    <section className="preview-pane">
      <div className="preview-toolbar">
        <div className="preview-left-tools">
          <PageFitControl
            pageCount={pageCount}
            density={profile.layout.density}
            onDensity={(density) => onProfile({
              ...profile,
              layout: { ...profile.layout, density },
            })}
          />
          <div className="preview-mode-switcher" aria-label="Modo da prévia">
            <button
              type="button"
              aria-label="Mostrar PDF final fiel"
              aria-pressed={isProofMode}
              disabled={!pdfPreview.isDesktop}
              title={pdfPreview.isDesktop ? 'Mesmo motor usado na exportação' : 'Disponível no aplicativo desktop'}
              onClick={() => setMode('proof')}
            >
              <FileCheck2 size={13} /><span>PDF fiel</span>
            </button>
            <button
              type="button"
              aria-label="Ativar edição rápida no documento"
              aria-pressed={!isProofMode}
              title="Prévia HTML editável; o PDF fiel é a prova final"
              onClick={() => setMode('edit')}
            >
              <PencilLine size={13} /><span>Editar</span>
            </button>
          </div>
        </div>
        <div className="template-quick-switcher">
          <button type="button" aria-label="Template anterior" onClick={() => cycleTemplate(-1)}><ChevronLeft size={14} /></button>
          <label>
            <Palette size={14} />
            <select value={template} aria-label="Template do documento" onChange={(event) => onTemplate(event.target.value as ResumeTemplate)}>
              {TEMPLATE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.label}</option>)}
            </select>
          </label>
          <button type="button" aria-label="Próximo template" onClick={() => cycleTemplate(1)}><ChevronRight size={14} /></button>
        </div>
        <div className="zoom-controls" aria-label="Zoom do documento">
          <span aria-live="polite">{fitMode ? `Ajustado · ${zoom}%` : `${zoom}%`}</span>
          <button type="button" aria-label="Reduzir zoom" onClick={() => { setFitMode(false); setZoom((value) => Math.max(35, value - 10)); }}><Minus size={15} /></button>
          <button type="button" aria-label="Aumentar zoom" onClick={() => { setFitMode(false); setZoom((value) => Math.min(130, value + 10)); }}><Plus size={15} /></button>
          <button type="button" aria-label="Ajustar página à largura" title="Encaixar A4 na largura disponível" aria-pressed={fitMode} onClick={() => setFitMode(true)}><Maximize2 size={15} /></button>
        </div>
      </div>
      <div className="paper-stage" ref={stageRef}>
        <div className="page-meta left"><span>A4</span><span>210 × 297 mm</span></div>
        {isProofMode && (pdfPreview.isLoading || proofError) ? (
          <div className={`pdf-proof-status${proofError ? ' is-error' : ''}`} role="status">
            {proofError ? 'Falha na prova do PDF' : 'Atualizando PDF final…'}
          </div>
        ) : null}
        <div
          className="paper-scale"
          style={{
            '--document-zoom': zoom / 100,
            width: `${(A4_PREVIEW_WIDTH * zoom) / 100 + 16}px`,
            height: `${(documentHeight * zoom) / 100 + 16}px`,
          } as React.CSSProperties}
        >
          <div className={`document-frame${isProofMode ? ' is-pdf-proof' : ''}`} ref={documentRef}>
            {isProofMode ? (
              pdfPreview.bytes ? (
                <PdfDocumentPreview
                  bytes={pdfPreview.bytes}
                  onError={setProofRenderError}
                  onPageCount={updatePageCount}
                />
              ) : (
                <div className="pdf-proof-skeleton" role="status">
                  <span /><span /><span />
                  <small>{proofError || 'Preparando PDF final…'}</small>
                </div>
              )
            ) : (
              <>
                <ResumePreview profile={profile} template={template} onProfile={onProfile} />
                {Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => (
                  <div className="page-break-guide" style={{ top: `${A4_PREVIEW_HEIGHT * (index + 1)}px` }} key={index}>
                    <span>Quebra A4 · página {index + 2}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
        <div className="page-meta right">
          {isProofMode ? <><span>Prova final</span><span>Mesmo motor da exportação</span><span>{pageCount} página{pageCount === 1 ? '' : 's'}</span></> : <><span>Edição rápida</span><span>Prévia aproximada</span><span>Use PDF fiel para revisar</span></>}
        </div>
      </div>
    </section>
  );
}
