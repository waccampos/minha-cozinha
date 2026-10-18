# Cadastrar receitas por HTTP

O endpoint existente `POST /api/kitchen` aceita o comando `recipe.save` e
usa a mesma validação e transação do cadastro pelo formulário.
Não é necessário abrir o front ou enviar cookies.

## Exemplo com cURL

Execute na raiz do projeto. Substitua a URL pela origem do seu ambiente,
sem barra final. O valor de `Origin` deve corresponder à origem da URL
(protocolo, domínio e porta), ao `Host` preservado com o protocolo da URL,
ou constar em `APP_ORIGINS`. Requisições de navegador identificadas com
`Sec-Fetch-Site: same-origin` também são aceitas, mesmo que o proxy altere a
URL interna. O header `Origin` continua obrigatório; `cross-site` é recusado.

```sh
COZINHA_URL='http://localhost:3000'

curl --fail-with-body --request POST "$COZINHA_URL/api/kitchen" \
  --header "Origin: $COZINHA_URL" \
  --header 'Content-Type: application/json' \
  --data-binary @docs/backend/examples/recipe-create.json
```

Antes de enviar, ajuste `values.categories` no arquivo de exemplo para nomes de
categorias existentes. Consulte as categorias com:

```sh
curl --fail-with-body "$COZINHA_URL/api/kitchen"
```

O campo `categories` da resposta contém objetos com `id` e `name`.
Para cadastrar uma categoria, envie ao mesmo endpoint:

```json
{ "type": "category.save", "name": "Sobremesas" }
```

## Corpo e resposta

Veja o corpo completo em [examples/recipe-create.json](examples/recipe-create.json).
No Postman, use o mesmo endpoint e headers, selecione Body → raw → JSON e cole
o conteúdo do arquivo.

- Omita `id` no comando para criar uma receita. Cada envio cria um novo registro.
- Para editar, inclua `id` na raiz, junto de `type` e `values`, e envie todos os
  campos da receita.
- Os campos de `values` estão definidos em `src/schemas/recipe.schema.ts`.
  Envie `image: ""` para cadastrar sem foto e `notes: ""` sem observações.
  `tags` pode ser uma lista vazia.
- `difficulty`: `Fácil`, `Médio` ou `Avançado`.
- `temperature`: `Quente`, `Fria`, `Gelada` ou `Ambiente`.
- `flavor`: `Salgado`, `Doce` ou `Misto`.
- Ingredientes são objetos com `quantity`, `unit` e `name` (strings).
  Etapas são objetos com `text`.

Sucesso retorna HTTP **200**, com `id` numérico e `state` contendo o estado
atualizado da cozinha. Erros retornam `{ "error": "mensagem" }`:

| Status | Significado                                                           |
| ------ | --------------------------------------------------------------------- |
| 400    | JSON ou campos inválidos, ou categoria inexistente                    |
| 403    | `Origin` ausente/não permitido, ou requisição marcada como cross-site |
| 413    | Corpo acima de 512 KiB                                                |
| 415    | `Content-Type` diferente de `application/json`                        |
| 503    | Falha ao acessar os dados                                             |

## Imagem opcional

Envie primeiro o arquivo binário ao endpoint `POST /api/images`, com o mesmo
header `Origin` e o tipo de conteúdo da imagem:

```sh
curl --fail-with-body --request POST "$COZINHA_URL/api/images" \
  --header "Origin: $COZINHA_URL" \
  --header 'Content-Type: image/jpeg' \
  --data-binary @foto.jpg
```

Use o campo `path` retornado em `values.image`. O cadastro aceita caminhos
locais `/api/images/<uuid>`; não aceita URLs externas ou base64 nesse campo.
