# SOP — Build e release portátil

**Status:** ativo  
**Responsável:** mantenedores do Reoli Resume Forge  
**Gatilho:** tag `v*`, release manual ou preparação de entrega local  
**Resultado:** `release/bin/reoli-cv.exe` e `release/bin/reoli-cv.sha256`

## Pré-condições

- Worktree conhecida e sem alterações não revisadas.
- Node.js 24+, npm e Rust estável disponíveis.
- WebView2 presente para o smoke test da GUI.
- Versão sincronizada em `package.json`, `src-tauri/Cargo.toml` e `src-tauri/tauri.conf.json`.

## Método

O atalho recomendado é `npm run ops`. O menu usa `Tauri Dev` como ação padrão ao pressionar `Enter` e também concentra CLI/smoke test, validações, diagnóstico e build portátil. Para automações sem prompt, use `npm run ops -- dev`, `npm run ops -- verify`, `npm run ops -- doctor` ou `npm run ops -- build`.

1. Instale de forma reproduzível: `npm ci`.
2. Execute a barreira local: `npm run verify`.
3. Gere o portátil: `npm run build:portable`.
4. Confira o hash: `Get-FileHash release\bin\reoli-cv.exe -Algorithm SHA256`.
5. Execute `reoli-cv.exe version`, `help` e ao menos um `generate` em diretório temporário.
6. Valide PDF com extração de texto e DOCX abrindo o ZIP e lendo `word/document.xml`.
7. Abra `reoli-cv.exe ui`, confirme título da janela e feche o processo de teste.
8. Confirme `git status`, faça push e publique exe + checksum somente no release autorizado.

## Exceções e rollback

- Se qualquer validação falhar, não publique nem substitua um release anterior.
- Artefatos em `release/bin/` são regeneráveis e ignorados pelo Git; remova apenas o lote com falha.
- Se o WebView2 não existir, registre a limitação e teste a CLI; não declare a GUI homologada.
- Sem assinatura Authenticode, documente que o SmartScreen pode exibir aviso de reputação.

## Checklist de aceite

- [ ] Lint, TypeScript, Vite e testes Rust verdes.
- [ ] Binário único inicia em modo GUI e headless.
- [ ] `generate`, `tailor` e `batch` gravam saídas esperadas.
- [ ] PDF contém texto selecionável; DOCX não contém tabela complexa.
- [ ] SHA-256 confere com `reoli-cv.sha256`.
- [ ] Documentação e `TODO.md` refletem a versão.
- [ ] Worktree limpa e commit/tag enviados ao remoto.
