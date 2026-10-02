# Reoli Resume Forge

Editor desktop e compilador headless, local-first, para criar currículos legíveis por pessoas e por sistemas ATS. A interface e a CLI vivem no mesmo executável Windows: `reoli-cv.exe`.

## O que entrega

- GUI Dark Tech em split view, com sumário navegável, editor estruturado, página A4 e edição inline bidirecional.
- Cinco arquétipos nativos: frontend, full stack Node.js, full stack .NET, tech lead e internacional em inglês.
- Matcher ATS determinístico, com requisitos obrigatórios ponderados e indicação dos termos atendidos/ausentes.
- Tailoring conservador: reordena apenas evidências existentes e nunca fabrica experiências, tecnologias ou métricas.
- Oito layouts em uma galeria visual comparativa: **Classic Reoli**, Tech Minimalist, Modern Split, Executive Bold, Academic, Clean Slate, Compact Linear e Executive Accent.
- Histórico local com desfazer/refazer, atalhos seguros e confirmação antes de substituir um trabalho em edição.
- Ordem livre, ocultação e blocos opcionais para projetos, voluntariado, cursos, publicações, prêmios e conteúdo personalizado.
- Skills em lista categorizada, tabela semântica, tags ou níveis manuais; experiências em bullets, parágrafos ou métricas priorizadas.
- Exportação consistente em PDF, DOCX, Markdown e JSON, com texto selecionável e hyperlinks reais.
- Auditoria documental herdada do Vault: até duas páginas, resumo enxuto, bullets legíveis, links válidos e alerta para layouts de maior risco ATS.
- CLI `generate`, `tailor`, `batch` e `ui` para automações locais.
- Nenhuma conta, telemetria ou transmissão de dados pessoais.

## Uso rápido

Baixe `reoli-cv.exe` para qualquer pasta. Um duplo clique abre a interface. No terminal:

```powershell
.\reoli-cv.exe generate --model 01_frontend --template classic --format pdf,docx --out .\dist
.\reoli-cv.exe tailor --job .\examples\job.json --profile .\examples\profile.example.json --template executive --format pdf,docx --out .\dist
.\reoli-cv.exe batch --jobs .\examples\jobs.json --model 01_frontend --format pdf --out .\lote
.\reoli-cv.exe ui
```

O arquivo é distribuído sem sidecars. A GUI usa o Microsoft Edge WebView2 instalado no Windows 10/11; a CLI headless não abre a WebView. Veja a [referência da CLI](docs/cli-reference.md).

## Interface

1. Escolha um arquétipo e compare os oito layouts pela galeria visual, ou importe um perfil JSON.
2. Reordene, oculte ou adicione seções pelo sumário lateral; ajuste a densidade e a apresentação de cada bloco.
3. Edite os campos à esquerda, no modal de foco ou diretamente sobre a página A4; use `Ctrl+Z` e `Ctrl+Y` fora dos campos para navegar pelo histórico.
4. Cole a descrição completa da vaga para calcular obrigatórios, desejáveis, senioridade, forças e lacunas.
5. Use **Criar versão adaptada** para priorizar fatos já presentes no perfil.
6. Revise a auditoria ATS e exporte com `Ctrl+P` (PDF), `Ctrl+D` (DOCX) ou `Ctrl+M` (Markdown).

Em telas abaixo de 1040 px, use a alternância **Editor / Preview** para preservar a legibilidade do documento.

Trocar o idioma localiza títulos e níveis conhecidos sem reescrever textos livres. Essa escolha é deliberada: experiências, métricas e proficiências não são traduzidas ou inventadas silenciosamente.

## Desenvolvimento

Requisitos: Node.js 24+, npm, Rust estável e as dependências de compilação do Tauri v2 para Windows.

```powershell
npm ci
npm run ops
npm run tauri:dev
npm run verify
npm run build:portable
```

`npm run ops` abre o Operations Console. Pressione `Enter` para iniciar o desktop com Tauri Dev, ou escolha os submenus de CLI, qualidade, diagnóstico e build. As mesmas ações aceitam aliases diretos, por exemplo `npm run ops -- verify`, `npm run ops -- doctor` e `npm run ops -- build`.

O último comando grava o binário e seu checksum em `release/bin/`:

```text
release/bin/reoli-cv.exe
release/bin/reoli-cv.sha256
```

## Arquitetura e segurança

O core Rust não depende do React. GUI e CLI chamam as mesmas funções de análise, tailoring e exportação. Entradas são limitadas, perfis são validados e o score não trata metadados declarados como prova de competência.

- [Arquitetura](docs/architecture.md)
- [Algoritmo ATS](docs/ats-algorithm.md)
- [SOP de build e release](docs/build-release-sop.md)
- [Assets e fontes](docs/assets.md)
- [Como contribuir](docs/contributing.md)
- [Roadmap público](TODO.md)

## Licença

[MIT](LICENSE). Os arquétipos incluídos são dados editáveis de demonstração do mantenedor; qualquer pessoa pode criar ou importar seu próprio perfil sem alterar o código.
