# Reoli Resume Forge — Manual Completo & Referência Técnica

> Gerador e customizador de currículos de alta fidelidade para profissionais de tecnologia, líderes e especialistas, orientado a ATS e construído com filosofia Local-First.

---

## 1. Visão Geral

O **Reoli Resume Forge** é uma ferramenta de engenharia documental projetada para produzir currículos técnicos e executivos nos formatos **PDF**, **DOCX**, **JSON** e **Markdown** a partir de modelos estruturados de dados.

### Filosofia Local-First & Privacidade Absoluta
- **Execução 100% Local:** Nenhum dado pessoal, histórico profissional ou descrição de vaga sai da sua máquina ou é enviado para nuvens de terceiros.
- **Zero Telemetria Oculta:** O binário é autônomo e funciona perfeitamente sem conexão à internet.
- **Conformidade por Design:** Alinhado aos princípios mais rigorosos da LGPD (Lei 13.709/2018) e GDPR para proteção de Dados Pessoais.

### Arquitetura do Gerador
1. **Core em Rust (`src-tauri/src/core`):** Motor de alta performance para validação de esquemas, parsing de vagas, cálculo determinístico de score ATS, layout de densidade e renderização vetorial de PDF e DOCX OpenXML.
2. **CLI Headless Scriptável (`reoliresume`):** Interface de linha de comando para desenvolvedores, scripts em CI/CD e orquestrações por agentes de IA.
3. **Interface Desktop (`Tauri + Vite + React/TS`):** Edição visual com preview em tempo real e exportação instantânea.

---

## 2. Catálogo Completo de Comandos da CLI

O binário `reoliresume` segue um contrato determinístico:
- **Sucesso:** JSON estruturado em `stdout` e código de saída `0`.
- **Erro:** Mensagem JSON descritiva em `stderr` e código de saída `2`.
- **Sem Prompts Interativos:** Ideal para integração direta com agentes de IA e scripts em lote.

### 2.1. `reoliresume docs` / `guide`
Exibe este manual completo formatado em Markdown no terminal.
```powershell
reoliresume docs
reoliresume guide
reoliresume --help --doc
```

### 2.2. `reoliresume generate`
Gera o currículo a partir de um perfil JSON ou modelo arquétipo.
```powershell
reoliresume generate --profile ./perfil.json --template classic --format pdf,docx --out ./saida
```
**Opções principais:**
- `--profile <caminho>`: Caminho para o JSON do perfil.
- `--model <id>`: ID do arquétipo embutido (ex: `fullstack`).
- `--template <id>`: Template visual (`classic`, `clean`, `compact`, `executive`, `tech-minimalist`, `modern-split`, `executive-bold`, `academic`).
- `--format <formatos>`: Formatos separados por vírgula (`pdf`, `docx`, `json`, `md`).
- `--out <diretório>`: Diretório de destino dos arquivos gerados.
- `--name <nome>`: Nome-base dos arquivos gerados (sem extensão).
- `--on-conflict <error|rename|overwrite>`: Política em caso de arquivo existente (padrão: `error`).
- `--dry-run`: Valida os dados e planeja os arquivos sem escrever no disco.

### 2.3. `reoliresume tailor`
Adapta o perfil às palavras-chave e requisitos de uma vaga de emprego, calculando pontuação de compatibilidade ATS.
```powershell
reoliresume tailor --job ./vaga.json --profile ./perfil.json --template tech-minimalist --format pdf,docx,json --out ./saida
```
**Opções adicionais:**
- `--job <caminho>`: Arquivo da vaga (pode ser texto puro `.txt` ou JSON estruturado `.json`).
- `--confirmed-us-overlap`: Flag booleana indicando disponibilidade real de sobreposição de fuso com os EUA (quando solicitado pela vaga).

### 2.4. `reoliresume batch`
Processa uma lista de vagas em lote a partir de um único arquivo JSON.
```powershell
reoliresume batch --jobs ./vagas.json --profile ./perfil.json --format pdf --on-conflict rename --out ./lote
```

### 2.5. `reoliresume run` / `manifest`
Executa um manifesto mestre de automação que pode orquestrar múltiplos perfis, vagas, templates e pastas de saída independentes.
```powershell
reoliresume run --manifest ./automacao.json [--continue-on-error] [--dry-run]
```

### 2.6. `reoliresume validate`
Valida a conformidade de schemas sem gerar arquivos.
```powershell
reoliresume validate --profile ./perfil.json
reoliresume validate --job ./vaga.json
reoliresume validate --jobs ./vagas.json
reoliresume validate --manifest ./automacao.json
```

### 2.7. `reoliresume templates`, `models`, `capabilities`, `schema`
Comandos de auto-descoberta para ferramentas e agentes autônomos.
```powershell
reoliresume templates
reoliresume models
reoliresume capabilities
reoliresume schema --type profile
reoliresume schema --type job
reoliresume schema --type batch
reoliresume schema --type manifest
```

---

## 3. Templates e Matriz de Risco ATS

O Reoli Resume Forge oferece 8 templates visuais refinados, desenvolvidos para equilibrar elegância visual e total compatibilidade com parsers ATS (Applicant Tracking Systems):

