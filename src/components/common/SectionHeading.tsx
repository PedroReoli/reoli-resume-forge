import type { ReactNode } from 'react';

interface SectionHeadingProps {
  title: string;
  hint?: string;
  action?: ReactNode;
}

export function SectionHeading({ title, hint, action }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <div>
        <h2>{title}</h2>
        {hint ? <p>{hint}</p> : null}
      </div>
      {action}
    </div>
  );
}
