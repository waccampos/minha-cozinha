# Avaliação de componentização

Avaliação do estado atual em 18/10/2026. Proposta de refatoração, sem mudança
de comportamento, layout ou contratos da API.

Após esta avaliação, as oito telas passaram a usar
`components/pages/<nome>/<nome>.page.tsx` e `<nome>.controller.ts`, conforme a
organização solicitada pelo usuário. Estados, efeitos, consultas, mutações,
handlers e preparação de dados já foram extraídos para os controllers das
telas. Os tamanhos abaixo se referem à versão anterior a essa separação;
as propostas de componentes visuais continuam como próximos passos.

## Diagnóstico

O projeto possui 33 componentes distribuídos em `common`, `forms`, `layout`,
`pages` e `ui`. Os elementos básicos já possuem boas fronteiras: `RecipeCard`,
`RecipeGrid`, `RecipeImage`, `IngredientList`, `RecipeSteps`, `Modal`,
`RatingStars` e `SearchBar`.

As oportunidades principais estão nas telas que acumulam consultas, estados,
formulários de edição, listas e modais. Tamanho ajuda a localizar esses casos,
mas a extração deve seguir uma responsabilidade identificável.

## Prioridades

### 1. Cadastro de receitas — 461 linhas

Arquivo: `src/components/forms/recipe-form.tsx`.

Separar as seções em `RecipeAboutFields`, `RecipeDetailsFields`,
`RecipeIngredientsFields`, `RecipeStepsFields` e `RecipeNotesFields`.
Os campos de características podem ficar em `RecipeTagsField`.

Manter o `useForm`, o resolver Zod, os valores iniciais, a submissão e os estados
de receita salva/taxonomia no formulário pai. Usar `FormProvider` e
`useFormContext<RecipeFormValues>` para compartilhar o formulário entre as
seções. Cada lista dinâmica deve ter um único `useFieldArray`, na seção que a
renderiza. Isso evita passar `register`, `control`, `errors` e operações de
arrays por muitas camadas.

`FormSection` pode encapsular o cabeçalho repetido das seções sem adicionar
elementos extras ao DOM. Todos os inputs continuam dentro do mesmo `<form>`.

### 2. Busca inteligente — 437 linhas

Arquivo atual: `src/components/pages/search/search.page.tsx`.

Há dois fluxos distintos: pesquisa por frase/filtros e pesquisa por ingredientes
disponíveis. Extrair `SearchQueryPanel`, `SearchFilters`, `SearchResults`,
`PantryIngredientsInput` e `PantryResults`.

Extrair as consultas para `useRecipeSearch` e `usePantrySearch`, mantendo seus
contratos específicos. Os hooks recebem critérios e devolvem resultados,
carregamento e erro; os componentes cuidam da interação e apresentação.

Preservar os estados dos dois modos ao alternar as abas: mantê-los no pai ou
nos hooks chamados pelo pai. A montagem condicional de um painel não deve
apagar a pesquisa anterior. Preservar cancelamento, debounce e foco após
adicionar ingredientes. Compartilhar o tipo do resultado de despensa, hoje
repetido entre a página e `PantryResult`.

### 3. Detalhes da receita — 361 linhas

Arquivo atual: `src/components/pages/recipe-detail/recipe-detail.page.tsx`.

Extrair `RecipeHero`, `RecipeNotes`, `RecipePreparationHistory` e
`PreparationEditDialog`. O histórico pode ter `RecipeReviewCard` e
`RecipePreparationCard`, pois as ações e o conteúdo dos dois registros são
diferentes.

Manter as mutações e a navegação no pai e fornecer callbacks com significado
explícito, como `onEditPreparation` e `onDeleteReview`. O diálogo de edição
de preparo pode possuir seu próprio formulário. Preservar as quebras de linha
das notas e as regras de exclusão de preparo e avaliação.

### 4. Lista de compras — 340 linhas

Arquivo atual: `src/components/pages/shopping-list/shopping-list.page.tsx`.

Extrair `ShoppingListToolbar`, `ShoppingProgress`, `ShoppingGroup`,
`ShoppingItemRow`, `ShoppingRecipeSummary`, `ShoppingListDialog` e
`ShoppingItemDialog`.

A página mantém seleção de lista, agrupamento e mutações. Os formulários
dos diálogos têm seus próprios limites e ciclo de interação; a separação
permite entender cada operação sem percorrer a página inteira. Preservar o
fluxo de criar e selecionar uma lista e fechar os diálogos somente após
confirmação da operação.

### 5. Planejamento e biblioteca — prioridade posterior

`weekly-planner.tsx` tem 217 linhas. Extrair `PlannerDayColumn` e
`MealSelectionDialog`, preservando a navegação móvel por dia, a grade no
desktop e o tratamento de datas em UTC.

`recipe-library.tsx` tem 242 linhas. Extrair `RecipeLibraryToolbar`,
`Pagination` e `useRecipeLibrary`. Preservar a chave estável dos favoritos,
o debounce e a posição do indicador de carregamento corrigidos anteriormente.

`home.tsx` tem 244 linhas. `HomeSearch` é uma extração útil porque concentra
texto, sugestões, foco e temporizador do placeholder. As demais seções já
reutilizam cards e grids e podem permanecer na página nesta primeira rodada.

## Reutilização transversal

- `ConfirmDialog`: usado inicialmente nas exclusões de receita, avaliação e
  lista de compras. Reutiliza `Modal`; recebe texto, rótulos e callbacks. O
  componente que executa a mutação continua responsável por decidir quando
  fechar o diálogo.
- `FieldError`: substitui a função `fieldError` do cadastro e as mensagens
  repetidas de avaliação. Deve preservar IDs e `role="alert"`, incluindo a
  associação acessível das categorias.
- Evoluir `Button` para aceitar atributos nativos, incluindo `type`,
  `disabled` e atributos `aria-*`, mantendo `type="button"` como padrão.
  Atualmente os formulários precisam usar botões HTML separados para submit.

## Organização e critérios

Manter as camadas técnicas atuais: `ui` para elementos genéricos, `common`
para blocos de apresentação, `forms` para campos e diálogos com formulário,
`pages` para composição das telas e `hooks` para lógica de consulta.
Os testes de arquitetura exigem essas pastas; não introduzir pastas de
feature ou arquivos de componentes dentro de `src/app`.

Todos os novos componentes têm export default e props nomeadas acima da
função, seguindo a convenção recém-adotada. Preferir props específicas e
callbacks a passar o contexto inteiro da cozinha. Evitar extrair um componente
apenas por conter algumas linhas de JSX estático.

## Sequência recomendada

1. Cadastro de receitas, `FieldError` e `FormSection`.
2. Detalhes da receita e `ConfirmDialog`; ampliar `Button` apenas com as
   necessidades dos usos migrados.
3. Lista de compras e planejamento.
4. Busca e biblioteca, com hooks específicos e verificações de debounce,
   cancelamento e preservação de estado ao alternar modos.

Em cada rodada: revisar a estrutura do DOM e as classes CSS, executar
TypeScript, lint e testes existentes e verificar os fluxos afetados. As
extrações não devem alterar payloads, validação, IDs dos campos ou chaves
das listas. Testes novos devem cobrir comportamento que possa mudar durante a
extração, sem se limitar à existência de novos arquivos ou componentes.
