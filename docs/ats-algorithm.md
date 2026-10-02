# Algoritmo ATS

## Objetivo

O score mede a cobertura de keywords reconhecidas na descrição da vaga por evidências textuais presentes no perfil. Ele é um instrumento de revisão, não uma previsão de contratação ou aprovação em um ATS específico.

## Etapas

1. Normalização Unicode, caixa e separadores.
2. Identificação de frases de requisito e sinais de obrigatoriedade ou preferência.
3. Mapeamento de aliases para termos canônicos do catálogo `src/data/ats-keywords.json`.
4. Construção da evidência a partir de resumo, skills, experiências, projetos, formação e certificações.
5. Cálculo ponderado e lista de termos atendidos/ausentes.

## Fórmula

Cada keyword obrigatória recebe peso `2`; keywords preferenciais ou sem classificação recebem peso `1`.

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
- O catálogo não conhece todos os termos de todas as profissões.
- Sinônimos fora do catálogo podem exigir revisão manual.
- Formatação ATS varia entre fornecedores; os exportadores seguem práticas conservadoras, não uma certificação universal.

## Evolução segura

Ao adicionar aliases, inclua testes que cubram falso positivo, acento/caixa e peso obrigatório. Não adicione termos pessoais ou específicos de uma vaga ao código do algoritmo; use o catálogo de dados.
