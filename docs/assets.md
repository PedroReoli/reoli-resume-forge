# Assets e fontes

## Identidade visual

O símbolo `R` foi criado para o Reoli Resume Forge e está disponível em `src/assets/app-icon.svg`. Os ícones nativos em `src-tauri/icons/` são derivações do mesmo símbolo para os formatos exigidos pelos sistemas operacionais. Esses arquivos acompanham a licença MIT do projeto.

## Ícones de interface

A interface usa `lucide-react`, distribuído sob licença ISC. Os ícones são importados individualmente e incorporados ao bundle JavaScript pelo Vite.

## Tipografia

- **Inter Variable**: interface principal, licenciada sob SIL Open Font License 1.1 e empacotada por `@fontsource-variable/inter`.
- **JetBrains Mono Variable**: labels, metadados e atalhos, licenciada sob SIL Open Font License 1.1 e empacotada por `@fontsource-variable/jetbrains-mono`.

No documento, a opção sans moderna usa Inter no preview, a serif editorial usa Georgia/Times e a mono técnica usa JetBrains Mono. O PDF mapeia essas escolhas para Helvetica, Times e Courier nativos; o DOCX usa Arial, Georgia e Consolas. Esses fallbacks mantêm texto selecionável e evitam depender de arquivos de fonte externos no executável.

Somente os arquivos referenciados pelo CSS entram no build. Não há carregamento de fontes, imagens ou trackers por rede em runtime.

## Artefatos de design

Arquivos em `.impeccable/mocks/` registram a direção visual aprovada e não entram no `dist` nem no executável. Screenshots de validação e currículos gerados ficam sob `output/`, que é ignorado pelo Git.
