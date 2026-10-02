import { ChevronLeft, ChevronRight, Maximize2, Minus, Palette, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { TEMPLATE_OPTIONS } from '../../domain/resumeLayout';
import type { ResumeProfile, ResumeTemplate } from '../../types/resume';
import { PageFitControl } from './PageFitControl';
import { ResumePreview } from './ResumePreview';

const A4_PREVIEW_HEIGHT = 1123;

interface PreviewPaneProps {
  profile: ResumeProfile;
  template: ResumeTemplate;
  onTemplate: (template: ResumeTemplate) => void;
  onProfile: (profile: ResumeProfile) => void;
  onPageCount?: (count: number) => void;
}

export function PreviewPane({ profile, template, onTemplate, onProfile, onPageCount }: PreviewPaneProps) {
  const [zoom, setZoom] = useState(100);
  const [fitMode, setFitMode] = useState(() => window.innerWidth <= 1040);
  const [pageCount, setPageCount] = useState(1);
  const documentRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = documentRef.current;
    if (!element) return undefined;
    const update = () => {
      const measuredHeight = element.scrollHeight;
      if (measuredHeight < 100) return;
      const count = Math.max(1, Math.ceil(measuredHeight / A4_PREVIEW_HEIGHT));
      setPageCount(count);
      onPageCount?.(count);
    };
    const observer = new ResizeObserver(update);
    observer.observe(element);
    update();
    return () => observer.disconnect();
  }, [onPageCount, profile, template]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !fitMode) return undefined;
    const fit = () => setZoom(Math.max(35, Math.min(100, Math.floor(((stage.clientWidth - 24) / 794) * 100))));
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

  return (
    <section className="preview-pane">
      <div className="preview-toolbar">
        <PageFitControl
          pageCount={pageCount}
          density={profile.layout.density}
          onDensity={(density) => onProfile({
            ...profile,
            layout: { ...profile.layout, density },
          })}
        />
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
          <span>{zoom}%</span>
          <button type="button" aria-label="Reduzir zoom" onClick={() => { setFitMode(false); setZoom((value) => Math.max(35, value - 10)); }}><Minus size={15} /></button>
          <button type="button" aria-label="Aumentar zoom" onClick={() => { setFitMode(false); setZoom((value) => Math.min(130, value + 10)); }}><Plus size={15} /></button>
          <button type="button" aria-label="Ajustar à largura" aria-pressed={fitMode} onClick={() => setFitMode(true)}><Maximize2 size={15} /></button>
        </div>
      </div>
      <div className="paper-stage" ref={stageRef}>
        <div className="page-meta left"><span>A4</span><span>210 × 297 mm</span></div>
        <div className="paper-scale" style={{ '--document-zoom': zoom / 100 } as React.CSSProperties}>
          <div className="document-frame" ref={documentRef}>
            <ResumePreview profile={profile} template={template} onProfile={onProfile} />
            {Array.from({ length: Math.max(0, pageCount - 1) }, (_, index) => (
              <div className="page-break-guide" style={{ top: `${A4_PREVIEW_HEIGHT * (index + 1)}px` }} key={index}>
                <span>Quebra A4 · página {index + 2}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="page-meta right"><span>Versão ATS</span><span>Texto selecionável</span><span>Edição inline</span></div>
      </div>
    </section>
  );
}
