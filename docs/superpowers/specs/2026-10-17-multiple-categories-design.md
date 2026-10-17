# Múltiplas categorias por receita

Status: aprovado pelo usuário em 17/10/2026.

## Problema

Atualmente Recipe possui um categoryId obrigatório. Formulários, DTOs, cards, filtros, pesquisa SQL e indexação textual também assumem apenas uma categoria. Uma sobremesa saudável deve poder pertencer a ambas, sem duplicar a receita ou transformar categorias em tags.

## Modelo e preservação de dados

Adicionar uma relação explícita RecipeCategory com chave composta recipeId/categoryId e índice por categoryId. Cada receita deve ter ao menos uma categoria existente, sem vínculos duplicados. A gravação da receita e de suas associações permanece transacional.

A migration deve copiar todos os vínculos atuais para a nova relação antes de substituir a coluna antiga. Nenhuma receita, categoria, imagem, avaliação ou histórico deve ser excluído. Preparar a migration no repositório, sem executá-la no banco do usuário. Antes da aplicação no homelab, fazer backup e interromper as gravações da versão antiga. Não manter duas fontes definitivas para a mesma associação.

Manter a proteção contra excluir categorias em uso. Renomear uma categoria deve atualizar a indexação de todas as receitas associadas.

## Interface

Substituir o seletor único por opções de múltipla seleção com rótulos visíveis, áreas de toque e indicação das categorias selecionadas. Não criar uma categoria principal obrigatória. Mostrar todas as categorias no detalhe; nos cards, usar uma apresentação compacta que não cubra o botão de favorito e permita identificar as demais categorias.

Manter a identidade visual existente e a arquitetura por camadas técnicas. Atualizar também o prompt do rodapé para pedir categorias, no plural.

## Filtros e pesquisa

O filtro de categoria da biblioteca continua selecionando uma categoria por vez, mas passa a verificar qualquer associação da receita. Uma receita marcada como Saudáveis e Sobremesas aparece nas duas consultas, sem duplicação. Contadores representam receitas distintas por categoria; o total da biblioteca continua contando cada receita uma vez.

Na busca natural, reconhecer várias categorias quando presentes e exigir todas as categorias identificadas, por exemplo sobremesa saudável. Os filtros de ingredientes, exclusões, tempo e temperatura continuam funcionando. Indexar os nomes de todas as categorias.

## Validação

Testar a aceitação de múltiplas categorias, rejeição de seleção vazia e duplicada, validação de categorias inexistentes, substituição de vínculos na edição, filtros por cada categoria, busca combinada, contadores e migração dos vínculos antigos. Confirmar transações e ausência de consultas concorrentes na mesma conexão.

Executar Prisma generate, testes, lint, tipos, formatação e build. Declarar separadamente a integração com PostgreSQL real e a validação visual se indisponíveis no ambiente.

## Deploy em andamento

O usuário está preparando o Orange Pi em 10.0.0.117. A atualização do Next e a auditoria foram executadas; o último relatório ainda apresenta vulnerabilidades com correções via npm audit fix. O próximo passo orientado foi corrigir dependências, ajustar PG_MAJOR para 16 e construir as imagens. A aplicação desta mudança exige incluir a nova migration no roteiro antes de subir o novo app. Não executar provisionamento de banco novamente.
