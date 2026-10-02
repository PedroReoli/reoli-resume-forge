# Schema de perfil

O perfil é um objeto JSON serializável. Use `examples/profile.example.json` como ponto de partida.

Campos obrigatórios para exportação:

- `person.name`
- `headline`
- `summary`
- ao menos um item em `experience`

Coleções aceitas: `target_keywords`, `skills`, `soft_skills`, `experience`, `projects`, `education`, `languages` e `certifications`. `config.section_names` personaliza títulos, e `config.tech_label` personaliza o rótulo de tecnologias.

Limites do core: resumo de até 4.000 caracteres e no máximo 30 experiências ou 30 projetos. Campos desconhecidos dentro de `config` são preservados pelo modelo Rust; não armazene segredos no perfil.
