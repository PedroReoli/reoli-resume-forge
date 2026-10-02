import { motion } from 'framer-motion';
import { Check, Circle, ShieldCheck, Sparkles, Target, TriangleAlert } from 'lucide-react';
import { auditResume } from '../../domain/resumeAudit';
import type { JobRequirement, MatchReport, ResumeProfile, ResumeTemplate } from '../../types/resume';
import { SectionHeading } from '../common/SectionHeading';

interface AtsPanelProps {
  report: MatchReport | null;
  profile: ResumeProfile;
  template: ResumeTemplate;
  pageCount: number | null;
  canTailor: boolean;
  busy: boolean;
  onTailor: () => void;
}

export function AtsPanel({ report, profile, template, pageCount, canTailor, busy, onTailor }: AtsPanelProps) {
  const score = report?.score;
  const required = report?.job.requirements.filter((item) => item.level === 'required') ?? [];
  const preferred = report?.job.requirements.filter((item) => item.level === 'preferred') ?? [];
  const audit = auditResume(profile, template, pageCount);
  const issues = audit.filter((item) => item.level === 'warning');

  return (
    <section className="ats-panel" aria-labelledby="ats-title">
      <SectionHeading
        title="Job Matcher"
        hint="Obrigatórios, desejáveis e evidências reais"
        action={
          <button className="tailor-button" type="button" disabled={!canTailor || busy} onClick={onTailor}>
            <Sparkles size={16} /> Criar versão adaptada
          </button>
        }
      />
      <div className="ats-overview">
        <div className="score-row">
          <motion.strong id="ats-title" key={score ?? 'empty'} initial={{ opacity: 0.4, y: 4 }} animate={{ opacity: 1, y: 0 }}>
            {score ?? '—'} <span>/ 100</span>
          </motion.strong>
          <p>{scoreMessage(score)}</p>
        </div>
        {report?.job.seniority ? <div className="seniority-badge"><Target size={14} /><span>Senioridade detectada</span><strong>{report.job.seniority}</strong></div> : null}
      </div>
      <div className="term-columns">
        <TermList title={`Pontos fortes (${report?.matched.length ?? 0})`} terms={report?.matched ?? []} matched />
        <TermList title={`Lacunas (${report?.missing.length ?? 0})`} terms={report?.missing ?? []} />
      </div>
      {report ? (
        <div className="requirement-grid">
          <RequirementList title="Requisitos obrigatórios" icon={ShieldCheck} requirements={required} />
          <RequirementList title="Diferenciais desejáveis" icon={Target} requirements={preferred} />
        </div>
      ) : <p className="empty-hint">Cole uma descrição de vaga para iniciar o diagnóstico.</p>}
      {report?.warnings.length ? (
        <div className="ats-warning"><TriangleAlert size={14} /><span>{report.warnings[0]}</span></div>
      ) : null}
      <div className="document-audit">
        <header>
          <div><ShieldCheck size={15} /><strong>Auditoria ATS do documento</strong></div>
          <span>{issues.length ? `${issues.length} ajuste(s)` : 'Aprovado'}</span>
        </header>
        <div>
          {audit.map((item) => (
            <article className={item.level} key={item.id}>
              {item.level === 'pass' ? <Check size={13} /> : <TriangleAlert size={13} />}
              <p><strong>{item.title}</strong><small>{item.detail}</small></p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function TermList({ title, terms, matched = false }: { title: string; terms: string[]; matched?: boolean }) {
  return (
    <div className="term-list">
      <h3>{title}</h3>
      {terms.slice(0, 10).map((term) => (
        <span className={matched ? 'term matched' : 'term'} key={term}>
          {matched ? <Check size={14} /> : <Circle size={13} />} {term}
        </span>
      ))}
      {!terms.length ? <small>Nenhum termo reconhecido.</small> : null}
    </div>
  );
}

function RequirementList({ title, icon: Icon, requirements }: { title: string; icon: typeof Target; requirements: JobRequirement[] }) {
  return (
    <div className="requirement-list">
      <h3><Icon size={14} /> {title}</h3>
      {requirements.slice(0, 5).map((item) => <p key={item.text}>{item.text}</p>)}
      {!requirements.length ? <small>Não identificado explicitamente.</small> : null}
    </div>
  );
}

function scoreMessage(score: number | null | undefined): string {
  if (score == null) return 'Aguardando requisitos reconhecíveis na vaga.';
  if (score >= 80) return 'Alinhamento forte. Confirme a verdade de cada evidência antes de exportar.';
  if (score >= 55) return 'Bom ponto de partida. Reforce somente competências que você realmente possui.';
  return 'Baixa cobertura. Considere outro arquétipo ou uma vaga mais aderente ao perfil.';
}
