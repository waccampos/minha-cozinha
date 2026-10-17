# Múltiplas categorias — implementação

**Objetivo:** permitir que uma receita pertença a várias categorias, preservando os dados existentes.

**Proposta:** [design aprovado](../specs/2026-10-17-multiple-categories-design.md).

**Arquitetura:** relação explícita RecipeCategory; DTO e schemas usam categories. Services validam e coordenam associações transacionais; repositórios mantêm a persistência. A biblioteca filtra pela associação e a busca natural exige todas as categorias detectadas.

## Etapas

- [x] Escrever e executar testes de validação e interpretação de múltiplas categorias antes da alteração.
- [x] Alterar schema Prisma e preparar migration transacional que copie e confira os vínculos antes de remover a coluna antiga. Não executar no banco real.
- [x] Adaptar DTO, serviços, repositórios, contadores, filtros e pesquisa; adicionar testes das regras e das consultas.
- [x] Atualizar formulário, cards, detalhe, navegação das categorias do início e prompt do rodapé, preservando o design.
- [x] Atualizar integração e documentação operacional. Executar generate, testes, tipos, lint, formatação e build.

## Revisão

Não permitir seleções vazias, duplicadas ou inexistentes. Não duplicar receitas nas consultas. Manter ordenação estável das categorias e não criar prioridade implícita obrigatória. Proteger exclusão de categorias em uso. Incluir backup, manutenção e grants no procedimento de migration do homelab.

## Limites de validação

PostgreSQL e Docker não estão acessíveis neste ambiente. Os testes com banco real e a conferência visual devem ser registrados como pendentes, sem afirmar que foram executados.

## Resultado

30 testes locais passaram, um teste de integração real foi ignorado. Prisma generate e validate, TypeScript, lint, formatação e build local foram aprovados. O build usa Next 16.1.4 disponível neste ambiente; a atualização/auditoria do homelab deve ser preservada e revalidada lá.

A migration não foi aplicada. Conferência visual e teste real de preservação dos vínculos no PostgreSQL continuam pendentes. O healthcheck passou a exigir a tabela RecipeCategory para não anunciar prontidão antes da migration. O procedimento operacional está em docs/backend/multiple-categories.md.
