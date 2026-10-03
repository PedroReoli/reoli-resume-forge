# Roadmap público

## v1.0.0 — concluído

- [x] Scaffold Tauri v2 + React 19 + TypeScript strict + Tailwind CSS.
- [x] Perfis de exemplo e importação de perfil JSON.
- [x] Core ATS isolado da interface, com testes unitários.
- [x] Tailoring conservador sem invenção de evidências.
- [x] Split view responsivo e edição A4 bidirecional.
- [x] Exportadores PDF, DOCX, Markdown e JSON.
- [x] Três layouts ATS-friendly com links clicáveis: Clean, Compact e Executive.
- [x] CLI `generate`, `tailor`, `batch` e `ui` no mesmo binário.
- [x] Empacotamento portátil em `release/bin/reoliresume.exe` com SHA-256.
- [x] Documentação pública e automação de CI/release.

## v2.0.0 — concluído

- [x] Classic Reoli com tipografia, paleta, densidade e hierarquia do gerador do Vault.
- [x] Oito templates disponíveis na GUI, PDF, DOCX e CLI.
- [x] Seis paletas profissionais persistentes, combináveis com qualquer template e consistentes no preview, PDF e DOCX.
- [x] Quatro famílias tipográficas persistentes com fallbacks seguros e paridade entre preview, PDF e DOCX.
- [x] Oito aparências prontas, uma por template nativo, combinando paleta, tipografia, densidade e formatos de seção em uma única alteração reversível.
- [x] Mesa de aparências responsiva com faixa horizontal no mobile e ajustes finos por revelação progressiva.
- [x] Ordem livre, ocultação e seções personalizadas em todos os formatos.
- [x] Skills em categorias, tabela, tags e níveis informados manualmente.
- [x] Experiências e projetos em bullets, parágrafos ou métricas priorizadas.
- [x] Fichas de evidências recolhíveis, duplicáveis e reordenáveis com histórico reversível.
- [x] Salvamento e importação de variantes editáveis em JSON diretamente pela GUI.
- [x] Checkpoint visual de alterações pendentes com nomes de arquivo derivados do perfil.
- [x] Persistência do template na variante JSON, com restauração pela GUI e precedência compatível na CLI.
- [x] Sumário lateral responsivo, com seção ativa e faixa persistente no mobile, edição focada e preview A4 com zoom e quebras.
- [x] Matcher com senioridade, obrigatórios, desejáveis, forças e lacunas.
- [x] Auditoria ATS de extensão, resumo, bullets, links, seções essenciais e risco do layout.
- [x] Localização estrutural PT-BR, EN-US e ES-ES sem adulterar texto profissional.
- [x] Paridade de ordem e visibilidade em PDF, DOCX e Markdown.
- [x] Galeria visual comparativa com indicação de leitura ATS por template.
- [x] Comparação segura de templates com confirmação explícita, cancelamento sem efeitos e navegação de teclado contida nos diálogos.
- [x] Histórico local de edição com desfazer/refazer e proteção contra substituição acidental.
- [x] Fichas recolhíveis para experiências e projetos com indicadores de conteúdo.
- [x] Paginação PDF protegendo parágrafos, cabeçalhos de registros e margens em fontes monoespaçadas.
- [x] Continuação de experiências e projetos sem bullets ou tecnologias órfãs no início da página.
- [x] Assistente de orçamento A4 com contagem real, recomendação acionável e alteração reversível de densidade.
- [x] Paridade de densidade entre preview, PDF e DOCX, incluindo margens, entrelinhas e espaçamento de blocos.
- [x] Encaixe responsivo automático da folha A4, sem corte ou rolagem horizontal acidental, preservando zoom manual.
- [x] Prova canônica no Tauri renderizando o PDF real do core Rust, com contagem de páginas e alternância para edição rápida.
- [x] Alinhamento do cabeçalho PDF por métricas de glifos e réguas de seção mais leves.
- [x] Catálogo ATS v2 extensível com 306 competências em 13 áreas profissionais e detecção automática de domínio.

## v2.1.0 — concluído

- [x] Binário renomeado para `reoliresume.exe`, mantendo GUI e CLI no mesmo arquivo.
- [x] `generate --profile` para gerar diretamente de qualquer perfil JSON válido.
- [x] Manifesto mestre `run --manifest` com até 500 JSONs independentes.
- [x] Template, perfil/modelo, texto adicional, formatos, diretório, subpasta e nome-base configuráveis por job.
- [x] Precedência determinística entre defaults, JSON referenciado, job e flags da CLI.
- [x] `validate`, `models`, `templates`, `schema` e `capabilities` com saída JSON para agentes.
- [x] `--dry-run` e políticas de conflito `error`, `rename` e `overwrite`.
- [x] Schemas JSON públicos para perfil, vaga, lote e manifesto.
- [x] Instalador NSIS por usuário com WebView2 e registro limpo no `PATH`.
- [x] Operations Console com builds portátil, instalável e release completa.
- [x] Pipeline de release publicando portátil, instalador e checksums.

