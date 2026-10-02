# Schema de perfil

O perfil é um objeto JSON serializável. Use `examples/profile.example.json` como ponto de partida.

Campos obrigatórios para exportação:

- `person.name`
- `headline`
- `summary`
- ao menos um item em `experience`

Coleções aceitas: `target_keywords`, `skills`, `soft_skills`, `experience`, `projects`, `education`, `languages` e `certifications`. `config.section_names` personaliza títulos, e `config.tech_label` personaliza o rótulo de tecnologias.

`config.template` preserva o modelo visual da variante editável. Valores aceitos: `classic`, `clean`, `compact`, `executive`, `tech-minimalist`, `modern-split`, `executive-bold` e `academic`. A GUI grava esse campo no JSON e o restaura ao importar. Perfis antigos ou sem o campo continuam válidos e usam `classic`.

Na CLI, uma flag `--template` explícita substitui o valor salvo no perfil somente naquela exportação; sem a flag, o compilador usa `config.template` e depois o fallback `classic`.

Limites do core: resumo de até 4.000 caracteres e no máximo 30 experiências ou 30 projetos. Campos desconhecidos dentro de `config` são preservados pelo modelo Rust; não armazene segredos no perfil.
