# Minha Cozinha — migração fiel

Escopo autorizado: migrar o protótipo existente para Next.js App Router, preservando seus dez estados de página, textos, fotografias, CSS, animações e composição. Sem backend, autenticação ou novos serviços.

## Auditoria antes da implementação

- React 19, TypeScript estrito, Vite 8, Tailwind 4. Não há componentes shadcn instalados nem necessidade de introduzi-los.
- `src/App.tsx`: 303 linhas, 10 telas e componentes compartilhados no mesmo arquivo. Navegação feita por estado, sem URLs ou histórico.
- `src/data.ts`: 12 receitas e 4 categorias; passos compartilhados e fotografias Unsplash existentes.
- `src/index.css`: todo o design, fontes DM Sans/DM Serif Display, tokens de cores e breakpoints em 1050/900/780/480px. Predominam classes CSS próprias; Tailwind pode ser mantido integralmente.
- Favoritos, filtros, busca interpretada, inventário, checklist e passos funcionam em memória. Formulários não validam nem salvam; upload, adicionar etapa, planejamento e ações de compras têm controles simulados.
- Duplicação principal: metadados de receitas, arrays de demonstração dentro das telas, SVGs próprios. Substituir somente o mecanismo de ícones por Lucide, mantendo dimensões e classes.
- Dependências existentes são pequenas; remover Vite e seus plugins após a migração. Não há backend.

## Arquitetura

Rotas explícitas `/`, `/receitas`, `/favoritos`, `/busca`, `/planejamento`, `/compras`, `/receitas/nova`, `/receitas/[id]`, `/receitas/[id]/editar`, `/receitas/[id]/avaliar`, `/receitas/[id]/cozinhar`. Layout e páginas de entrada são Server Components. Componentes interativos são Client Components por funcionalidade. Contexto React compartilha receitas, favoritos, avaliações, planejamento e compras; localStorage preserva alterações apenas neste navegador.

Dados de demonstração em `src/data`; tipos de domínio em `src/types`; repositório de receitas em `src/features/recipes`; interpretação da busca em `src/features/search`. React Hook Form/Zod valida receitas e avaliações. Reutilizar marcação e CSS, com acréscimos restritos a erros de campos, foco, navegação e correções mobile. Imagens e fontes mantêm os recursos originais; não incluir serviço adicional.

## Validação

Build, lint separado, TypeScript, testes de repositório/busca/esquemas e navegação das rotas. Comparar telas desktop/mobile com o protótipo se o ambiente permitir navegador e instalação das dependências. Reportar limitações reais sem afirmar validações não executadas.
