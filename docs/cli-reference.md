# Referência da CLI `reoliresume`

## Contrato para automações

- Sucesso: JSON em `stdout` e exit code `0`.
- Erro: JSON em `stderr` e exit code `2`.
- Nenhum comando headless abre prompts interativos.
- Entradas locais são limitadas a 1 MiB.
- Lotes e manifestos aceitam de 1 a 500 jobs.
- `--format` aceita `pdf,docx,json,md`.
- `--on-conflict` aceita `error`, `rename` ou `overwrite`; o padrão seguro é `error`.
- `--dry-run` valida e calcula caminhos sem criar diretórios ou arquivos.

Depois de instalar, abra um terminal novo para que o Windows carregue o `PATH` atualizado:

```powershell
reoliresume version
reoliresume capabilities
```

O portátil também funciona sem instalação:

```powershell
& ".\reoliresume.exe" capabilities
```

## Interface desktop

Sem argumentos ou com `ui`, o mesmo binário abre a interface:

```powershell
reoliresume
reoliresume ui
```

## Geração direta

Gere a partir de um perfil JSON arbitrário:

```powershell
reoliresume generate `
  --profile .\perfil.json `
  --template classic `
  --format pdf,docx,json,md `
  --out .\saida
```

Ou use um arquétipo embarcado:

```powershell
reoliresume generate --model 01_frontend --format pdf --out .\saida
```

`--name` define o nome-base sem extensão. Se `--profile` e `--model` forem informados juntos, o perfil fornece o conteúdo e o modelo serve como metadado do tailoring.

## Adaptação para uma vaga

```powershell
reoliresume tailor `
  --job .\vaga.json `
  --profile .\perfil.json `
  --template executive-bold `
  --format pdf,docx,json `
  --out .\saida
```

`--job` aceita texto simples ou JSON com `job_description`, `jobDescription`, `jd_text` ou `description`. A resposta inclui `score`, `matched`, `missing`, `detectedDomains` e `files`.

Use `--confirmed-us-overlap` somente quando a pessoa confirmou disponibilidade real de sobreposição com o horário dos Estados Unidos.

## Lote simples

`batch` processa um array JSON no mesmo diretório de saída:

```powershell
reoliresume batch `
  --jobs .\examples\jobs.json `
  --model 01_frontend `
  --template compact `
  --format pdf,docx,json `
  --on-conflict rename `
  --out .\lote
```

Cada item aceita `company`, `job_title`, `job_description`, `base_model`, perfil embutido em `profile`, `template` e `confirmed_us_overlap`. Os nomes recebem índice estável para que vagas repetidas não se sobrescrevam.

## Manifesto mestre

`run --manifest` é o modo recomendado para agentes de IA. Um único arquivo mestre pode apontar para diversos JSONs independentes, e cada job pode escolher perfil, modelo, texto adicional, template, formatos, diretório, subpasta e nome-base próprios.

```powershell
reoliresume validate --manifest .\automacao.json
reoliresume run --manifest .\automacao.json --dry-run
reoliresume run --manifest .\automacao.json
```

Exemplo:

```json
{
  "$schema": "./schemas/manifest.schema.json",
  "version": 1,
  "continue_on_error": true,
  "defaults": {
    "profile": "./profiles/pedro.json",
    "formats": ["pdf", "docx", "json", "md"],
    "on_conflict": "rename",
    "output": {
      "directory": "./curriculos"
    }
  },
  "jobs": [
    {
      "id": "acme-frontend",
      "source": "./vagas/acme.json",
      "template": "tech-minimalist",
      "output": {
        "folder": "acme",
        "name": "pedro-acme-frontend"
      }
    },
    {
      "id": "northwind-backend",
      "source": "./vagas/northwind.json",
      "profile": "./profiles/backend.json",
      "template": "compact",
      "formats": ["pdf", "json"],
      "output": {
        "directory": "D:/Entregas",
        "folder": "northwind",
        "name": "pedro-northwind-backend"
      }
    }
  ]
}
```

Um JSON de vaga referenciado é independente:

```json
{
  "company": "Acme",
  "job_title": "Senior Frontend Engineer",
  "job_description": "React, TypeScript, testes e acessibilidade.",
  "extra_text": "Priorizar Design Systems e Core Web Vitals.",
  "base_model": "01_frontend",
  "template": "tech-minimalist"
}
```

### Resolução de caminhos e precedência

- Caminhos no manifesto são relativos ao diretório do manifesto.
- Caminhos dentro de um JSON referenciado são relativos ao próprio JSON.
- `output.folder` deve ser relativo e não aceita `..`.
- `output.name` é um nome-base, sem extensão e sem caracteres inválidos do Windows.
- Um job do manifesto sobrescreve o JSON referenciado; o JSON referenciado sobrescreve `defaults`.
- Flags da CLI sobrescrevem todo o manifesto. `--out` troca a raiz global, mas preserva a subpasta de cada job.
- `continue_on_error: true` processa os jobs restantes e ainda retorna exit code `2` quando algum falha.
- Jobs com `enabled: false` são ignorados.

O exemplo completo está em `examples/automation-manifest.json`.

## Validação e descoberta para IA

```powershell
reoliresume validate --profile .\perfil.json
reoliresume validate --job .\vaga.json
reoliresume validate --jobs .\vagas.json
reoliresume validate --manifest .\automacao.json

reoliresume templates
reoliresume models
reoliresume capabilities
reoliresume schema --type profile
reoliresume schema --type job
reoliresume schema --type batch
reoliresume schema --type manifest
```

Os schemas versionados ficam em `schemas/`. Uma IA pode consultar `capabilities`, pedir o schema adequado, validar a entrada e somente depois executar a geração.

## Templates

| ID | Leitura ATS | Característica |
| --- | --- | --- |
| `classic` | Baixo risco | Padrão Reoli do Vault, linear e sóbrio |
| `clean` | Baixo risco | Hierarquia editorial arejada |
| `compact` | Baixo risco | Alta densidade e leitura linear |
| `executive` | Baixo risco | Destaque executivo em verde profundo |
| `tech-minimalist` | Baixo risco | Ênfase em stack e métricas |
| `modern-split` | Risco médio | Duas colunas visuais; evite em ATS antigos |
| `executive-bold` | Baixo risco | Hierarquia forte para liderança |
| `academic` | Baixo risco | Formação, cursos e publicações |

Todos preservam texto selecionável e links clicáveis em PDF/DOCX.

## Modelos embarcados

| ID | Foco |
| --- | --- |
| `01_frontend` | React, TypeScript, Design Systems e performance |
| `02_fullstack_node` | Node.js, APIs, bancos de dados e cloud |
| `03_fullstack_dotnet` | C#, .NET, SQL Server e React |
| `04_tech_lead` | System Design, liderança e governança |
| `05_internacional_en` | Currículo em inglês para vagas globais |

## Utilitários

```powershell
reoliresume help
reoliresume version
```
