# Algoritmo ATS

## Objetivo

O score mede a cobertura de keywords reconhecidas na descrição da vaga por evidências textuais presentes no perfil. Ele é um instrumento de revisão, não uma previsão de contratação ou aprovação em um ATS específico.

## Etapas

1. Normalização Unicode, caixa e separadores.
2. Identificação de frases de requisito e sinais de obrigatoriedade ou preferência.
3. Mapeamento de aliases PT-BR/EN para termos canônicos do catálogo `src/data/ats-keywords.json`.
4. Detecção explicativa das áreas profissionais mais presentes na vaga.
5. Construção da evidência a partir de resumo, skills, experiências, projetos, formação e certificações.
6. Cálculo ponderado e lista de termos atendidos/ausentes.

## Catálogo profissional extensível

O catálogo v2 contém 306 competências canônicas distribuídas por 13 áreas. Uma competência pode participar de mais de uma área sem duplicar aliases; por exemplo, `Kanban` pertence a Produto, Desenvolvimento, Supply Chain e Manufatura.

| ID | Área apresentada na interface |
| --- | --- |
| `software-development` | Desenvolvimento de Software |
| `quality-assurance` | Qualidade de Software (QA) |
| `it-infrastructure` | TI, Infraestrutura e Suporte |
| `supply-chain` | Supply Chain e Logística |
| `legal` | Jurídico e Advocacia |
| `cybersecurity` | Cibersegurança |
| `data-ai` | Dados, BI e Inteligência Artificial |
| `product-project` | Produto e Gestão de Projetos |
| `finance-accounting` | Finanças e Contabilidade |
| `sales-marketing` | Vendas e Marketing |
| `human-resources` | Recursos Humanos |
| `customer-success` | Customer Success e Atendimento |
| `engineering-manufacturing` | Engenharia e Manufatura |

Cada entrada possui o contrato abaixo:

```json
{
  "canonical": "Demand Planning",
  "aliases": ["demand planning", "planejamento de demanda"],
  "domains": ["supply-chain"]
}
```

O nome canônico também é reconhecido automaticamente, mesmo quando não é repetido dentro de `aliases`.

Para estender o catálogo:

1. Reutilize uma competência canônica existente quando o conceito for o mesmo.
2. Adicione aliases objetivos em português e inglês, evitando palavras genéricas isoladas.
3. Associe um ou mais IDs declarados em `domains`.
4. Execute `cargo test --manifest-path src-tauri/Cargo.toml core::ats`.

O validador rejeita versão antiga, IDs desconhecidos, nomes canônicos duplicados, aliases ambíguos, entradas vazias e áreas com cobertura insuficiente. Siglas curtas usam limite de palavra: `TI` não é reconhecido dentro de `participativo`, por exemplo.

A interface exibe no máximo quatro áreas por vaga. Quando há sinais suficientes, exige ao menos duas competências reconhecidas por área; isso reduz classificações ruidosas causadas por uma única palavra compartilhada.

## Fórmula

Cada keyword obrigatória recebe peso `3`; keywords preferenciais ou sem classificação recebem peso `1`.

```text
score = 100 × soma(pesos das keywords atendidas) / soma(pesos das keywords da vaga)
```

O resultado é arredondado para uma casa decimal. Quando nenhuma keyword conhecida é identificada, o score é `null` e a interface solicita revisão humana; não é exibido um zero enganoso.

## Evidência e não fabricação

`target_keywords` orienta um arquétipo, mas não é usado como evidência isolada. Uma competência precisa aparecer no conteúdo profissional estruturado. Durante o tailoring:

- bullets são classificados por relevância e no máximo cinco permanecem por experiência;
- resultados quantificados são priorizados até a meta de aproximadamente 60%;
- tecnologias existentes são reordenadas;
- nenhum bullet, tecnologia ou número novo é criado;
- a posição original de cada bullet selecionado é registrada em `provenance`.

## Limitações conhecidas

- Cobertura lexical não avalia profundidade, senioridade real ou qualidade de escrita.
- O catálogo cobre áreas amplas, mas não conhece todos os termos de todas as profissões.
- Sinônimos fora do catálogo podem exigir revisão manual.
- Formatação ATS varia entre fornecedores; os exportadores seguem práticas conservadoras, não uma certificação universal.

## Auditoria documental

Separadamente do score da vaga, a GUI verifica regras inspiradas no gerador validado do Vault:

- documento com no máximo duas páginas no preview A4;
- resumo profissional com até 110 palavras;
- bullets com até 35 palavras;
- presença de resumo, competências e experiência;
- links profissionais completos e níveis de competência definidos manualmente;
- aviso explícito ao usar `modern-split`, pois ATS antigos podem interpretar duas colunas de forma incorreta.

Esses alertas não alteram o conteúdo e não entram na fórmula do score.

## Evolução segura

Ao adicionar aliases, inclua testes que cubram falso positivo, acento/caixa e peso obrigatório. Não adicione termos pessoais ou específicos de uma vaga ao código do algoritmo; use o catálogo de dados. A classificação de área descreve o vocabulário da vaga e não é usada como evidência no currículo nem altera o score.
