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

Na CLI, uma flag `--template` explícita substitui o valor salvo no perfil somente naquela exportação; sem a flag, o compilador usa `config.template` e depois o fallback `classic`. Essa troca de layout não remove a paleta persistida.

Limites do core: resumo de até 4.000 caracteres e no máximo 30 experiências ou 30 projetos. Campos desconhecidos dentro de `config` são preservados pelo modelo Rust; não armazene segredos no perfil.
