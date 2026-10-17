# Atualização para múltiplas categorias

A receita passa a ter de uma a 30 categorias cadastradas. O formulário permite seleção múltipla; cards e detalhes mostram os vínculos. O filtro da biblioteca aceita uma categoria por vez e encontra qualquer receita associada, sem duplicá-la. A pesquisa natural exige todas as categorias interpretadas: sobremesa saudável corresponde a Sobremesas e Saudáveis.

## Migration

`202610170002_multiple_categories` cria RecipeCategory, copia as associações de Recipe.categoryId e verifica se todos os vínculos foram preservados antes de remover a coluna antiga. A operação é transacional e limitada ao schema minha_cozinha. O índice por categoryId atende filtros e contadores, e a chave composta impede duplicações.

Essa alteração é incompatível com a aplicação anterior. Não mantenha uma instância antiga gravando durante ou após a migration. Se o bloqueio da tabela não puder ser obtido em dez segundos, a migration falha sem aplicar parcialmente as alterações; investigue conexões ativas antes de tentar novamente.

Uma falha pode deixar a migration registrada como pendente de resolução no Prisma (P3009). Antes de resolver, confirme no Beekeeper que Recipe.categoryId ainda existe e RecipeCategory não foi criada, comprovando o rollback da transação. Nesse caso específico, após corrigir o motivo da falha, registre o rollback e repita db:migrate:

```sh
docker compose --profile tools run --rm tools \
  node node_modules/prisma/build/index.js migrate resolve \
  --rolled-back 202610170002_multiple_categories
```

Se o estado não corresponder a um rollback completo, mantenha o app parado e investigue; não marque como aplicada nem tente recriar objetos manualmente.

Nenhuma migration é executada automaticamente ao iniciar o container. O código e os testes locais não comprovam execução desta migration no banco real.

## Aplicação no homelab

1. Termine a correção de dependências e a construção das imagens com o código novo e o lockfile atualizado do homelab. Não substitua o package-lock atualizado por uma cópia antiga do desenvolvimento.
2. Pare o serviço app, se estiver rodando, e o servidor de desenvolvimento que usa esse banco. Preserve os volumes. Não pare nem recrie o PostgreSQL existente.
3. Faça backup do schema e das imagens com a versão anterior ainda compatível, usando `npm run backup` e `backup:verify` conforme o README. Se estiver saindo do ambiente de desenvolvimento, faça o backup nesse ambiente para incluir o diretório de imagens que ele realmente utiliza; depois copie as fotos para o volume do Docker. Um volume recém-criado não contém as fotos do desenvolvimento.
4. Revise o SQL da migration e aplique manualmente:

```sh
docker compose --profile tools run --rm tools npm run db:migrate
```

5. Conectado ao banco minha_cozinha no Beekeeper como proprietário/administrador, confira e reaplique as permissões da nova tabela para a role da aplicação:

```sql
GRANT SELECT, INSERT, UPDATE, DELETE
ON TABLE minha_cozinha."RecipeCategory"
TO minha_cozinha_app;

SELECT COUNT(*) AS receitas_sem_categoria
FROM minha_cozinha."Recipe" r
WHERE NOT EXISTS (
  SELECT 1 FROM minha_cozinha."RecipeCategory" rc
  WHERE rc."recipeId" = r.id
);
```

O resultado deve ser zero. Se a sua role tiver outro nome, use esse nome no GRANT. As permissões dos outros projetos não são alteradas.

6. Inicie somente a nova aplicação:

```sh
docker compose up -d --no-deps app
docker compose ps
docker compose logs --tail=100 app
curl --fail http://10.0.0.117:3000/api/health
```

Confira uma receita antiga, selecione duas categorias e verifique os filtros por cada uma. Para validar CRUD e contagens no PostgreSQL, execute a integração com RUN_DATABASE_TESTS=1 somente em uma janela autorizada: ela cria e remove seus próprios registros identificados, sem resetar tabelas.

O código antigo não deve ser iniciado sobre o schema novo. Para voltar à versão anterior, é necessária restauração confirmada de um backup compatível; não há downgrade automático.
