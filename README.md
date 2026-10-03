# Reoli Resume Forge

Editor desktop e compilador headless, local-first, para criar currículos legíveis por pessoas e por sistemas ATS. A interface e a CLI vivem no mesmo executável Windows: `reoliresume.exe`.

## O que entrega

- GUI Dark Tech em split view, com sumário responsivo, editor estruturado e prova A4 que renderiza no Tauri o mesmo PDF produzido pelo core Rust. A edição inline continua disponível como modo rápido e explicitamente aproximado.
- Um exemplo público Full Stack, totalmente fictício e neutro, usado apenas como ponto de partida.
- Biblioteca local extensível para criar, salvar, abrir, clonar, renomear e excluir quantos perfis forem necessários, sem alterar o exemplo público.
- Matcher ATS determinístico, com requisitos obrigatórios ponderados, 306 competências em 13 áreas profissionais e indicação dos termos atendidos/ausentes.
- Tailoring conservador: reordena apenas evidências existentes e nunca fabrica experiências, tecnologias ou métricas.
- Oito layouts em uma galeria visual comparativa: **Classic Reoli**, Tech Minimalist, Modern Split, Executive Bold, Academic, Clean Slate, Compact Linear e Executive Accent; a escolha acompanha a variante JSON salva.
- Seis paletas profissionais independentes do layout — identidade nativa do modelo, Reoli Navy, Forest, Cobalt, Burgundy e Graphite — preservadas no JSON e aplicadas no PDF/DOCX; a prova fiel mostra diretamente o PDF final.
- Quatro famílias tipográficas seguras — assinatura do modelo, sans moderna, serif editorial e mono técnica — com equivalentes consistentes no PDF e DOCX.
- Oito aparências prontas — Reoli Clássico, Tech Focus, Product Clean, Leadership Bold, Editorial, Visual Split, Global ATS e Consulting Accent — cobrindo todos os layouts nativos com uma combinação curada de paleta, tipografia, densidade e apresentação das seções.
- Histórico local com desfazer/refazer, atalhos seguros e confirmação antes de substituir um trabalho em edição.
- Experiências e projetos em fichas recolhíveis, com progresso de preenchimento e contagem de evidências sem alongar toda a área de trabalho.
- Ordem livre, ocultação e blocos opcionais para projetos, voluntariado, cursos, publicações, prêmios e conteúdo personalizado.
- Skills em lista categorizada, tabela semântica, tags ou níveis manuais; experiências em bullets, parágrafos ou métricas priorizadas.
- Exportação consistente em PDF, DOCX, Markdown e JSON, com texto selecionável, hyperlinks reais e paginação que protege títulos e repete a identidade de experiências ou projetos quando um bloco continua na página seguinte.
- Auditoria documental herdada do Vault: até duas páginas, resumo enxuto, bullets legíveis, links válidos e alerta para layouts de maior risco ATS.
- Assistente de orçamento A4 no preview: mostra a contagem real, recomenda uma densidade adequada em um clique e preserva todo o conteúdo com desfazer disponível. A densidade escolhida também controla margens e ritmo tipográfico nos arquivos PDF e DOCX.
- CLI `generate`, `tailor`, `batch`, `run --manifest`, `validate` e `ui` para automações locais e agentes com terminal.
- Nenhuma conta, telemetria ou transmissão de dados pessoais.

## Uso rápido

Instale `ReoliResumeSetup-*.exe` e abra um terminal novo. `reoliresume` sem argumentos abre a interface; com subcomandos, funciona como CLI headless:

```powershell
reoliresume generate --profile .\examples\profile.example.json --template classic --format pdf,docx --out .\dist
reoliresume tailor --job .\examples\job.json --profile .\examples\profile.example.json --template executive --format pdf,docx --out .\dist
reoliresume batch --jobs .\examples\jobs.json --model fullstack --format pdf --out .\lote
reoliresume run --manifest .\examples\automation-manifest.json --dry-run
reoliresume
```

O instalador registra o diretório do aplicativo no `PATH` do usuário e remove essa entrada no uninstall. Ele inclui o bootstrapper oficial do WebView2 para máquinas que ainda não possuem o runtime; a CLI headless não abre a WebView. Também existe um executável portátil sem sidecars. Veja a [referência da CLI](docs/cli-reference.md).

## Interface

