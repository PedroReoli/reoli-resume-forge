# Referência da CLI `reoli-cv`

## Convenções

- Saída de sucesso: JSON em `stdout`.
- Erro: mensagem em `stderr` e código de saída `2`.
- `--format` aceita uma lista separada por vírgulas: `pdf,docx,json,md`.
- `--template` aceita os oito IDs da tabela abaixo. Quando omitido, a CLI usa `config.template` do perfil e, para perfis antigos sem esse campo, `classic`.
- A CLI respeita `config.palette` do perfil em PDF e DOCX. A paleta é parte da variante, não uma flag efêmera; perfis antigos usam as cores nativas do template.
- Aparências prontas escolhidas na GUI são salvas como campos normais de template, paleta e layout; ao receber essa variante JSON, a CLI reproduz a composição sem exigir uma flag de aparência.
- `--out` aponta para um diretório. Ele é criado quando necessário.
- Entradas locais são limitadas a 1 MiB.

## `ui`

Abre a interface desktop. Também é o comportamento padrão sem argumentos.

```powershell
reoli-cv.exe ui
reoli-cv.exe
```

## `generate`

Gera o arquétipo sem tailoring.

```powershell
reoli-cv.exe generate --model 01_frontend --template clean --format pdf,docx --out .\dist
```

Opções obrigatórias: `--model`, `--out`. O formato padrão é `pdf`; os arquétipos nativos sem template explícito usam `classic`.

## `tailor`

Analisa uma vaga e reordena evidências do perfil.

```powershell
reoli-cv.exe tailor `
  --job .\examples\job.json `
  --profile .\examples\profile.example.json `
  --template executive `
  --format pdf,docx,json `
  --out .\dist
```

Use `--model ID` no lugar de `--profile` para partir de um arquétipo. Se ambos forem omitidos, o padrão é `01_frontend`. `--job` aceita texto simples ou JSON com uma das chaves: `job_description`, `jobDescription`, `jd_text` ou `description`.

A flag `--confirmed-us-overlap` deve ser usada somente quando a pessoa confirmou disponibilidade real de sobreposição com o horário dos Estados Unidos:

```powershell
reoli-cv.exe tailor --job vaga.json --model 05_internacional_en --confirmed-us-overlap --out .\dist
```

## `batch`

Processa de 1 a 500 vagas descritas por um array JSON.

```powershell
reoli-cv.exe batch --jobs .\examples\jobs.json --model 02_fullstack_node --template compact --format pdf --out .\lote
```

Cada item aceita `company`, `job_title`, `job_description`, `base_model`, `profile`, `template` e `confirmed_us_overlap`. Um perfil embutido no item tem precedência sobre o modelo; um template no item tem precedência sobre `--template`.

A resolução do modelo visual segue esta ordem: `template` da vaga no lote, `--template`, `config.template` do perfil e, por último, `classic`.

## Templates

| ID | Característica |
| --- | --- |
| `classic` | Padrão Reoli do Vault: Arial, azul-marinho, cabeçalho central e divisores finos |
| `tech-minimalist` | Alta densidade, tipografia técnica e ênfase em stack e métricas |
| `modern-split` | Sidebar visual em duas colunas; prefira Classic/Compact em ATS legados |
| `executive-bold` | Faixa institucional e hierarquia forte para liderança |
| `academic` | Leitura cronológica com ênfase em formação, cursos e publicações |
| `clean` | Leitura arejada, hierarquia editorial e margens equilibradas |
| `compact` | Maior densidade, tipografia sem serifa e espaçamento reduzido |
| `executive` | Destaque executivo em verde profundo e hierarquia ampliada |

Todos preservam texto selecionável e links clicáveis em PDF/DOCX. `modern-split` usa duas colunas visuais; os demais mantêm leitura linear conservadora.

## Modelos

| ID | Foco |
| --- | --- |
| `01_frontend` | React, TypeScript, Design Systems e performance |
| `02_fullstack_node` | Node.js, APIs, bancos de dados e cloud |
| `03_fullstack_dotnet` | C#, .NET, SQL Server e React |
| `04_tech_lead` | System Design, liderança e governança |
| `05_internacional_en` | Currículo em inglês para vagas globais |

## Utilitários

```powershell
reoli-cv.exe help
reoli-cv.exe version
```