| Template | Leitura ATS | Família Tipográfica Nativa | Características & Recomendação |
| :--- | :--- | :--- | :--- |
| **`classic`** | 🟢 **Baixo Risco** | Sans-Serif (Helvetica / Inter) | Padrão clássico Reoli, linear, sóbrio e altamente escaneável. |
| **`clean`** | 🟢 **Baixo Risco** | Serif (Times / Georgia) | Hierarquia editorial equilibrada e arejada. |
| **`compact`** | 🟢 **Baixo Risco** | Sans-Serif | Alta densidade de informação para currículos de 1 página. |
| **`executive`** | 🟢 **Baixo Risco** | Sans-Serif + Acento Verde | Destaque para posições executivas e de liderança sênior. |
| **`tech-minimalist`** | 🟢 **Baixo Risco** | Monospace (Courier / JetBrains Mono) | Ênfase máxima em stack técnica, métricas e entregas quantitativas. |
| **`executive-bold`** | 🟢 **Baixo Risco** | Sans-Serif | Hierarquia visual marcante para diretores e gerentes de engenharia. |
| **`academic`** | 🟢 **Baixo Risco** | Serif | Foco em formação acadêmica, pesquisas, publicações e certificações. |
| **`modern-split`** | 🟡 **Risco Médio** | Sans-Serif | Layout de duas colunas na 1ª página. *Evite em sistemas ATS legados.* |

### Tipografias Suportadas (`config.typeface`)
- `modern-sans`: Inter / Helvetica (padrão moderno de tecnologia).
- `technical-mono`: JetBrains Mono / Courier (ideal para DevOps, backend e engenharia pura).
- `editorial-serif`: Georgia / Times New Roman (ideal para executivos, jurídico e acadêmico).

---

## 4. Especificação dos Schemas JSON

### 4.1. `profile.json` (Modelo do Candidato)
```json
{
  "person": {
    "name": "Alexandre Silva",
    "email": "alexandre@exemplo.com",
    "phone": "+55 11 99999-8888",
    "location": "São Paulo, SP - Brasil",
    "work_preference": "Remoto / Híbrido",
    "linkedin": "https://linkedin.com/in/alexandre-silva",
    "github": "https://github.com/alexandre-silva",
    "portfolio": "https://alexandre.dev"
  },
  "headline": "Staff Software Engineer | Distributed Systems & Rust",
  "summary": "Engenheiro de software com mais de 10 anos de experiência...",
  "skills": {
    "Linguagens & Core": ["Rust", "TypeScript", "Go", "Python"],
    "Cloud & DevOps": ["AWS", "Docker", "Kubernetes", "Terraform"]
  },
  "soft_skills": ["Liderança Técnica", "Arquitetura Distribuída", "Mentoria"],
  "experience": [
    {
      "company": "Tech Corp",
      "role": "Principal Engineer",
      "dates": "2022 - Presente",
      "location": "São Paulo, Brasil",
      "work_mode": "Remoto",
      "summary": "Liderança de arquitetura dos serviços centrais de pagamentos.",
      "bullets": [
        "Projetou arquitetura orientada a eventos reduzindo o p99 de latência em **45%**.",
        "Implementou pipeline de CI/CD automatizado garantindo 99.99% de disponibilidade."
      ],
      "technologies": ["Rust", "Kafka", "PostgreSQL", "AWS"]
    }
  ],
  "projects": [
    {
      "name": "High-Throughput Gateway",
      "description": "API Gateway de baixa latência capaz de processar 100k req/s.",
      "metrics": ["Latência média de 2ms sob carga pesada", "Zero downtime em produção"],
      "technologies": ["Rust", "Tokio", "Redis"]
    }
  ],
  "education": [
    {
      "degree": "Bacharelado em Ciência da Computação",
      "institution": "Universidade de São Paulo",
      "dates": "2012 - 2016"
    }
  ],
  "certifications": [
    {
      "name": "AWS Certified Solutions Architect - Professional",
      "issuer": "Amazon Web Services",
      "date": "2023"
    }
  ],
  "languages": [
    { "language": "Português", "level": "Nativo" },
    { "language": "Inglês", "level": "Fluente / C2" }
  ],
  "layout": {
    "density": "balanced",
    "skills_style": "default",
    "experience_style": "bullets",
    "projects_style": "metrics",
    "section_order": ["summary", "skills", "experience", "projects", "education", "certifications", "languages"],
    "hidden_sections": []
  },
  "config": {
    "template": "classic",
    "typeface": "modern-sans",
    "palette": "reoli-navy",
    "tech_label": "Tecnologias"
  }
}
```

### 4.2. `vaga.json` (Descrição da Vaga)
```json
{
  "company": "Stripe",
  "job_title": "Senior Rust Backend Engineer",
  "job_description": "Estamos contratando engenheiro sênior com sólida experiência em Rust, sistemas distribuídos, mensageria com Kafka, bancos SQL e alta disponibilidade. Desejável conhecimento em Docker, Kubernetes e observabilidade.",
  "base_model": "fullstack",
  "template": "tech-minimalist"
}
```

---

## 5. Exemplos Práticos de Uso

### Geração Rápida para Aplicação Imediata
```powershell
# Gerar PDF e DOCX com layout clássico
reoliresume generate --profile ./meu_perfil.json --template classic --format pdf,docx --out ./candidatura

# Customizar especificamente para uma vaga
reoliresume tailor --job ./vaga_senior.json --profile ./meu_perfil.json --template executive-bold --format pdf --out ./candidatura
```

### Automação para Múltiplas Vagas (Agentes de IA)
```powershell
# Validar arquivo de manifesto antes da execução
reoliresume validate --manifest ./automacoes/semana_42.json

# Executar geração de 50 currículos sob medida em lote
reoliresume run --manifest ./automacoes/semana_42.json --continue-on-error
```

---

*Reoli Resume Forge — Documento integrado e embutido no binário da CLI.*