1. Comece pelo exemplo fictício Full Stack, crie um perfil em branco ou importe um JSON. O botão **Perfil** abre a biblioteca local, onde cada variação pode ser salva, clonada, renomeada, aberta ou excluída de forma independente.
2. Em **Formatação do documento**, comece pela mesa de oito aparências prontas — no mobile, deslize a faixa de miniaturas — ou abra **Ajustes finos** para combinar qualquer layout com uma das seis paletas e quatro famílias tipográficas. Depois, reordene, oculte ou adicione seções pelo sumário; em telas estreitas, a faixa compacta permanece visível e acompanha automaticamente o bloco em edição.
3. Expanda somente a experiência ou projeto em edição; mova, duplique ou remova fichas para priorizar evidências e altere os campos à esquerda ou no modal de foco. O modo **Editar** permite ajustes inline rápidos; volte a **PDF fiel** para revisar geometria, fontes e quebras reais. Use `Ctrl+Z` e `Ctrl+Y` fora dos campos para navegar pelo histórico.
4. Cole a descrição completa da vaga para calcular obrigatórios, desejáveis, senioridade, forças e lacunas.
5. Use **Criar versão adaptada** para priorizar fatos já presentes no perfil.
6. Confira o indicador `N / 2 A4` no modo **PDF fiel**. A contagem vem do arquivo efetivamente compilado. Quando houver excesso ou espaço ocioso, abra o assistente para aplicar a densidade recomendada sem apagar conteúdo; a mudança entra no histórico e pode ser desfeita.
7. Salve o perfil atual na biblioteca local com `Ctrl+S`. Para backup, portabilidade ou automação, use **Exportar JSON**; conteúdo, estrutura e template serão restaurados ao importar esse arquivo. Depois, revise a auditoria ATS e exporte com `Ctrl+P` (PDF), `Ctrl+D` (DOCX) ou `Ctrl+M` (Markdown).

No aplicativo desktop, o preview inicia em **PDF fiel** e **Ajustado**. O PDF é gerado localmente pelo mesmo compilador Rust da exportação e desenhado em canvas pelo PDF.js, sem upload ou servidor. Use `–` ou `+` para assumir controle manual do zoom; o botão de encaixe restaura a escala responsiva. No navegador de desenvolvimento, o modo editável funciona como fallback aproximado porque o core Tauri não está disponível.

Em telas abaixo de 1040 px, use a alternância **Editor / Preview** para preservar a legibilidade do documento.

Os diálogos mantêm o foco do teclado dentro da área ativa e o devolvem ao botão de origem ao fechar. Assim, a biblioteca de modelos, a edição focada e a inclusão de seções podem ser operadas com `Tab`, `Shift+Tab` e `Esc`.

Trocar o idioma localiza títulos e níveis conhecidos sem reescrever textos livres. Essa escolha é deliberada: experiências, métricas e proficiências não são traduzidas ou inventadas silenciosamente.

## Desenvolvimento

Requisitos: Node.js 24+, npm, Rust estável e as dependências de compilação do Tauri v2 para Windows.

```powershell
npm ci
npm run ops
npm run tauri:dev
npm run verify
npm run build:portable
npm run build:installer
npm run build:release
```

`npm run ops` abre o Operations Console. Pressione `Enter` para iniciar o desktop com Tauri Dev, ou escolha os submenus de CLI, qualidade, diagnóstico e build. As mesmas ações aceitam aliases diretos, por exemplo `npm run ops -- verify`, `npm run ops -- doctor` e `npm run ops -- build`.

Os builds gravam artefatos e checksums separados:

```text
release/bin/reoliresume.exe
release/bin/reoliresume.sha256
release/installer/ReoliResumeSetup-2.1.0.exe
release/installer/ReoliResumeSetup-2.1.0.sha256
```

## Arquitetura e segurança

O core Rust não depende do React. GUI e CLI chamam as mesmas funções de análise, tailoring e exportação. Entradas são limitadas, perfis são validados e o score não trata metadados declarados como prova de competência.

- [Arquitetura](docs/architecture.md)
- [Algoritmo ATS](docs/ats-algorithm.md)
- [SOP de build e release](docs/build-release-sop.md)
- [Schemas JSON para agentes](schemas/manifest.schema.json)
- [Assets e fontes](docs/assets.md)
- [Como contribuir](docs/contributing.md)
- [Roadmap público](TODO.md)

## Licença

[MIT](LICENSE). O único perfil incluído é um exemplo Full Stack fictício com dados reservados para documentação. Perfis reais permanecem locais e não precisam ser adicionados ao código-fonte.
