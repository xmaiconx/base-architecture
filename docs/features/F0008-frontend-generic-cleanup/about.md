# Task: Limpeza do Frontend - Tornar Genérico

**Branch:** refactor/F0008-frontend-generic-cleanup
**Date:** 2025-12-07

## Objective

Remover do frontend todas as referências específicas a consultório médico, agendamentos e finanças, transformando o template em uma base genérica que os alunos do FND podem customizar para qualquer tipo de SaaS.

O dashboard atual possui cards e seções com dados mockados de um sistema de consultório (pacientes, atendimentos, receitas), o que limita a percepção do template como ferramenta genérica. Esta refatoração elimina esse viés específico, deixando uma estrutura limpa e pronta para personalização.

## Business Context

**Why this functionality is needed:**
O FND EasyFlow é um template base para construção de SaaS diversos. Manter referências a um nicho específico (consultório médico) confunde os alunos e exige trabalho extra de remoção antes de iniciar seus próprios projetos.

**What problem it solves:**
Elimina o retrabalho dos alunos em limpar código específico de domínio, permitindo que iniciem diretamente com uma base neutra e profissional.

**Who are the stakeholders:**
- Alunos do FND que usarão o template
- Instrutores que ensinam com o template
- Mantenedores do template

## Scope

### What IS included
- Remoção dos cards de estatísticas do dashboard (Pacientes, Atendimentos, Receita, Crescimento)
- Remoção das seções "Próximos Atendimentos" e "Atividade Recente" do dashboard
- Remoção do menu "Gestão" da sidebar (Pacientes, Atendimentos, Financeiro)
- Remoção das rotas /patients, /appointments, /finances do App.tsx
- Limpeza das constantes ROUTES, API_ENDPOINTS e QUERY_KEYS relacionadas
- Atualização dos bullets do auth-layout para mensagens genéricas

### What is NOT included (out of scope)
- Reorganização do menu Billing (será feature separada)
- Alterações no backend
- Modificações em componentes de workspace, billing ou auth
- Criação de novos componentes para o dashboard

## Business Rules

### Validações
1. **Build Success**: O projeto deve compilar sem erros após as remoções
2. **No Broken Imports**: Todas as referências removidas devem ser limpas em cascata

### Flows

#### 1. Main Flow (Happy Path)
- Step 1: Usuário faz login
- Step 2: É redirecionado para o dashboard
- Step 3: Vê mensagem de boas-vindas simples
- Step 4: Pode navegar para Settings (Perfil, Workspaces)

#### 2. Alternative Flows

**Cenário A: Novo usuário**
- Após signup, é direcionado ao dashboard limpo
- Experiência consistente sem elementos confusos

#### 3. Error Flows

**Sem erros específicos** - Esta é uma refatoração de limpeza, não adiciona lógica nova.

## Integrations

### External APIs
Nenhuma integração nova. Apenas remoção de referências a endpoints não implementados.

### Internal Services
Nenhuma alteração em serviços internos.

## Edge Cases Identified

1. **Imports órfãos**:
   - Description: Componentes ou hooks que importavam constantes removidas
   - Handling: Verificar todos os arquivos que usam constants.ts

2. **Rotas quebradas em bookmarks**:
   - Description: Usuários com /patients, /appointments ou /finances salvos
   - Handling: Já existe redirect para /dashboard no catch-all 404

## Acceptance Criteria

1. [ ] Dashboard exibe apenas mensagem de boas-vindas com nome do usuário
2. [ ] Sidebar não possui mais seção "Gestão"
3. [ ] Rotas /patients, /appointments, /finances não existem mais
4. [ ] Auth layout mostra bullets genéricos ("Multi-tenancy nativo", "Autenticação segura", "Pronto para escalar")
5. [ ] Build passa sem erros (npm run build)
6. [ ] Typecheck passa sem erros (npm run typecheck)

## Next Steps

O Planning Agent deve focar em:
1. Ordem de edição dos arquivos para evitar erros intermediários
2. Verificar se há outros arquivos que referenciam as constantes removidas
3. Definir o conteúdo exato do dashboard simplificado
