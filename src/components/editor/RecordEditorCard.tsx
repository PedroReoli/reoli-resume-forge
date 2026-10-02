import { ChevronDown } from 'lucide-react';
import type { ReactNode } from 'react';

interface RecordEditorCardProps {
  id: string;
  indexLabel: string;
  title: string;
  subtitle: string;
  details: string[];
  completed: number;
  total: number;
  expanded: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function RecordEditorCard({
  id,
  indexLabel,
  title,
  subtitle,
  details,
  completed,
  total,
  expanded,
  onToggle,
  children,
}: RecordEditorCardProps) {
  const contentId = `${id}-content`;
  const completion = Math.round((completed / total) * 100);

  return (
    <article className={`record-card ${expanded ? 'is-expanded' : ''}`}>
      <button
        className="record-summary"
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={onToggle}
      >
        <span className="record-number" aria-hidden="true">{indexLabel}</span>
        <span className="record-identity">
          <strong>{title}</strong>
          <span>{subtitle}</span>
        </span>
        <span className="record-evidence" aria-hidden="true">
          {details.map((detail) => <span key={detail}>{detail}</span>)}
        </span>
        <span className="record-readiness" aria-label={`${completed} de ${total} grupos de conteúdo preenchidos`}>
          <span className="record-progress" aria-hidden="true"><i style={{ width: `${completion}%` }} /></span>
          <small>{completed}/{total}</small>
        </span>
        <ChevronDown className="record-chevron" size={17} aria-hidden="true" />
      </button>
      <div className="record-content" id={contentId} hidden={!expanded}>
        {children}
      </div>
    </article>
  );
}
