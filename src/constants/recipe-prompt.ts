export const recipePrompt = `Quero uma receita de: [ESCREVA AQUI O PRATO OU O QUE VOCÊ QUER PREPARAR].
Preferências e restrições: [INGREDIENTES DISPONÍVEIS, RESTRIÇÕES, PORÇÕES OU TEMPO; DEIXE EM BRANCO SE NÃO HOUVER].

Organize sua resposta para eu cadastrar a receita manualmente no site Minha Cozinha. Escreva em português do Brasil e siga exatamente os títulos e a ordem abaixo. Entregue uma única receita completa, sem introdução, conclusão, JSON ou tabelas.

NOME DA RECEITA
Um nome claro, com até 120 caracteres.

DESCRIÇÃO
Um resumo do prato em uma ou duas frases.

CATEGORIA
Sugira uma única categoria curta, como Massas, Sobremesas, Bebidas ou Saudáveis. Se eu informar minhas categorias cadastradas, prefira uma delas.

TEMPO TOTAL EM MINUTOS
Informe um número inteiro, incluindo preparo, cozimento e descanso ou refrigeração. O formulário aceita de 1 a 1440 minutos. Se a receita precisar de mais de 24 horas, avise antes de apresentar uma adaptação viável; não reduza o tempo artificialmente.

RENDIMENTO
Informe a quantidade e o tipo de porção, por exemplo: 4 porções ou 12 unidades.

DIFICULDADE
Escolha exatamente uma: Fácil, Médio ou Avançado.

TEMPERATURA AO SERVIR
Escolha exatamente uma: Quente, Fria, Gelada ou Ambiente.

PERFIL DE SABOR
Escolha exatamente um: Salgado, Doce ou Misto.

INGREDIENTES
Apresente um ingrediente por linha, com os três campos separados, neste formato:
Quantidade: ... | Unidade: ... | Ingrediente: ...

Use apenas estas unidades: g, ml, un., xícara ou colher. Quando não houver unidade aplicável, escreva "sem unidade" para que eu deixe o campo de unidade vazio no site. Quantidades fracionárias podem usar 1/2 ou 1,5. Para itens a gosto, use Quantidade: a gosto | Unidade: sem unidade. Especifique o tipo de colher e o volume da xícara em Dicas e observações; converta medidas incompatíveis para g ou ml quando possível. Não misture a quantidade ou a unidade com o nome do ingrediente. Inclua todos os ingredientes usados nas etapas e não repita ingredientes desnecessariamente.

MODO DE PREPARO
Numere as etapas. Cada número deve corresponder a uma etapa que eu possa copiar para um campo do formulário. Inclua temperaturas do forno, tempos, sequência e sinais visuais do ponto correto, quando aplicáveis. Use apenas os ingredientes listados.

CARACTERÍSTICAS
Informe poucas etiquetas curtas, separadas por vírgulas. Só use termos como vegetariana, sem glúten ou sem lactose quando a composição realmente permitir, considerando os produtos utilizados.

DICAS E OBSERVAÇÕES
Reúna detalhes das medidas caseiras, substituições possíveis, conservação e dicas relevantes. Mantenha coerência com os ingredientes e o preparo. Se não houver observações, escreva "Nenhuma observação adicional".

Não invente imagens, links, avaliações ou experiências pessoais. Eu adicionarei a fotografia separadamente. Substitua as instruções de cada seção pelos dados reais da receita; não deixe campos genéricos na resposta.`;
