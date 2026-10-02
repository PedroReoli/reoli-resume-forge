# Schema de perfil

O perfil é um objeto JSON serializável. Use `examples/profile.example.json` como ponto de partida.

Campos obrigatórios para exportação:

- `person.name`
- `headline`
- `summary`
- ao menos um item em `experience`

Coleções aceitas: `target_keywords`, `skills`, `soft_skills`, `experience`, `projects`, `education`, `languages` e `certifications`. `config.section_names` personaliza títulos, e `config.tech_label` personaliza o rótulo de tecnologias.

`config.template` preserva o modelo visual da variante editável. Valores aceitos: `classic`, `clean`, `compact`, `executive`, `tech-minimalist`, `modern-split`, `executive-bold` e `academic`. A GUI grava esse campo no JSON e o restaura ao importar. Perfis antigos ou sem o campo continuam válidos e usam `classic`.

`config.palette` preserva a identidade cromática independentemente do template. Valores aceitos: `template`, `reoli-navy`, `forest`, `cobalt`, `burgundy` e `graphite`. `template` mantém as cores nativas do layout; as outras opções usam presets de contraste revisados para tela, PDF e DOCX. A GUI também serializa em `config.colors` os valores `primary`, `dark`, `soft` e `divider` correspondentes, permitindo inspeção e evolução do schema. Para evitar combinações ilegíveis em documentos importados, a renderização usa o ID conhecido da paleta como fonte segura e normaliza seus valores; cores arbitrárias ainda não são aceitas.

Perfis antigos sem `config.palette` continuam válidos e recebem `template`, sem alteração visual. A CLI não possui uma flag separada de paleta: ela respeita a paleta armazenada no perfil ou arquétipo selecionado.

`config.typeface` controla a família tipográfica de forma independente do template. Valores aceitos: `template`, `modern-sans`, `editorial-serif` e `technical-mono`. O preview usa, respectivamente, a fonte nativa do layout, Inter, Georgia e JetBrains Mono; PDF e DOCX resolvem equivalentes seguros disponíveis nos respectivos formatos. Valores desconhecidos voltam para `template`, e perfis antigos continuam visualmente inalterados.

As aparências prontas da GUI não adicionam um campo opaco ao schema. Ao selecionar Reoli Clássico, Tech Focus, Product Clean, Leadership Bold, Editorial ou Visual Split, a aplicação atualiza em conjunto `config.template`, `config.palette`, `config.typeface`, `layout.density`, `layout.skills_style`, `layout.experience_style`, `layout.projects_style` e `layout.emphasize_metrics`. Conteúdo, ordem e visibilidade permanecem intactos. O JSON resultante continua legível e pode ser ajustado ou exportado pela CLI sem depender da GUI.

`layout.density` aceita `compact`, `balanced` ou `relaxed`. O valor não é apenas uma preferência de tela: ele controla margens, entrelinhas e espaçamento dos blocos no preview, PDF e DOCX. Valores ausentes ou desconhecidos usam `balanced`. O assistente de páginas pode recomendar outro preset, mas nunca remove conteúdo e registra a alteração como uma única ação reversível.

Na CLI, uma flag `--template` explícita substitui o valor salvo no perfil somente naquela exportação; sem a flag, o compilador usa `config.template` e depois o fallback `classic`. Essa troca de layout não remove a paleta persistida.

Limites do core: resumo de até 4.000 caracteres e no máximo 30 experiências ou 30 projetos. Campos desconhecidos dentro de `config` são preservados pelo modelo Rust; não armazene segredos no perfil.