## v2.2.0 — implementação concluída, release pendente

- [x] Distribuição pública reduzida a um único exemplo Full Stack fictício, sem dados pessoais do mantenedor.
- [x] Biblioteca local extensível para criar, salvar, abrir, clonar, renomear e excluir perfis independentes.
- [x] `Ctrl+S` salva o perfil em edição localmente; importação e exportação JSON permanecem disponíveis para backup e automação.
- [x] CLI, manifesto e exemplos públicos padronizados no modelo neutro `fullstack`, mantendo perfis externos por job.
- [x] Fluxo da biblioteca validado em desktop e viewport móvel, incluindo persistência após recarregar.

## Fechamento da v2.2.0 — fazer no próximo ciclo

### P0 — obrigatório antes de publicar

- [ ] Definir a compatibilidade dos IDs antigos da CLI (`01_frontend`, `02_fullstack_node`, `03_fullstack_dotnet`, `04_tech_lead` e `05_internacional_en`): criar aliases ocultos apontando para o exemplo neutro ou registrar a remoção como mudança incompatível. O comando `models` deve continuar exibindo somente `fullstack`.
- [ ] Atualizar a versão de `2.1.0` para `2.2.0` em `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json` e na barra de status da interface.
- [ ] Executar `npm run verify` e registrar a passagem conjunta de lint, build TypeScript/Vite, testes de interface, testes do Operations Console e testes Rust.
- [ ] Executar `cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings` sem warnings.
- [ ] Executar `npm run build:release` e confirmar os novos artefatos `release/bin/reoliresume.exe` e `release/installer/ReoliResumeSetup-2.2.0.exe`, incluindo seus arquivos SHA-256.
- [ ] Validar o binário compilado com `version`, `capabilities`, `models`, `templates`, `schema`, `validate --manifest`, `run --manifest --dry-run` e uma geração real por manifesto. A aceitação exige `models` com apenas `fullstack`, saída JSON válida e PDF/DOCX/JSON/Markdown nos caminhos configurados.
- [ ] Fazer uma inspeção visual final de pelo menos um PDF linear e do `modern-split`, verificando régua dos títulos, alinhamento, quebras de página, texto selecionável e links clicáveis.
- [ ] Testar o instalador em um usuário ou máquina Windows limpa: instalar, abrir por duplo clique, executar `reoliresume version` em um terminal novo, gerar um currículo e desinstalar confirmando a remoção do `PATH`.

### P1 — recomendado após o fechamento

- [ ] Automatizar testes da biblioteca local para nome duplicado, armazenamento corrompido, exclusão do perfil ativo, persistência e importação/exportação.
- [ ] Transformar o fluxo manual criar → salvar → clonar → renomear → recarregar → excluir em teste end-to-end executado no CI.
- [ ] Avaliar divisão de código do frontend para reduzir o aviso de chunk JavaScript acima de 500 kB, sem atrasar a release se o tempo de abertura continuar aceitável.
- [ ] Assinar instalador e portátil com Authenticode e documentar certificado, timestamp e rotação segura.

### Estado validado nesta etapa

- [x] `npm run lint`, `npm run build` e os 55 testes Rust passaram após a implementação da biblioteca e do perfil neutro.
- [x] Os 28 testes de interface passaram após a atualização dos exemplos públicos.
- [x] Todos os JSONs em `examples/` foram parseados com sucesso.
- [x] Validação manual responsiva não encontrou erros no console e confirmou persistência, clonagem, renomeação e exclusão.
- [ ] A release 2.2.0 ainda não foi compilada nem homologada; os executáveis 2.1.0 existentes são anteriores a esta etapa.

## Próximos ciclos

- [ ] Catálogo de perfis iniciais distribuídos separadamente, sem dados pessoais e sem aumentar o conteúdo embarcado no executável.
- [ ] Catálogo de templates mantidos pela comunidade além dos oito nativos.
- [ ] Validação visual automatizada de regressões do A4.
- [ ] Importador assistido de currículos existentes.
- [ ] Tradução assistida de texto livre com revisão humana e proveniência explícita.

## Fora de escopo deliberado

- Otimização por IA que invente fatos ou reescreva experiência sem rastreabilidade.
- Contas, nuvem, telemetria ou upload automático de dados pessoais.
- Promessa de aprovação em ATS: o score mede cobertura lexical reconhecida, não resultado de candidatura.
