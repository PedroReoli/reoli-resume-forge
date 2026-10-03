# SOP — Build e release Windows

**Código:** SOP-REL-001

**Versão:** 2.1

**Status:** ativo

**Responsável:** mantenedores do Reoli Resume Forge

**Gatilho:** tag `v*`, release manual ou preparação de entrega local

**Resultado:** portátil, instalador NSIS e checksums SHA-256

## Escopo

Este procedimento cobre validação, build do binário único GUI/CLI, criação do instalador Windows por usuário e smoke tests locais. Não cobre compra de certificado Authenticode, publicação de GitHub Release nem homologação em uma máquina externa limpa.

## Pré-requisitos

- Worktree conhecida, com alterações revisadas.
- Node.js 24+, npm e Rust estável.
- Dependências de compilação do Tauri v2 para Windows.
- Conexão de internet no primeiro build para ferramentas NSIS e bootstrapper do WebView2.
- Versão sincronizada em `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock` e `src-tauri/tauri.conf.json`.

## Execução

O fluxo interativo recomendado é:

```powershell
npm run ops
```

Pressione `Enter` para iniciar o Tauri Dev. Para automação sem menu:

```powershell
npm run ops -- verify
npm run ops -- portable
npm run ops -- installer
npm run ops -- build
```

O alias `build` executa a release completa. O procedimento manual equivalente é:

1. Instale dependências: `npm ci`.
2. Execute a barreira local: `npm run verify`.
3. Gere portátil e instalador: `npm run build:release`.
4. Confira os checksums em `release/bin/` e `release/installer/`.
5. Execute `release\bin\reoliresume.exe version` e `capabilities`.
6. Valide o manifesto: `release\bin\reoliresume.exe validate --manifest examples\automation-manifest.json`.
7. Execute primeiro `run --manifest ... --dry-run` e depois uma geração real em `output/`.
8. Valide ao menos um PDF por extração de texto e um DOCX abrindo o ZIP e lendo `word/document.xml`.
9. Abra `release\bin\reoliresume.exe`, confirme a GUI e feche o processo de teste.
10. Instale o setup em uma máquina de teste, abra um terminal novo e execute `reoliresume capabilities`.
11. Desinstale e confirme que a entrada do aplicativo foi removida do `PATH` do usuário.
12. Publique somente com autorização explícita.

## Artefatos

```text
release/
├── bin/
│   ├── reoliresume.exe
│   └── reoliresume.sha256
└── installer/
    ├── ReoliResumeSetup-<versão>.exe
    └── ReoliResumeSetup-<versão>.sha256
```

O instalador NSIS usa modo `currentUser`, não exige elevação administrativa, inclui o bootstrapper oficial do WebView2 e adiciona `$INSTDIR` ao `PATH` de `HKCU\Environment`. A alteração aparece em terminais abertos depois da instalação. O uninstall remove somente o segmento exato criado pelo instalador.

## Exceções e troubleshooting

- Se `makensis` rejeitar o hook, não publique; valide o comando indicado e repita o bundle.
- Se o WebView2 não puder ser instalado, valide a conexão e registre a limitação; a CLI headless permanece independente da WebView.
- Se `reoliresume` não for encontrado após instalar, feche o terminal antigo e abra outro antes de alterar o `PATH` manualmente.
- Se uma saída já existir, use `--on-conflict rename` ou escolha outro destino. Não use `overwrite` sem intenção explícita.
- Sem certificado Authenticode, o SmartScreen pode exibir aviso de reputação. Isso não deve ser apresentado como release assinada.
- Se qualquer validação falhar, não publique nem substitua um release anterior.

## Checklist de qualidade

- [ ] Lint, TypeScript, Vite, testes Node e testes Rust verdes.
- [ ] Rustfmt e Clippy `-D warnings` verdes.
- [ ] Portátil inicia em GUI e em modo headless.
- [ ] `generate`, `tailor`, `batch` e `run --manifest` gravam saídas esperadas.
- [ ] `validate`, `schema`, `models`, `templates` e `capabilities` retornam JSON válido.
- [ ] Manifesto com múltiplos JSONs respeita template, formato, pasta e nome por job.
- [ ] PDF contém texto selecionável; DOCX possui estrutura válida.
- [ ] Checksums correspondem aos artefatos.
- [ ] Setup instala e desinstala o comando global em uma máquina de teste.
- [ ] Documentação e `TODO.md` refletem a versão.
- [ ] Assinatura digital está presente ou a ausência está explicitamente documentada.

## Métricas

- Duração total do `npm run build:release`.
- Quantidade de testes aprovados.
- Tamanho do portátil e do instalador.
- Resultado do smoke test em Windows limpo.

## Histórico

| Versão | Alteração |
| --- | --- |
| 2.1 | Adiciona instalador NSIS, comando global e manifesto para agentes |
| 2.0 | Formaliza release portátil GUI/CLI |
