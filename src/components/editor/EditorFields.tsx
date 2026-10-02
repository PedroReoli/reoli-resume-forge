import { Focus, Plus } from 'lucide-react';

export function EditorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

export function EditorTextArea({
  label,
  value,
  rows,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  rows: number;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <textarea
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );
}

export function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="icon-button" type="button" aria-label={label} title={label} onClick={onClick}>
      <Plus size={17} />
    </button>
  );
}

export function FocusButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button className="focus-button" type="button" title={label} onClick={onClick}>
      <Focus size={14} />
      <span>{label}</span>
    </button>
  );
}
