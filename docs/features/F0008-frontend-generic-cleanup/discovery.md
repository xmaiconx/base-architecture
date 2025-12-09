# Discovery: Limpeza do Frontend - Tornar Genérico

**Branch:** refactor/F0008-frontend-generic-cleanup
**Date:** 2025-12-07

## Initial Analysis

### Commit History

**Recent commits analyzed:**
```
f881318 .
3dacf3c .
545bfae refactor(F0007): migrate from QStash to BullMQ + Redis hybrid architecture
a07bd49 refactor(F0006): migrate to Vercel serverless architecture with optimized workers
4624c8b refactor(F0005-fnd-easyflow-rebrand): rebrand template para FND EasyFlow
74370fa Merge pull request #1 from xmaiconx/refactor/F0004-supabase-env-config
3480e8b refactor(F0004): update documentation for getUserById to clarify key usage
8fc50e2 docs: add technical plan for F0004-supabase-env-config
6a41615 refactor(F0004): update Supabase env variables to match current dashboard nomenclature
```

**Key observations:**
- Template passou por várias refatorações de infraestrutura (Supabase, BullMQ, Railway)
- O rebrand para "FND EasyFlow" foi feito na F0005
- O frontend ainda mantém elementos do template original (consultório médico)

### Modified Files

**Files already modified in this branch:**
```
(Branch recém-criada - apenas docs de discovery)
```

### Related Functionalities

**Similar features in codebase:**
- F0002-template-cleanup-remove-messaging: Remoção de funcionalidades não usadas (padrão similar)

**Patterns identified:**
- Remoções devem ser feitas em cascata: rotas → constantes → componentes
- Build e typecheck devem passar após cada grupo de mudanças

## Strategic Questionnaire

### Category 1: Scope & Objective

**Q:** What is the main goal of this functionality?
**A:** Remover todo conteúdo específico de consultório/agendamento/finanças do frontend, tornando-o um template genérico.

**Q:** Who are the users/systems that will interact with it?
**A:** Alunos do FND que usarão o template para construir seus SaaS.

**Q:** What specific problem are we solving?
**A:** O template atual tem viés de consultório médico, exigindo limpeza manual antes do uso real.

### Category 2: Business Rules

**Q:** Are there specific validations or restrictions?
**A:** Build e typecheck devem continuar funcionando após as mudanças.

**Q:** How should error cases be handled?
**A:** N/A - é remoção de código, não adição de lógica.

**Q:** Are there dependencies on other functionalities?
**A:** Billing e Workspaces devem continuar funcionando normalmente.

**Q:** Are there limits, quotas, or throttling to consider?
**A:** Não aplicável.

### Category 3: Data & Integration

**Q:** What data needs to be persisted?
**A:** Nenhum dado novo. Apenas remoção de referências a dados mockados.

**Q:** Are there external integrations (APIs, services)?
**A:** Não. Apenas remoção de endpoints não implementados.

**Q:** Are asynchronous processes necessary?
**A:** Não.

### Category 4: Edge Cases & Failure Scenarios

**Q:** What happens in failure scenarios?
**A:** N/A - refatoração de limpeza.

**Q:** How to handle legacy data or migrations?
**A:** Não há dados para migrar.

**Q:** Are there performance or scalability concerns?
**A:** Não.

**Q:** Are there specific security considerations?
**A:** Não.

### Category 5: UI/UX (if applicable)

**Q:** How should the user experience be?
**A:** Dashboard limpo com mensagem de boas-vindas. Sidebar sem seção "Gestão".

**Q:** Are there specific loading/error states?
**A:** Manter padrão do sistema.

**Q:** Are there responsiveness requirements?
**A:** Manter responsividade existente.

## Decisions and Clarifications

### Decision 1: Conteúdo do Dashboard
**Context:** O dashboard atual tem 4 cards de stats + 2 seções de atividade. Precisávamos definir o que fica.
**Decision:** Dashboard terá apenas mensagem de boas-vindas com nome do usuário.
**Impact:** Componente dashboard.tsx será significativamente simplificado.
**Rationale:** Permite que cada aluno adicione os cards relevantes para seu projeto.

