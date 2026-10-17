# Minha Cozinha

Aplicação de receitas para uma cozinha compartilhada na rede doméstica. Next.js App Router, React, TypeScript, Tailwind, Prisma e PostgreSQL existente. Mantém os componentes, cores e composição do projeto Figma Make. Cadastro, diário de preparos, avaliações, favoritos, agenda, compras e pesquisa usam o servidor; não há fallback de gravação em localStorage ou receitas fictícias.

**Estado desta entrega:** código, migrations, Compose e rotinas operacionais preparados. O build local foi validado com as dependências disponíveis no cache. O deploy está bloqueado pelo piso de segurança: o cache contém Next 16.1.4, mas é necessário atualizar para 16.4.1 ou superior. O usuário confirmou a criação do banco e dos usuários pelo terminal externo; a aplicação das migrations e o acesso real continuam pendentes. A conexão TCP deste ambiente permanece bloqueada (`Operation not permitted`). O daemon Docker está inacessível neste ambiente. Veja a sequência de validação antes de considerar o serviço em produção.

## 1. Pré-requisitos

- Docker Engine e Compose v2 ou superior no servidor Linux. Não há container PostgreSQL neste projeto.
- PostgreSQL **já existente**, versão 14 ou superior, acessível pelo servidor da aplicação; banco da aplicação e schema exclusivo `minha_cozinha`.
- Node.js 24 e npm para instalação local/manutenção. O lockfile controla as versões utilizadas.
- Diretório de backups com espaço suficiente. O Compose usa um volume nomeado para imagens.
- Internet somente para instalar dependências, construir imagens Docker e baixar uma vez as fontes/fotografias decorativas originais. Consultas, cadastro, pesquisa e uploads funcionam pela LAN sem serviços externos.

## 2. Dependências e assets antes do deploy

