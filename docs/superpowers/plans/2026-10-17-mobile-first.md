# Minha Cozinha mobile-first — plano de implementação

**Objetivo:** adaptar os fluxos ao celular preservando a identidade aprovada.

**Arquitetura:** reutilizar componentes e operações existentes. Alterar apenas composição visual, estado local de seleção de dia e estilos responsivos; nenhuma mudança de backend ou dependências.

**Stack:** Next.js, React, TypeScript, CSS e Lucide.

**Proposta aprovada:** [mobile-first-proposal.md](../../mobile-first-proposal.md).

## Etapas

- [x] Navegação: alterar `navigation.tsx`, `shell.tsx` e `icon.tsx` para barra inferior mobile com cinco destinos e ação visível de nova receita. Preservar navegação desktop e ocultar barra no modo cozinha.
- [x] Planejamento: adaptar `weekly-planner.tsx` para seleção acessível de um dos sete dias. Reutilizar os mesmos cards, operações e modal; manter grade de desktop. Identificar hoje pela data real.
- [x] Conteúdo e formulários: priorizar ingredientes e itens de compras no CSS mobile, reduzir hero e espaços excessivos, ampliar controles e reorganizar ingredientes. Adicionar botão de salvar ao final do formulário no celular.
- [x] Verificação automatizada: formatação dos arquivos alterados, lint, tipos, testes existentes e build. Revisar diferenças de seletores e breakpoints. Verificar visualmente se houver navegador disponível.

## Pontos de revisão

- Barra inferior não deve cobrir conteúdo, foco, filtros ou diálogos; respeitar safe area.
- Dia selecionado mantém os dados e o índice da refeição ao trocar de semana.
- Nomes longos e telas estreitas não devem causar overflow da página.
- Salvar continua condicionado ao resultado real da operação existente.
- Desktop mantém seus cinco destinos, calendário e composição original.

## Registro

Execução autorizada pelo usuário em 17/10/2026. Sem nova rodada de aprovação.

Navegador indisponível: o inventário de Computer Use retornou zero browsers e zero apps. Validação visual deve ser declarada pendente se isso não mudar.

## Resultado

- Navegação inferior aplicada até 960 px para evitar cabeçalho apertado em tablets; adaptações de conteúdo até 780 px.
- Planejamento mostra o dia selecionado no celular, com data anunciada e refeições identificadas; grade semanal mantida acima de 780 px.
- Conteúdo, formulários e controles adaptados sem novas dependências ou alterações de persistência.
- Revisão dos seletores corrigiu a prioridade dos campos de formulário, o posicionamento da confirmação de salvamento e o fechamento dos filtros.
- Build, lint e verificação de tipos concluídos sem erros. Testes existentes: 22 passaram e um teste de integração com PostgreSQL foi ignorado.
- Validação visual e interações em navegador permanecem pendentes por indisponibilidade de navegador neste ambiente.
