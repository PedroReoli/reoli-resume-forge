# Arquitetura

## Visão geral

O Reoli Resume Forge separa regras de negócio, adaptação de plataforma e apresentação. A única fonte de verdade para score, tailoring e compilação é o core Rust.

```mermaid
flowchart LR
  UI[React 19 GUI] --> IPC[Comandos Tauri]
  CLI[CLI headless] --> CORE[Core Rust]
  IPC --> CORE
  DATA[Arquétipos JSON e catálogo ATS] --> CORE
  CORE --> ATS[Parser e score ATS]
  CORE --> TAILOR[Tailoring conservador]
  CORE --> EXPORT[PDF / DOCX / MD / JSON]
  EXPORT --> FS[Sistema de arquivos local]
```

## Módulos

| Camada | Local | Responsabilidade |
| --- | --- | --- |
| Dados | `src/data/` | Arquétipos editáveis e aliases de keywords |
| UI | `src/components/`, `src/hooks/` | Edição, preview A4, acessibilidade e atalhos |
| Bridge | `src/services/tauriBridge.ts` | Contrato IPC e fallback visual no navegador de desenvolvimento |
| Core | `src-tauri/src/core/` | Modelos, validação, ATS, tailoring e exportação |
| Adaptadores | `src-tauri/src/commands.rs`, `cli.rs` | Entrada pela GUI ou pelo terminal |
| Bootstrap | `src-tauri/src/main.rs`, `lib.rs` | Dispatch do modo e inicialização do Tauri |

## Fluxo de dados

1. O perfil nasce de um arquétipo embarcado, de um JSON importado ou de um perfil vazio.
2. React mantém um único estado estruturado. Formulários e conteúdo editável do A4 atualizam esse mesmo estado.
3. Após 420 ms sem edição, a GUI envia perfil e Job Description ao core via IPC.
4. O core valida limites, extrai requisitos, cruza evidências e devolve um relatório serializável.
5. Ao adaptar, o core ordena bullets e tecnologias pela relevância, com proveniência e sem criar texto novo.
6. O exportador serializa o mesmo perfil e o layout selecionado para o formato escolhido.

## Limites de segurança

- A aplicação não contém backend, autenticação, telemetria ou sincronização externa.
- A CLI rejeita entradas acima de 1 MiB e lotes vazios ou acima de 500 vagas.
- O core limita tamanho do resumo e quantidade de experiências/projetos.
- O caminho de exportação da GUI vem do diálogo nativo; na CLI, o diretório é criado e canonizado antes da gravação.
- Keywords declaradas em `target_keywords` não contam sozinhas como evidência; a comprovação deve existir no conteúdo profissional.
- Tailoring apenas seleciona e reordena bullets existentes.

## Formatos ATS

PDF e DOCX usam uma coluna, ordem de leitura linear, texto selecionável, headings convencionais e fontes do sistema/documento. Os três layouts (`clean`, `compact` e `executive`) alteram apenas tipografia, espaçamento, margens e acentos visuais; a semântica permanece idêntica. URLs usam hyperlinks externos reais. Não há conteúdo essencial em cabeçalho, rodapé, imagem ou tabela.

## Executável único

`main.rs` inspeciona o primeiro argumento. Sem argumento ou com `ui`, inicia o Tauri; nos demais casos, executa a CLI sem abrir janela. O bundle do frontend e os cinco arquétipos são incorporados ao binário. O WebView2 é uma dependência do sistema Windows, não um sidecar distribuído.
