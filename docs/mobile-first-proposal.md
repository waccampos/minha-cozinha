# Minha Cozinha — proposta mobile-first

Status: direção aprovada pelo usuário em 17/10/2026.

## Avaliação do código atual

A aplicação usa Next.js App Router e componentes separados por responsabilidade técnica. As alterações visuais podem reaproveitar essa estrutura, sem modificar persistência, serviços, rotas ou regras de negócio.

Os estilos atuais usam uma base de desktop com adaptações em 1050, 900, 780 e 480 px. Existem regras distribuídas para os mesmos componentes. O problema não é apenas o tamanho da tela: algumas prioridades de conteúdo continuam próprias de desktop.

- Navegação principal escondida atrás do menu no celular; adicionar receita também depende desse menu.
- Foto principal com 400 px de altura em telas até 480 px e seções com 65 px de espaçamento vertical.
- Planejamento com sete colunas e larguras mínimas, exigindo deslocamento horizontal.
- Notas da receita posicionadas antes dos ingredientes no celular.
- Resumo das receitas planejadas posicionado antes dos itens da lista de compras.
- Controles como os botões de semana, de 35 px, pequenos para toque.
- Formulários conservam uma coluna lateral de numeração mesmo em telas estreitas.

Esta avaliação é baseada no código. Não foi feita inspeção visual da aplicação em execução nesta etapa.

## Alternativas

1. Ajustar apenas espaçamentos: menor impacto visual, mas mantém a navegação escondida e o planejamento horizontal.
2. Adaptar os fluxos para celular, preservando a identidade: recomendação. Navegação acessível, conteúdo prioritário primeiro e controles confortáveis para toque.
3. Redesenhar toda a interface: maior mudança visual e escopo; desnecessário para este objetivo.

## Direção recomendada

### Identidade e navegação

Manter verde, creme, terracota, tipografia editorial, fotos e acabamento dos cards. No celular, usar barra inferior com Início, Receitas, Favoritos, Semana e Compras; manter o nome completo de cada destino nos rótulos acessíveis. O cabeçalho passa a ter uma ação visível para adicionar receita. No desktop, manter a navegação atual.

Reservar espaço para a barra inferior e a área segura do dispositivo. Não mostrar a barra no modo de preparo. Diálogos e filtros devem ficar acima dela, sem ações encobertas.

### Início e pesquisa

Diminuir título, foto de destaque e espaçamentos verticais no celular para aproximar pesquisa e receitas do início da tela. Preservar textos, categorias e seções existentes. Manter sugestões roláveis sem barras visíveis, conforme solicitado anteriormente.

### Receitas e formulários

Usar cards com imagens proporcionais e títulos legíveis. Manter uma coluna em celulares estreitos e expandir a grade conforme houver espaço. Dar prioridade a iniciar preparo, ingredientes e etapas; colocar notas e informações complementares depois.

Nos formulários, aproveitar toda a largura disponível, reorganizar quantidade, unidade e ingrediente com rótulos claros e tornar salvar fácil de localizar sem cobrir o teclado ou campos. Manter as validações e mensagens de persistência existentes.

### Planejamento e compras

No celular, oferecer seleção de dia e suas refeições em lista vertical, mantendo acesso aos sete dias e controles para mudar de semana. Preservar o calendário semanal de desktop. Reutilizar as mesmas operações de adicionar, editar, remover refeição e gerar compras.

Na lista de compras, mostrar os itens antes do resumo das receitas. Aumentar áreas de toque de seleção e edição, permitindo quebra de nomes longos.

### Acessibilidade e responsividade

Aplicar áreas de toque de pelo menos 44 × 44 px aos principais controles. Usar fonte de pelo menos 16 px em campos no celular para evitar zoom involuntário. Manter foco visível, rótulos, navegação por teclado e movimento reduzido. Consolidar os estilos alterados em regras previsíveis; não reescrever o CSS inteiro.

## Validação prevista

- Revisar início, biblioteca, busca, favoritos, detalhe, formulário, avaliações, planejamento e compras nas larguras 360, 390, 768 e 1280 px, quando houver navegador disponível.
- Conferir nomes longos, listas vazias, diálogos, teclado, ações pendentes e ausência de sobreposição pela barra inferior.
- Executar lint, TypeScript, formatação e build após a implementação.
- Testar a seleção de dias se houver extração de lógica; evitar testes que apenas reproduzam classes CSS.
- Registrar separadamente qualquer verificação visual ou de integração indisponível no ambiente.
