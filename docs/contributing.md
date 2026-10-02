# Como contribuir

## Preparação

1. Instale Node.js 24+, npm e Rust estável.
2. Faça fork/clone e execute `npm ci`.
3. Crie uma branch curta a partir de `main`.
4. Antes de abrir o PR, execute `npm run verify`.

## Arquitetura e escopo

- Regras de ATS, tailoring e exportação pertencem a `src-tauri/src/core/`.
- React não deve duplicar regra de negócio; o fallback do navegador existe apenas para inspeção visual em desenvolvimento.
- Componentes, hooks, serviços e tipos devem permanecer separados.
- Nenhum arquivo novo deve ultrapassar 750 linhas.
- Não introduza telemetria, upload ou dependência de nuvem sem discussão pública prévia.
- Nunca use metadados declarados como prova de experiência nem gere fatos profissionais.

## Padrão de código

```powershell
npm run lint
npm run build
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo test --manifest-path src-tauri/Cargo.toml
```

Commits seguem Conventional Commits, preferencialmente em microetapas:

```text
feat(core): adiciona alias ATS para mensageria
fix(export): preserva quebra de página no PDF
docs: detalha schema de perfil
test(ats): cobre requisito obrigatório com alias
```

## Pull requests

Explique problema, solução, riscos e validações executadas. Mudanças visuais devem incluir evidência em largura estreita e ampla. Mudanças de exportador devem anexar um arquivo sintético sem dados pessoais.

## Dados e privacidade

Não faça commit de currículos privados, descrições de vagas confidenciais, tokens, caminhos de máquina ou artefatos de `release/bin/`. Use os exemplos genéricos em `examples/`.
