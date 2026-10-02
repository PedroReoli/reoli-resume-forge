import { Maximize2, Minus, Plus } from 'lucide-react';
import { useState } from 'react';
import type { ResumeProfile, ResumeTemplate } from '../../types/resume';
import { ResumePreview } from './ResumePreview';

interface PreviewPaneProps {
  profile: ResumeProfile;
  template: ResumeTemplate;
  onProfile: (profile: ResumeProfile) => void;
}

export function PreviewPane({ profile, template, onProfile }: PreviewPaneProps) {
  const [zoom, setZoom] = useState(100);
  return (
    <section className="preview-pane">
      <div className="preview-toolbar">
        <div><span>Documento</span><strong>A4 · 210 × 297 mm</strong></div>
        <div className="zoom-controls" aria-label="Zoom do documento">
          <span>{zoom}%</span>
          <button type="button" aria-label="Reduzir zoom" onClick={() => setZoom((value) => Math.max(70, value - 10))}><Minus size={15} /></button>
          <button type="button" aria-label="Aumentar zoom" onClick={() => setZoom((value) => Math.min(120, value + 10))}><Plus size={15} /></button>
          <button type="button" aria-label="Ajustar à largura" onClick={() => setZoom(100)}><Maximize2 size={15} /></button>
        </div>
      </div>
      <div className="paper-stage">
        <div className="page-meta left"><span>A4</span><span>210 × 297 mm</span></div>
        <div className="paper-scale" style={{ '--document-zoom': zoom / 100 } as React.CSSProperties}>
          <ResumePreview profile={profile} template={template} onProfile={onProfile} />
        </div>
        <div className="page-meta right"><span>Versão ATS</span><span>Texto selecionável</span><span>Edição inline</span></div>
      </div>
    </section>
  );
}
