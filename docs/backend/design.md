# Backend Minha Cozinha

A interface aprovada permanece como referência. A autorização é o pedido de implementação do backend; substitui a restrição anterior de não criar backend.

## Decisões

- PostgreSQL existente, Prisma 7 e schema exclusivo `minha_cozinha`. Nunca usar reset, db push ou recriar o banco existente. Aplicar apenas migrations versionadas com migrate deploy. DATABASE_URL é exclusivamente servidor e não é registrada nos logs.
- Cozinha compartilhada entre dispositivos confiáveis da LAN, sem contas individuais. Favoritos e lista atual pertencem à cozinha. Um único serviço valida todos os comandos Zod, aplica transações e devolve um snapshot consistente. Server Actions para interface; Route Handlers para snapshot, comandos, busca e imagens.
- Receitas, ingredientes ordenados, etapas, categorias, tags, favoritos, preparos, avaliações, agenda com datas reais, listas/itens e metadados de imagens. Avaliações são registros distintos vinculados a um preparo; editar preserva o restante do histórico.
- Imagens locais com nomes aleatórios e caminho configurável, limite de bytes e pixels, verificação e recodificação JPEG/PNG via sharp para remover metadados/conteúdo extra. Nenhuma URL remota enviada pelo usuário é buscada pelo servidor. Imagens sem referência são removidas por tarefa explícita após carência.
- Busca sem IA: interpretação determinística de tempo, temperatura, categorias, sinônimos e exclusões; filtros parametrizados e FTS PostgreSQL. pg_trgm opcional somente se já instalado, sem exigir privilégio de extensão.
- Backups restritos ao schema e armazenamento, com bloqueio consultivo coordenado entre aplicação e scripts. Restauração exige parada da aplicação e validação do manifesto; nunca restaura outro schema.
- Sem mocks em produção e sem persistência localStorage. Falhas são visíveis e não simulam gravação. Sincronização ao focar a janela e polling permitem atualização entre dispositivos.

## Verificação

Testes unitários de validação, interpretação, uploads e configuração; validação Prisma; lint, tipos e build. Teste de integração CRUD/transações e backup/restauração apenas em destino explicitamente configurado. Ausência de DATABASE_URL impede aplicação das migrations e comprovação ponta a ponta: registrar essa limitação, sem inventar acesso.