O [aviso oficial de 14/10/2026](https://nextjs.org/blog/nextjs-security-update-october-14-2026) exige Next 16.4.1 na linha 16. O piso verificado também exige React/React DOM 19.2.6 e Sharp 0.35.5. React e Sharp foram atualizados pelo cache; Next ainda precisa do registry. O Docker executa `security:check` e recusa o build com a versão antiga.

Em uma máquina com internet, execute e revise o lockfile gerado:

```sh
npm ci
npm run security:update
npm run security:check
npm audit --omit=dev
npm run assets:vendor
npm test
npm run lint
npm run typecheck
npm run build
```

`assets:vendor` guarda DM Sans, DM Serif Display e as quatro fotografias decorativas **originais** em `public/`, e remove a importação remota das fontes. Versione esses arquivos junto ao projeto. Não redesenha as imagens. Sem essa aquisição, as funcionalidades principais continuam locais, mas o visual pode usar fallback quando não houver internet. O download não foi possível neste ambiente por falha de DNS. Não use o cache offline como evidência de ausência de vulnerabilidades.

## 3. Variáveis de ambiente

Copie `.env.example` para `.env` e configure-o localmente; `.env` é ignorado pelo Git e pelo build Docker. Restrinja suas permissões a 0600. Não publique a saída de `docker compose config`, que pode revelar variáveis resolvidas.

| Variável                 | Uso                                                                                                                                             |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`           | Conexão PostgreSQL de runtime, com role restrita à aplicação. Nunca `NEXT_PUBLIC_*`.                                                            |
| `MIGRATION_DATABASE_URL` | Conexão opcional do proprietário para migrations/backup/restauração. Se ausente, usa DATABASE_URL.                                              |
| `IMAGE_STORAGE_DIR`      | Local: `./storage/images`. Compose força `/data/images` no volume persistente.                                                                  |
| `BACKUP_DIR`             | Local: `./backups`. Serviço tools usa `/backups`.                                                                                               |
| `BACKUP_HOST_DIR`        | Diretório de backups no host, montado somente no serviço tools.                                                                                 |
| `APP_ORIGINS`            | Origens exatas autorizadas para POST, separadas por vírgula, incluindo IP/DNS e porta. Sem curingas.                                            |
| `LAN_BIND_IP`            | IP privado do host para a porta publicada. Padrão `127.0.0.1`, acesso somente local.                                                            |
| `APP_PORT`               | Porta publicada, padrão 3000.                                                                                                                   |
| `PG_MAJOR`               | Cliente PostgreSQL no estágio tools, padrão 17. Use a mesma major do servidor ou cliente mais novo compatível. Não instala servidor PostgreSQL. |
| `APP_IMAGE_TAG`          | Tag local da imagem, útil para atualização e rollback.                                                                                          |

Exemplo de destino: `postgresql://minha_cozinha_app:SENHA@192.168.1.10:5432/minha_cozinha?schema=minha_cozinha`. Codifique caracteres reservados da senha na URL. O código força o schema exclusivo sem trocar o banco de destino.

A aplicação abre diretamente, sem login, senha ou sessão. Todos os dispositivos que alcançarem o serviço na rede privada compartilham os dados e podem cadastrar, editar e excluir registros. O acesso é delimitado pela rede e pelo firewall do servidor. As credenciais PostgreSQL continuam restritas ao servidor.

## 4. PostgreSQL e migrations

O pedido mais recente autoriza criar o banco `minha_cozinha` na instância existente em `10.0.0.117`. O [procedimento de provisionamento](docs/backend/provisioning.md) gera usuários próprios e documenta as permissões por schema, sem exigir alteração no pg_hba.conf. Nenhuma credencial administrativa deve permanecer na aplicação.

Prepare as roles e o schema conforme [docs/backend/operations.md](docs/backend/operations.md). O runtime não deve ser superusuário nem proprietário do banco. A role de migração precisa de DDL somente no schema da aplicação.

As migrations não são executadas no boot e não existe reset automático. Revise `prisma/migrations/` antes de executar. A migration inicial cria apenas objetos da aplicação e categorias de domínio; não insere receitas de demonstração.

```sh
npm run db:generate
npm run db:validate
npm run db:migrate
```

No Docker, depois de corrigir dependências e configurar `.env`:

```sh
docker compose build app tools
docker compose --profile tools run --rm tools npm run db:migrate
```

Depois aplique os grants de `infra/grants.sql` como proprietário, conforme a documentação operacional. O `prisma migrate deploy` mantém sua tabela de controle no schema `minha_cozinha`. Nunca execute `migrate reset` ou `db push` no banco compartilhado.

## 5. Build e inicialização Docker

O Dockerfile usa estágios de dependências, build, ferramentas e runtime standalone. Somente as variáveis necessárias são repassadas ao serviço web; a credencial de migração fica no serviço de ferramentas. A imagem web executa como UID/GID 1001, sem capabilities, com filesystem somente leitura e volumes para os arquivos mutáveis. Não recebe arquivos `.env` durante o build. O profile tools é uma execução manual, não um serviço permanente.

Prepare `BACKUP_HOST_DIR` para escrita pelo UID 1001. Não altere permissões recursivamente em diretórios de outros projetos. Volumes nomeados novos recebem o diretório `/data/images` com o UID correto a partir da imagem.

```sh
docker compose build app tools
docker compose --profile tools run --rm tools npm run db:migrate
# Aplicar os grants de runtime antes de iniciar o app.
docker compose up -d app
docker compose ps
docker compose logs --tail=100 app
curl --fail http://IP_DO_SERVIDOR:3000/api/health
```

`restart: unless-stopped` reinicia após falha do processo/reboot do Docker. O healthcheck verifica leitura do schema e escrita no armazenamento; retorna 503 quando não estiver pronto. O Compose marca `unhealthy`, mas **não reinicia automaticamente apenas por esse status**. Uma indisponibilidade temporária do banco não provoca loop de recriação nem perda de dados.

## 6. Rede local e acesso seguro

Defina `LAN_BIND_IP` como o IP privado **fixo ou reservado por DHCP** do servidor, por exemplo `192.168.1.20`. Defina `APP_ORIGINS=http://192.168.1.20:3000` e use `http://192.168.1.20:3000` no notebook/celular/tablet. Dispositivos precisam estar na mesma rede ou ter rota permitida. Redes de convidados costumam ter isolamento de clientes.

No firewall do host, autorize 3000 apenas da sub-rede doméstica. Portas publicadas pelo Docker podem contornar regras simples de UFW; aplique as regras na cadeia DOCKER-USER/nftables apropriada à sua instalação e teste de outra rede. Não crie NAT/port forwarding/UPnP no roteador. Não publique 5432. Se o banco estiver em outra máquina, permita conexão apenas a partir do host da aplicação, conforme [a configuração do PostgreSQL](docs/backend/operations.md).

Para nome amigável, crie um registro A `cozinha.home.arpa` no seu DNS local (roteador, Pi-hole ou AdGuard existente). Alternativamente, se o host já anunciar mDNS/Avahi, use `NOME_DO_HOST.local`; isso depende do suporte de cada dispositivo e da rede. Não é necessário instalar DNS/Avahi dentro do container. Acrescente a origem usada a `APP_ORIGINS`.

Se usar seu proxy reverso local existente com HTTPS, preserve o cabeçalho Host original e a origem/porta externa para Server Actions. Mantenha a verificação de origem e o serviço acessível apenas pela rede privada.

## 7. Imagens persistentes

O volume `minha-cozinha-data`, montado em `/data`, mantém as fotos e metadados operacionais entre reinícios e reconstruções. Não armazene uploads em `public/`, `.next/` ou `/tmp`. O banco guarda UUID, nome interno, MIME, dimensões e quantidade de bytes; as URLs públicas da aplicação são `/api/images/UUID` e são acessíveis diretamente pela rede privada.

Uploads aceitam JPEG/PNG de até 5 MB e 20 megapixels. O servidor valida assinatura, decodifica e recodifica, remove metadados e gera nomes aleatórios. Não usa nomes enviados pelo navegador como caminhos. Há leitura sem seguir symlinks e proteção de travessia de diretórios. Miniaturas WebP responsivas são geradas em `.cache/` dentro do armazenamento; são derivadas e não precisam de backup.

```sh
docker compose --profile tools run --rm tools npm run images:cleanup
```

A limpeza remove fotos sem referência há mais de 24 horas e arquivos órfãos antigos, incluindo miniaturas. Fotos ligadas a receitas/avaliações não são removidas. Uma imagem enviada mas nunca salva permanece durante a carência. Configure execução diária se desejar.

## 8. Backup, integridade e restauração

Backup é um diretório com `database.dump` (somente schema `minha_cozinha`), `images/` e `manifest.json`. O manifesto contém SHA-256 de cada arquivo, versão do formato, major do PostgreSQL e migrations aplicadas. Credenciais de conexão e senhas não são incluídas. Proteja e, se necessário, cifre os backups no host e mantenha uma segunda cópia em outra mídia.

A rotina usa o mesmo lock consultivo das mutações/limpeza para impedir alteração de fotos ou dados durante a captura. Cadastros podem aguardar ou falhar por timeout durante um backup longo; não recebem confirmação falsa. Pastas incompletas não são promovidas a backups válidos.

```sh
docker compose --profile tools run --rm tools npm run backup
# Substitua NOME_DO_BACKUP pelo diretório exibido ao concluir:
docker compose --profile tools run --rm tools npm run backup:verify -- NOME_DO_BACKUP
```

Use cliente `pg_dump` da mesma major do servidor ou mais novo compatível. Um cliente mais antigo não consegue exportar servidor mais novo; ajuste `PG_MAJOR` e reconstrua tools. O manifesto rejeita restauração para major PostgreSQL inferior à origem ou migrations que este código não conhece. Só restaure backups locais confiáveis; checksums detectam corrupção, não autenticam um arquivo malicioso.

**Restauração substitui somente os dados da aplicação no destino configurado. Exige confirmação explícita e aplicação parada.** Confira o destino da conexão sem divulgar a senha, faça backup atual e valide o backup escolhido primeiro:

```sh
docker compose stop app
docker compose --profile tools run --rm tools npm run backup
docker compose --profile tools run --rm tools npm run backup:verify -- NOME_DO_BACKUP
docker compose --profile tools run --rm tools npm run restore -- NOME_DO_BACKUP --confirm-restore
# Reaplique infra/grants.sql e migrations posteriores revisadas, se houver.
docker compose up -d app
```

O script verifica manifesto/checksums/compatibilidade/objetos do dump antes da importação. `pg_restore` usa transação única, `--schema=minha_cozinha`, sem restaurar ACLs ou proprietários. Não usa DROP CASCADE nem restaura outros schemas. Imagens novas são preparadas separadamente; as anteriores são preservadas em um diretório `.previous-UUID` no mesmo volume. Um marcador de manutenção bloqueia a aplicação se a troca de arquivos não terminar após a importação do banco. Nesse caso, mantenha o app parado, recupere `images/` do backup para `IMAGE_STORAGE_DIR`, valide e remova o marcador somente após reparar. Não apague o volume.

Exemplo de cron diário no host, com paths reais e log protegido:

```cron
15 3 * * * cd /srv/minha-cozinha && /usr/bin/docker compose --profile tools run --rm -T tools npm run backup >> /srv/minha-cozinha/backup.log 2>&1
45 4 * * * cd /srv/minha-cozinha && /usr/bin/docker compose --profile tools run --rm -T tools npm run images:cleanup >> /srv/minha-cozinha/backup.log 2>&1
```

Programe rotação dos logs e retenção dos backups conforme espaço/RPO desejado. Os scripts não excluem backups nem volumes automaticamente. Mensalmente, restaure uma cópia em um destino de teste explicitamente disponibilizado pelo administrador **na infraestrutura existente**, com diretório/volume de imagens separado e sem apontar para produção. Compare contagens, abra fotos e execute o roteiro de aceitação. Não há criação automática de outra instância/banco para esse teste.

## 9. Atualização e rollback

1. Execute backup e `backup:verify`; preserve a tag anterior da imagem.
2. Revise dependências, changelog e SQL das novas migrations. Rode `security:check`, auditoria online, testes, lint, tipos e build.
3. Gere os assets locais se necessário e construa novas imagens com outra `APP_IMAGE_TAG`.
4. Pare o app para migrations incompatíveis; execute manualmente `db:migrate` e os grants necessários.
5. `docker compose up -d --no-deps app`; confira healthcheck, abertura da página, uma receita e uma imagem.

O volume nomeado mantém o conteúdo. **Não use `docker compose down -v`, `docker volume rm` ou comandos prune com volumes.** Rollback de imagem exige compatibilidade com o schema atual; alterações de dados/estrutura podem exigir restauração confirmada do backup. Não há downgrade automático.

## 10. Performance, falhas e observabilidade

A biblioteca pagina no banco (12 receitas por página, máximo 48 por requisição), com filtros e ordenação estáveis. As listagens não carregam etapas/ingredientes. A tela inicial limita receitas completas e carrega detalhes sob demanda. Avaliações usam agregados gravados transacionalmente, evitando recalcular médias em cada listagem. Prisma reutiliza um pool de até oito conexões por processo, com timeout; não há conexão PostgreSQL no bundle do navegador.

Busca textual retorna no máximo 100 resultados, com FTS, sinônimos e filtros; pg_trgm é opcional. Exclusões continuam obrigatórias, sem substituição por sugestões que violem o pedido. Pesquisa por ingredientes não é uma certificação nutricional ou de alergênicos. A biblioteca tem paginação visual e imagens com lazy loading/miniaturas responsivas; não há workers offline nem fila de gravações local. O snapshot compartilhado atualiza ao focar a janela e a cada dez segundos; não substitui colaboração em tempo real.

Logs JSON vão para stdout/stderr com evento, nível, status e duração quando aplicável, sem corpos de formulários ou DATABASE_URL. O Docker limita o tamanho dos logs. `/api/health` só divulga `ok/unavailable`; detalhes internos não são públicos. Falhas do banco não confirmam gravação nem são convertidas em dados fictícios. Se a resposta de uma mutação for interrompida após o commit, atualize os dados antes de reenviar para evitar criar um segundo registro.

| Sintoma                            | Verificação                                                                                                                 |
| ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Docker build bloqueado             | Execute `security:update`, revise lockfile e rode `security:check`. Sem registry/DNS a atualização permanece pendente.      |
| `unhealthy`/503                    | Confira `.env`, grants, migrations, conexão do container ao banco e escrita do volume.                                      |
| Banco em outra máquina não conecta | Não use localhost; valide IP, DNS, TLS, pg_hba e firewall para o IP do host Docker.                                         |
| POST/Server Action recusado        | Confira APP_ORIGINS e Host/porta preservados pelo proxy. Não use curingas.                                                  |
| Foto não envia                     | JPEG/PNG, até 5 MB/20 MP, espaço no volume e UID 1001.                                                                      |
| Foto desaparece depois de recriar  | Confira o mesmo volume `minha-cozinha-data` e IMAGE_STORAGE_DIR=/data/images.                                               |
| Nome amigável falha no celular     | Configure DNS entregue pelo DHCP; teste o IP. mDNS pode estar bloqueado em redes convidadas.                                |
| Backup falha                       | Cliente pg_dump compatível, credencial de leitura/proprietário, diretório de backup gravável e todos os arquivos presentes. |
| Restauração ficou em manutenção    | Pare o app; confira manifesto, diretório de imagens e `.maintenance` conforme seção de restauração.                         |

## 11. Validação antes do uso permanente

```sh
npm test
npm run db:validate
npm run typecheck
npm run lint
npm run build
npm run security:check
# Integração apenas com conexão explicitamente configurada e schema migrado:
RUN_DATABASE_TESTS=1 npm run test:integration
```

A integração cria registros identificados exclusivamente para o teste e os remove no final; nunca reseta tabelas. Execute em janela de manutenção ou destino de teste autorizado. Sem DATABASE_URL/RUN_DATABASE_TESTS o teste fica explicitamente ignorado.

Roteiro de aceitação no home lab: abrir a aplicação em dois dispositivos; cadastrar receita com foto; favoritar; registrar dois preparos/avaliações; editar uma avaliação mantendo o outro registro; pesquisar ingredientes com exclusões; planejar refeições e gerar compras; reiniciar container; reconstruir imagem; conferir dados/fotos; simular perda temporária de conexão; executar backup e teste de restauração no destino autorizado. Esses testes dependem da infraestrutura e não foram apresentados como concluídos nesta entrega.

## Legibilidade do código

Use dois espaços de indentação, imports separados por origem e linhas em branco entre funções, hooks e etapas lógicas. Prettier organiza a estrutura; ESLint também verifica o espaçamento entre blocos. `npm run format` e `npm run lint` mantêm esse padrão.

## Estrutura de diretórios

A organização é por camadas técnicas, sem `src/features/` ou diretórios equivalentes. Consulte o [mapa de responsabilidades](docs/backend/architecture.md). Componentes ficam em `ui`, `layout`, `forms`, `common` e `pages`; schemas, hooks, serviços, repositórios, banco e storage têm diretórios próprios.