### Decision 2: Bullets do Auth Layout
**Context:** Os bullets atuais mencionam "pacientes e atendimentos" e "controle financeiro".
**Decision:** Substituir por bullets genéricos: "Multi-tenancy nativo", "Autenticação segura", "Pronto para escalar".
**Impact:** auth-layout.tsx será atualizado.
**Rationale:** Destacar as capacidades técnicas do template, não um caso de uso específico.

### Decision 3: Billing fora do escopo
**Context:** Billing está no menu de configurações, mas seria melhor no menu do usuário.
**Decision:** Reorganização do Billing será feature separada.
**Impact:** Menu Billing permanece onde está por enquanto.
**Rationale:** Manter escopo focado. Reorganização de menu é uma mudança diferente.

### Decision 4: Estrutura final da Sidebar
**Context:** Precisávamos definir o que sobra após remoção do menu "Gestão".
**Decision:**
- Dashboard
- Configurações: Perfil, Workspaces
**Impact:** Sidebar.tsx terá navegação simplificada.
**Rationale:** Manter apenas o essencial do template base.

## Assumptions & Premises

1. **Nenhum código backend será afetado**: Apenas frontend será modificado.
   - Impact if wrong: Backend pode ter controllers/routes não usados (cleanup futuro)

2. **Rotas removidas não têm deep links externos**: Usuários não dependem de /patients, etc.
   - Impact if wrong: Links quebrados (mas redirect 404 → dashboard já existe)

## Edge Cases Identified

1. **Imports de constantes removidas**:
   - Description: Arquivos que importam ROUTES.PATIENTS, etc.
   - Likelihood: Alta
   - Handling Strategy: Grep e remover todas as referências antes de remover constantes

2. **Ícones não utilizados**:
   - Description: Lucide icons importados mas não usados após limpeza
   - Likelihood: Média
   - Handling Strategy: Remover imports de ícones não utilizados

## Out of Scope Items

1. **Reorganização do Billing** - Será feature separada conforme solicitado pelo usuário
2. **Alterações no backend** - Escopo é apenas frontend
3. **Criação de novos componentes** - Objetivo é limpeza, não adição

## References

### Codebase Files Consulted
- `apps/frontend/src/pages/dashboard.tsx`: Dashboard com cards de consultório
- `apps/frontend/src/components/layout/Sidebar.tsx`: Menu de navegação
- `apps/frontend/src/lib/constants.ts`: Constantes de rotas e endpoints
- `apps/frontend/src/App.tsx`: Definição de rotas
- `apps/frontend/src/components/layout/auth-layout.tsx`: Layout de autenticação

### Documentation Consulted
- `CLAUDE.md`: Padrões e convenções do projeto

### Related Functionalities
- F0002-template-cleanup-remove-messaging: Padrão de remoção de funcionalidades

## Summary for Planning

**Executive Summary:**
Esta feature remove todo conteúdo específico de consultório médico do frontend, transformando o FND EasyFlow em um template genuinamente genérico. O escopo inclui: simplificar o dashboard para apenas boas-vindas, remover menu "Gestão" da sidebar, limpar rotas e constantes não utilizadas, e atualizar o auth-layout com mensagens genéricas.

A reorganização do Billing foi explicitamente deixada para feature separada. O objetivo é manter mudanças focadas e atômicas.

**Critical Requirements:**
- Build deve passar após todas as mudanças
- Typecheck deve passar sem erros
- Funcionalidades de auth, workspace e billing devem continuar funcionando

**Technical Constraints:**
- Apenas código frontend será modificado
- Nenhum componente novo será criado

**Next Phase Focus:**
O Planning Agent deve definir a ordem exata das edições para evitar erros intermediários de compilação. Recomendação: começar pelas rotas no App.tsx, depois Sidebar, depois constants, e por fim dashboard e auth-layout.
