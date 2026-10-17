# Preparação para home lab

Ampliação do plano de backend pelo pedido da etapa 5. Reaproveitar schema isolado e componentes. A validação em infraestrutura real depende de .env e acesso ao daemon Docker.

- [x] Acesso direto pela rede privada, sem autenticação da aplicação, conforme pedido posterior. Manter validação de entradas, uploads e origem das requisições.
- [ ] Imagem multi-stage standalone sem segredos, usuário sem privilégios, Compose apenas aplicação, volume persistente e manutenção manual em profile tools.
- [ ] Healthcheck sem detalhes públicos, logs estruturados sem dados/segredos.
- [ ] Otimizar consultas e listas, imagens locais e busca; manter exclusões estritas.
- [ ] Backup/restauração com checksums, versões e confirmação, documentação de agendamento e LAN.
- [ ] Executar testes de segurança/regras, tipos, lint, build, Compose config e Docker/DB somente se disponíveis; distinguir implementado de comprovado.
