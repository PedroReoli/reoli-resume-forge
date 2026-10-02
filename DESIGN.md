---
name: Reoli Resume Forge
description: Oficina local-first de currículos com precisão editorial e feedback técnico.
colors:
  primary: "#a8cfb1"
  primary-bright: "#d3efd8"
  primary-deep: "#24392d"
  shell: "#0b0f0d"
  panel: "#101613"
  panel-deep: "#0d1210"
  ink: "#e7ebe8"
  muted: "#929e97"
  faint: "#66716a"
  line: "#2a342f"
  line-strong: "#3b4841"
  danger: "#e3a9a0"
  paper: "#f5f3ec"
  paper-ink: "#171b18"
  paper-muted: "#565e59"
typography:
  display:
    fontFamily: 'Georgia, "Times New Roman", serif'
    fontSize: "32px"
    fontWeight: 700
    lineHeight: 1.02
    letterSpacing: "-0.035em"
  headline:
    fontFamily: '"Inter Variable", Inter, "Segoe UI", sans-serif'
    fontSize: "15px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: '"Inter Variable", Inter, "Segoe UI", sans-serif'
    fontSize: "13px"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "0.01em"
  body:
    fontFamily: '"Inter Variable", Inter, "Segoe UI", sans-serif'
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: '"JetBrains Mono Variable", "JetBrains Mono", "Cascadia Code", monospace'
    fontSize: "10px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  sm: "3px"
  md: "4px"
  lg: "8px"
  round: "50%"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "20px"
  xl: "28px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.shell}"
    typography: "{typography.body}"
    rounded: "{rounded.md}"
    padding: "0 13px"
    height: "54px"
  button-quiet:
    backgroundColor: "transparent"
    textColor: "{colors.muted}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "0 11px"
    height: "34px"
  field:
    backgroundColor: "{colors.shell}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.sm}"
    padding: "8px 10px"
    height: "38px"
  document:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.paper-ink}"
    typography: "{typography.display}"
    rounded: "0"
---

# Design System: Reoli Resume Forge

## Overview

**Creative North Star: "The Split Galley"**

O Reoli Resume Forge combina uma bancada técnica escura com uma prova editorial clara. O painel de trabalho é denso, preciso e silencioso; o documento é tratado como a peça principal, com papel quente, tipografia legível e hierarquia de currículo tradicional. A separação visual entre ferramenta e resultado deixa explícito onde se edita e o que será entregue.

A estética é Monochromatic Dark Tech / Clean Slate: verdes minerais aparecem com parcimônia para foco, estado e ação; linhas finas organizam a interface; microinterações confirmam intenção sem competir com o conteúdo. A interface rejeita gradientes chamativos, cartões genéricos em excesso e decoração sem função.

**Key Characteristics:**

- Split-view assimétrico com editor escuro e galley A4 claro.
- Densidade de ferramenta profissional, com score ATS sempre acessível no desktop.
- Verde mineral reservado a foco, sucesso e ação primária.
- Tipografia de interface sans, metadados mono e documento editorial.
- Movimento breve, funcional e removido quando o sistema solicita redução.

## Colors

A paleta usa carvão esverdeado no ambiente de trabalho, tinta quase preta no papel e um único acento mineral de baixa saturação.

### Primary

- **Mineral Mint** (`primary`): ação principal, foco e indicadores positivos.
- **Pale Signal** (`primary-bright`): texto de ênfase sobre superfícies escuras.
- **Forest Well** (`primary-deep`): preenchimento de estados selecionados e hover controlado.

### Neutral

- **Forge Shell** (`shell`): fundo estrutural da aplicação.
- **Raised Charcoal** (`panel`) e **Deep Bench** (`panel-deep`): camadas funcionais do editor.
- **Cold Ink** (`ink`), **Instrument Gray** (`muted`) e **Faint Etching** (`faint`): hierarquia textual da interface.
- **Rule** (`line`) e **Strong Rule** (`line-strong`): divisores e contornos.
- **Warm Paper** (`paper`), **Print Ink** (`paper-ink`) e **Print Muted** (`paper-muted`): superfície e texto do currículo.

### Named Rules

**The One Signal Rule.** O verde mineral comunica foco, ação ou estado; nunca é espalhado como decoração.

**The Paper Is the Product Rule.** A interface permanece escura para que o documento claro seja o foco visual dominante.

## Typography

**Display Font:** Georgia (com Times New Roman como fallback)

**Body Font:** Inter Variable (com Inter e Segoe UI como fallbacks)

**Label/Mono Font:** JetBrains Mono Variable (com JetBrains Mono e Cascadia Code como fallbacks)

**Character:** Inter mantém a ferramenta compacta e contemporânea; JetBrains Mono torna medidas, atalhos e score reconhecíveis; Georgia dá autoridade editorial ao template Clean Slate. As fontes da interface são empacotadas localmente.

### Hierarchy

- **Display** (700, 32px, 1.02): nome do candidato no documento Clean Slate.
- **Headline** (700, 15px, 1.25): marca, títulos fortes e headline do currículo.
- **Title** (700, 13px, 1.2): seções do editor e agrupamentos funcionais.
- **Body** (400, 12px, 1.55): campos, descrições e mensagens operacionais.
- **Label** (600, 10px, 0.02em): metadados, índices, atalhos e controles de documento.

