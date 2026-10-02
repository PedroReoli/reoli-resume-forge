import { motion } from 'framer-motion';
import { Check, Circle, Sparkles } from 'lucide-react';
import type { MatchReport } from '../../types/resume';
import { SectionHeading } from '../common/SectionHeading';

interface AtsPanelProps {
  report: MatchReport | null;
  canTailor: boolean;
  busy: boolean;
  onTailor: () => void;
}

export function AtsPanel({ report, canTailor, busy, onTailor }: AtsPanelProps) {
  const score = report?.score;
  return (
    <section className="ats-panel" aria-labelledby="ats-title">
      <SectionHeading
        title="Pontuação ATS"
        hint="Cobertura ponderada, sem fabricar experiência"
        action={
          <button className="tailor-button" type="button" disabled={!canTailor || busy} onClick={onTailor}>
            <Sparkles size={16} /> Adaptar evidências
          </button>
        }
      />
      <div className="score-row">
        <motion.strong
          id="ats-title"
          key={score ?? 'empty'}
          initial={{ opacity: 0.4, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {score ?? '—'} <span>/ 100</span>
        </motion.strong>
        <p>{scoreMessage(score)}</p>
      </div>
      <div className="term-columns">
        <TermList title={`Termos encontrados (${report?.matched.length ?? 0})`} terms={report?.matched ?? []} matched />
        <TermList title={`Termos ausentes (${report?.missing.length ?? 0})`} terms={report?.missing ?? []} />
      </div>
      {!report ? <p className="empty-hint">Cole uma descrição de vaga para iniciar o diagnóstico.</p> : null}
    </section>
  );
}

function TermList({ title, terms, matched = false }: { title: string; terms: string[]; matched?: boolean }) {
  return (
    <div className="term-list">
      <h3>{title}</h3>
      {terms.slice(0, 8).map((term) => (
        <span className={matched ? 'term matched' : 'term'} key={term}>
          {matched ? <Check size={14} /> : <Circle size={13} />} {term}
        </span>
      ))}
    </div>
  );
}

function scoreMessage(score: number | null | undefined): string {
  if (score == null) return 'Aguardando requisitos reconhecíveis na vaga.';
  if (score >= 80) return 'Alinhamento forte. Revise a verdade de cada evidência antes de exportar.';
  if (score >= 55) return 'Bom ponto de partida. Reforce somente competências que você realmente possui.';
  return 'Baixa cobertura. Considere outro arquétipo ou uma vaga mais aderente ao perfil.';
}
