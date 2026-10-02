# Produto

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Tauri v2 com core e CLI em Rust, interface React 19 com TypeScript strict e Tailwind CSS. A aplicação desktop e os comandos headless são distribuídos pelo mesmo binário Windows.

## Users

- Pedro Lucas Reis, ao editar, adaptar, revisar e exportar currículos para vagas específicas.
- Agentes de IA e automações locais, ao gerar currículos individualmente ou em lote pela CLI `reoli-cv`.
- Contribuidores open source, ao evoluir arquétipos, exportadores e regras de matching sem acessar dados privados externos ao repositório.

## Product Purpose

O Reoli Resume Forge transforma perfis profissionais estruturados e descrições de vaga em currículos ATS-friendly, rastreáveis e exportáveis em PDF, DOCX e JSON. O sucesso é gerar documentos legíveis por pessoas e parsers sem inventar experiências, competências ou métricas.

## Positioning

O diferencial é um motor local e determinístico que combina cinco arquétipos comprovados, cobertura ponderada de keywords, reordenação de evidências existentes e exportação multiformato no mesmo executável usado pela interface desktop.

## Operating Context

O fluxo principal é selecionar um arquétipo, editar seções, colar uma Job Description, revisar termos atendidos e ausentes, acompanhar o preview paginado e exportar. Automações usam `generate`, `tailor`, `batch` e `ui`, com arquivos JSON locais e saídas em diretórios escolhidos pelo operador.

## Capabilities and Constraints

- Cinco arquétipos nativos: frontend, full stack Node.js, full stack .NET, tech lead e internacional em inglês.
- Score ATS de 0 a 100 baseado em requisitos reconhecidos, com maior peso para termos obrigatórios.
- Tailoring só pode reordenar ou destacar evidências existentes; não pode fabricar fatos.
- Entradas JSON, textos de vaga e caminhos de saída devem ter schema, limites e proteção contra path traversal.
- PDF e DOCX devem usar uma coluna, texto selecionável, headings convencionais e nenhuma informação essencial em header, footer, imagem ou tabela complexa.
- Operação local-first, sem conta, telemetria ou envio automático de dados pessoais.
- Meta de distribuição: um único `.exe`; no Windows, a GUI utiliza o WebView2 disponível no sistema, enquanto a CLI permanece headless.

## Brand Commitments

- Nome: Reoli Resume Forge.
- Direção solicitada: Monochromatic Dark Tech / Clean Slate, premium, objetiva e sem aparência de template genérico.
- Tipografia moderna, alto contraste, microinterações funcionais e rolagem independente no split-view.
- Dados oficiais visíveis no currículo seguem o briefing do projeto, incluindo o portfólio `https://pedroreoli.vercel.app`.

## Evidence on Hand

- Motor validado: `E:\Hermes\vault\scripts\automation\cv_tailor.py` e `scripts\sdk\cv_tailoring.py`.
- Gerador e cinco perfis estruturados: `E:\Hermes\vault\scripts\gerador-curriculo\`.
- Catálogo mestre: `E:\Hermes\vault\carreira\curriculos\Meus Curriculos.md`.
- Dados mestres: `E:\Hermes\vault\Sobre Mim.md`.
- Especificação interna: `E:\Hermes\vault\.privado\sistemas\reoli-resume-forge.md`.
- Não existem depoimentos, clientes do produto, preço ou benchmarks próprios do aplicativo; a interface não deve inventá-los.

## Product Principles

1. Verdade profissional acima de otimização oportunista.
2. Evidência e rastreabilidade em cada adaptação.
3. Core independente da interface e reutilizado pela CLI.
4. Privacidade local por padrão.
5. Exportações simples, selecionáveis e previsíveis para ATS.

## Accessibility & Inclusion

A interface deve preservar semântica, navegação por teclado, foco visível, contraste WCAG 2.2 AA, touch targets de pelo menos 44 px e redução de movimento conforme `prefers-reduced-motion`.
