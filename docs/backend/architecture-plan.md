# Refatoração por camadas técnicas

Pedido autorizado: eliminar features e quaisquer diretórios equivalentes por domínio, mantendo URLs, interface e comportamento. Não alterar schema/migrations ou conteúdo persistido nesta etapa.

- [x] Mapear componentes para ui, layout, forms, common e pages; manter composições complexas fora de app.
- [x] Centralizar schemas em schemas, regras puras em lib, valores estáticos em constants e Server Actions em actions.
- [x] Separar Prisma/configuração em server/database, regras em services, consultas em repositories e arquivos em storage.
- [x] Separar o provider visual do hook de estado/ações compartilhadas, sem alterar o contrato dos componentes.
- [x] Atualizar imports, scripts, testes e documentação; remover diretórios antigos efetivamente.
- [x] Validar estrutura, espaçamento, testes, tipos, lint e build. Deploy real continua condicionado à conexão, Docker e atualização de segurança já documentados.
