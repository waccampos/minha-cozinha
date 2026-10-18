# Páginas e controllers

Organização definida e implementação solicitada pelo usuário:
`components/pages/<nome>/<nome>.page.tsx` e `<nome>.controller.ts`.

As páginas mantêm JSX, composição visual e ligação dos eventos. Os controllers
são hooks `useNomeController` com estados, efeitos, consultas, mutações,
handlers e preparação dos dados. Nenhum controller contém JSX ou acessa
infraestrutura do servidor diretamente.

- [x] Migrar home, modo cozinha, biblioteca e carregamento de receita.
- [x] Migrar detalhes, busca, compras e planejamento, incluindo handlers
      atualmente declarados dentro do JSX.
- [x] Atualizar imports, documentação e convenções; revisar a separação e
      executar testes existentes, lint, TypeScript e build.

Preservar DOM, classes, textos, payloads, callbacks de sucesso, estados de
diálogos, debounce, cancelamento, datas UTC e as correções anteriores.
Props continuam declaradas em tipos nomeados acima das funções.
`recipe-page` passa a `recipe-route`; `search-page` passa a `search`.
Formulários em `components/forms` e elementos compartilhados ficam no escopo
atual; esta mudança trata as oito páginas em `components/pages`.

Validação: 45 testes passaram, 1 integração PostgreSQL omitida por configuração;
lint, TypeScript e build passaram. Revisão independente comparou as oito telas
com os snapshots anteriores e não encontrou regressões concretas. Preparações
de sugestões identificadas na revisão também foram movidas para os controllers.