### Named Rules

**The Three Voices Rule.** Sans explica, mono mede e serif apresenta o documento; não misture seus papéis.

## Layout

No desktop, a viewport é uma grade de três faixas: cabeçalho de 58px, workspace flexível e status de 32px. O workspace divide editor e preview em 42/58; abaixo de 1180px passa a 46/54. O editor possui controles sticky, conteúdo com rolagem independente e painel ATS persistente de até 246px. O preview usa toolbar de 48px, palco rolável e documento centralizado com largura máxima de 794px.

Em até 1040px, editor e preview tornam-se modos alternáveis empilhados, com action dock fixo. Em até 560px, campos e termos passam a uma coluna, a tipografia do documento reduz e as três ações principais viram uma doca compacta. O ritmo recorrente usa 4, 8, 12, 20 e 28px; bordas finas substituem contêineres redundantes.

**The Independent Scroll Rule.** No desktop, editor, score ATS e prova do documento preservam seus próprios contextos de rolagem.

## Elevation & Depth

O sistema é plano por padrão e cria profundidade por contraste tonal, linhas e transparência. Sombras ficam restritas a superfícies realmente flutuantes: documento, action dock, toast e indicador de prontidão. Cabeçalho, toolbar e dock usam blur de fundo para manter continuidade sem parecer vidro decorativo.

### Shadow Vocabulary

- **Document lift** (`0 22px 55px rgb(0 0 0 / 47%), 0 0 0 1px rgb(255 255 255 / 8%)`): separa a folha A4 do palco.
- **Dock float** (`0 18px 50px rgb(0 0 0 / 48%)`): mantém as ações de exportação acima do documento.
- **Toast float** (`0 14px 36px rgb(0 0 0 / 45%)`): feedback temporário.
- **Ready glow** (`0 0 12px #7daf88`): único brilho de estado contínuo.

**The Flat-by-Default Rule.** Uma superfície só recebe sombra quando flutua fisicamente sobre outra camada.

## Shapes

Controles usam cantos técnicos e discretos de 3–4px. A doca de ações admite 8px porque é uma superfície flutuante agrupadora. O papel A4 e a marca quadrada não arredondam; indicadores de estado são círculos. Linhas de 1px, sólidas ou tracejadas, descrevem estrutura e disponibilidade sem criar cartões desnecessários.

## Components

### Buttons

- **Shape:** retângulos compactos de 3–4px; ações no dock têm 54px de altura.
- **Primary:** gradiente mineral muito sutil, texto escuro e contorno claro; reservado a Exportar PDF.
- **Hover / Focus:** mudança tonal em 120–150ms e outline sólido de 2px com offset de 2px.
- **Quiet:** fundo transparente, borda estrutural e texto muted; ganha superfície elevada no hover.

### Chips

- **Style:** termos ATS usam borda tracejada quando ausentes e preenchimento Forest Well quando encontrados.
- **State:** o estado encontrado troca simultaneamente borda, fundo e texto; cor nunca é o único sinal.

### Cards / Containers

- **Corner Style:** painéis estruturais não simulam cartões; a action dock usa 8px.
- **Background:** camadas `shell`, `panel` e `panel-deep` separam zonas de trabalho.
- **Shadow Strategy:** somente elementos flutuantes seguem o vocabulário de elevação.
- **Border:** regra de 1px; o documento usa o contraste do papel e sua sombra.
- **Internal Padding:** 20px nos painéis principais e 10–14px nos controles densos.

### Inputs / Fields

- **Style:** fundo profundo, borda Rule, raio de 3px e altura base de 38px.
- **Focus:** outline Primary de 2px com offset, preservando indicação visível por teclado.
- **Disabled:** opacidade de 0.52 e cursor not-allowed.

### Navigation

O cabeçalho é uma barra de 58px com marca quadrada, nome, promessa curta e ações locais. Em larguras menores, texto secundário e rótulos de botões cedem espaço antes que qualquer ação desapareça.

### Split Galley

O componente assinatura mantém edição estruturada à esquerda e currículo editável à direita. O action dock ancora os três resultados — PDF, DOCX e Markdown — sobre a base da prova, enquanto metadados técnicos discretos reforçam a escala A4.

## Do's and Don'ts

### Do:

- **Do** preserve o documento como a superfície visual dominante e mais clara.
- **Do** use bordas, contraste tonal e espaçamento antes de adicionar sombras ou novos cartões.
- **Do** mantenha score ATS e ações de exportação acessíveis sem interromper a edição.
- **Do** preserve foco visível, semântica, redução de movimento e alvos de toque adequados.
- **Do** use os templates como variações editoriais, sem mudar a gramática da aplicação.

### Don't:

- **Don't** use cores saturadas, glows decorativos ou gradientes de marketing.
- **Don't** transforme cada grupo de campos em um cartão arredondado.
- **Don't** use fonte mono para parágrafos ou serif para controles da interface.
- **Don't** esconda informação essencial apenas em hover, cor, imagem, header ou footer do currículo.
- **Don't** deixe o preview competir com controles persistentes sobre a área legível do documento.
