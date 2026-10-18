# Organização técnica

Não há diretórios `features`, `modules` ou `domains`. Nomes como `recipe.service.ts` identificam o arquivo; não criam um agrupamento vertical contendo interface, validação e persistência.

```text
src/
  app/                    URLs, layouts e Route Handlers do Next.js
  actions/                Server Actions com validação de entradas
  components/
    ui/                   Primitivos visuais
    layout/               Navegação, shell e provider visual
    forms/                Formulários compostos e gerenciamento de opções
    common/               Cards, listas, filtros e imagens reutilizáveis
    pages/                Uma pasta por tela, com visual e controller
      home/
        home.page.tsx     JSX e composição visual
        home.controller.ts Estados, efeitos, handlers e dados da home
  server/
    services/             Regras, validação e coordenação transacional
    repositories/         Consultas, escrita Prisma e mapeamento dos resultados
    database/             Configuração, pool Prisma e transações
    storage/              Arquivos de imagem, validação e miniaturas
  schemas/                Contratos Zod compartilhados
  hooks/                  Navegação, contexto e estado compartilhado do navegador
  lib/                    Datas, normalização, interpretação e erros sem acesso a dados
  types/                  Tipos compartilhados não gerados
  constants/              Exemplos, artes decorativas e constantes estáticas
  generated/              Client Prisma gerado; não editar
  styles/                 CSS original e ajustes funcionais
```

## Fronteiras

A interface importa componentes, hooks e schemas. O hook de estado chama apenas a Server Action; não importa Prisma, repositórios nem credenciais. O provider em `components/layout` renderiza o contexto e os avisos, enquanto o controle de estado e a fila de operações ficam em `hooks/use-kitchen-controller.ts`.

Server Actions e Route Handlers compartilham o mesmo serviço de comandos. O serviço valida a entrada e abre a transação; regras de receitas, avaliações, compras e opções coordenam os repositórios na mesma transação. Operações simples delegam ao repositório sem criar uma classe ou uma camada extra vazia. Consultas somente de leitura podem ser chamadas diretamente por um componente servidor.

Repositórios contêm Prisma e SQL. `recipe.mapper.ts` compartilha a projeção/mapeamento usada na biblioteca, snapshot e pesquisa. Serviços de imagem coordenam os metadados do repositório e o armazenamento; o módulo de storage não consulta o banco. O parser de pesquisa é puro e fica em `lib/search-parser.ts`; filtros interpretados e tipos ficam separados da consulta SQL.

`app/` mantém as mesmas URLs. As composições complexas ficam em `components/pages`; formulários ficam em `components/forms`. A reorganização não altera migrations, registros persistidos ou seletores CSS da interface.

## Páginas e controllers

Cada tela segue `components/pages/<nome>/<nome>.page.tsx` e
`<nome>.controller.ts`. O controller exporta um hook `useNomeController`,
responsável por estados, efeitos, consultas, mutações, handlers e preparação
dos dados de apresentação. `.controller.tsx` pode ser usado caso seja
necessário, mas os controllers atuais não precisam de JSX.

A página chama seu controller e usa o resultado para renderizar a interface.
Condições de exibição, mapeamento de elementos e ligação de eventos continuam
no JSX. Cálculos, leitura de formulários, decisões de navegação e comandos
ficam no controller. Props têm tipos nomeados declarados acima das funções.

Controllers das telas usam `useKitchen`, navegação e contratos existentes;
não importam infraestrutura de servidor. Hooks compartilhados continuam em
`src/hooks`. Os formulários reutilizáveis de receita e avaliação permanecem em
`components/forms`, montados pela página `recipe-route`.

## Convenções de leitura

Imports são agrupados por origem. Funções, hooks, métodos e etapas lógicas são separados por linhas em branco; operações sequenciais curtas permanecem juntas. Prettier cuida da disposição das expressões e JSX. ESLint exige separação entre blocos, funções e retornos. O teste de arquitetura verifica a ausência de agrupamentos por feature e de acesso a Prisma na interface.
