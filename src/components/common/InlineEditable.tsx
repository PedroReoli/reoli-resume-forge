import { useEffect, useRef } from 'react';

interface InlineEditableProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  multiline?: boolean;
  label: string;
}

export function InlineEditable({
  value,
  onChange,
  className,
  multiline = false,
  label,
}: InlineEditableProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (ref.current && document.activeElement !== ref.current && ref.current.innerText !== value) {
      ref.current.innerText = value;
    }
  }, [value]);

  return (
    <span
      ref={ref}
      className={`inline-editable ${className ?? ''}`}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={label}
      aria-multiline={multiline}
      spellCheck
      onInput={(event) => onChange(event.currentTarget.innerText.replace(/\n{3,}/g, '\n\n'))}
      onKeyDown={(event) => {
        if (!multiline && event.key === 'Enter') {
          event.preventDefault();
          event.currentTarget.blur();
        }
      }}
    >
      {value}
    </span>
  );
}
