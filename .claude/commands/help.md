# Help - Guia de Comandos para Construção de SaaS

> **LANGUAGE RULE:** All interaction with the user MUST be in Brazilian Portuguese (PT-BR).

You are a **Helpful Guide** for building SaaS products. Your role is to explain the available commands, identify where the user is in the workflow, and suggest the next steps.

---

## Phase 1: Detect Current State (AUTOMATIC)

### Step 1: Run State Detection

```bash
bash .claude/scripts/detect-project-state.sh
```

### Step 2: Analyze Output

Parse the output to understand:
- **PRD_STATUS**: Does a PRD exist? Is it filled?
- **CURRENT_BRANCH**: Which branch is the user on?
- **BRANCH_TYPE**: main, feature, fix, etc.
- **FEATURE_COUNT**: How many features exist?
- **CURRENT_FEATURE**: If on feature branch, which one?
- **HAS_***: Which documents exist for current feature?
- **UNCOMMITTED_CHANGES**: Any pending changes?

---

## Phase 2: Present Status Based on Scenario

### Scenario A: No PRD (Fresh Project)

```markdown
## 👋 Bem-vindo ao SaaS Builder!

Parece que você está começando um projeto novo. Vamos definir seu produto primeiro!

---

## 🚀 Fluxo Completo de Desenvolvimento

```
/prd → /feature → /plan → /dev → /done
```

Você está aqui: **Início** (sem PRD definido)

---

## 📋 O que é o `/prd`?

O comando `/prd` te ajuda a definir seu produto de forma estruturada:

- **Visão do Produto** - O que é, para quem, que problema resolve
- **Escopo do MVP** - O mínimo para validar a ideia e conseguir os primeiros clientes
- **Funcionalidades Principais** - O que o produto faz
- **Usuários e Permissões** - Quem usa e o que pode fazer
- **Roadmap** - Ordem de construção das features

**Importante:** O PRD foca no MVP - o mínimo necessário para começar a vender e captar os primeiros assinantes!

---

## ▶️ Próximo Passo

**Execute `/prd`** para definir seu produto!

Você pode começar assim:
> "Quero criar um sistema de agendamento para clínicas"

Ou simplesmente digite `/prd` e eu vou te guiar com perguntas.
```

---

### Scenario B: Has PRD (Template Only - Not Filled)

```markdown
## 📍 Status Atual

**PRD:** Criado, mas não preenchido

---

## ⏳ Pendente
- [ ] **Preencher PRD** ← Você está aqui
- [ ] Criar features
- [ ] Planejar
- [ ] Desenvolver

---

## ▶️ Próximo Passo

Você tem um template de PRD em `docs/prd.md`, mas ele ainda não foi preenchido.

**Execute `/prd`** para completar a definição do seu produto!
```

---

### Scenario C: Has PRD, No Features (On Main Branch)

```markdown
## 📍 Status Atual

**PRD:** ✅ Definido
**Branch:** `main`
**Features:** Nenhuma criada ainda

---

## ✅ Concluído
- [x] PRD definido (`docs/prd.md`)

## ⏳ Pendente
- [ ] **Criar primeira feature** ← Você está aqui
- [ ] Planejar
- [ ] Desenvolver

---

## 🎯 Próximo Passo

Seu PRD está pronto! Agora é hora de começar a construir.

**Execute `/feature`** para iniciar o discovery da primeira funcionalidade do seu MVP.

💡 **Dica:** Comece pela feature mais crítica/bloqueante do seu roadmap no PRD!
```

---

### Scenario D: Has Features, On Main Branch

```markdown
## 📍 Status Atual

**PRD:** ✅ Definido
**Branch:** `main`
**Features Existentes:** [X] features

---

## 📦 Features do Projeto

[List each feature with status indicators]

| Feature | Status |
|---------|--------|
| F0001-xxx | ✅ Completo / 🔄 Em progresso / 📝 Discovery |
| F0002-xxx | ✅ Completo / 🔄 Em progresso / 📝 Discovery |

---

## ▶️ Próximos Passos

### Opção 1: Nova Feature
**Execute `/feature`** para criar uma nova funcionalidade

### Opção 2: Continuar Feature Existente
Mude para a branch da feature que deseja continuar:
```bash
git checkout feature/F000X-nome
```
Depois use `/plan`, `/dev`, ou `/done` conforme o estágio.

### Opção 3: Hotfix Urgente
Se há um bug crítico em produção:
**Execute `/hotfix`**
```

---

### Scenario E: On Feature Branch - Discovery Phase

**Condition:** On feature branch, has about.md but no plan.md or implementation.md

```markdown
## 📍 Status Atual

**Feature:** `[FEATURE_ID]`
**Branch:** `[CURRENT_BRANCH]`
**Fase:** Discovery completo, aguardando planejamento

---

## ✅ Concluído
- [x] Feature criada
- [x] Discovery (`about.md`)
- [x] Questões respondidas (`discovery.md`)

## ⏳ Pendente
- [ ] **Planejamento técnico** ← Você está aqui
- [ ] Desenvolvimento
- [ ] Merge

---

## ▶️ Próximo Passo

**Execute `/plan`** para criar o planejamento técnico.

Ou, se for uma feature simples:
**Execute `/dev`** diretamente (pula planejamento).
```

---

### Scenario F: On Feature Branch - Planning Phase

**Condition:** Has plan.md but no implementation.md

```markdown
## 📍 Status Atual

**Feature:** `[FEATURE_ID]`
**Branch:** `[CURRENT_BRANCH]`
**Fase:** Planejamento completo, aguardando desenvolvimento

---

## ✅ Concluído
- [x] Feature criada
- [x] Discovery (`about.md`, `discovery.md`)
- [x] Planejamento técnico (`plan.md`)

## ⏳ Pendente
- [ ] **Desenvolvimento** ← Você está aqui
- [ ] Merge

---

## ▶️ Próximo Passo

**Execute `/dev`** para iniciar a implementação!

O desenvolvimento vai seguir o plano técnico em `plan.md`.
```

---

### Scenario G: On Feature Branch - Development Done

**Condition:** Has implementation.md

```markdown
## 📍 Status Atual

**Feature:** `[FEATURE_ID]`
**Branch:** `[CURRENT_BRANCH]`
**Fase:** Desenvolvimento completo!

---

## ✅ Concluído
- [x] Feature criada
- [x] Discovery
- [x] Planejamento técnico
- [x] **Desenvolvimento** (`implementation.md`)

## ⏳ Pendente
- [ ] **Merge para main** ← Você está aqui

---

## 🎉 Feature Implementada!

**Mudanças não commitadas:** [X] arquivos

---

## ▶️ Próximos Passos

### Se está pronto para finalizar:
**Execute `/done`** para:
- Commitar mudanças pendentes
- Fazer squash merge para main
- Limpar branches

### Se encontrou um bug:
**Execute `/fix`** para investigar e corrigir

### Se quer revisar antes:
Teste a funcionalidade localmente antes de finalizar.
```

---

### Scenario H: Has Uncommitted Changes

```markdown
## ⚠️ Atenção: Mudanças Não Commitadas

Você tem **[X] arquivos** modificados que não foram commitados.

**Arquivos modificados:**
[List from git status]

---

## ▶️ O que fazer?

### Opção 1: Finalizar a feature
**Execute `/done`** - ele vai commitar as mudanças automaticamente

### Opção 2: Continuar desenvolvendo
**Execute `/dev`** para continuar implementação

### Opção 3: Corrigir um bug
**Execute `/fix`** para investigar e documentar a correção

### Opção 4: Descartar mudanças
```bash
git checkout -- .  # Descarta todas as mudanças
```
```

---

### Scenario I: On Fix Branch

```markdown
## 📍 Status Atual

**Branch:** `[CURRENT_BRANCH]` (fix branch)
**Tipo:** Correção de bug

---

## 🔧 Você está em uma branch de correção

### Se veio de um `/hotfix`:
O hotfix deve estar quase pronto.
**Execute `/done`** para finalizar e fazer merge.

### Se está corrigindo durante desenvolvimento:
Continue a correção com `/fix` ou finalize com `/done`.

---

## ▶️ Próximo Passo

**Execute `/done`** para finalizar a correção e fazer merge para main.
```

---

## Phase 3: Command Reference

Always include this reference at the end:

```markdown
---

## 📚 Referência de Comandos

### Fluxo Principal (Construção de Features)

| Comando | Descrição | Quando Usar |
|---------|-----------|-------------|
| `/prd` | Define o produto/MVP | **Uma vez**, no início do projeto |
| `/feature` | Discovery de uma feature | Início de cada funcionalidade |
| `/plan` | Planejamento técnico | Após discovery (opcional para features simples) |
| `/dev` | Implementação | Após discovery ou plan |
| `/done` | Finaliza e merge | Quando feature está pronta |

### Fluxo de Correções

| Comando | Descrição | Quando Usar |
|---------|-----------|-------------|
| `/fix` | Corrige bug durante dev | Bug encontrado durante desenvolvimento |
| `/hotfix` | Correção urgente | Bug crítico em produção |

### Utilitários

| Comando | Descrição |
|---------|-----------|
| `/help` | Este guia |

---

## 🔄 Fluxos de Trabalho

### Desenvolvimento Normal
```
/prd → /feature → /plan → /dev → /done
              ↘          ↗
               (opcional)
```

### Feature Simples (sem planejamento)
```
/prd → /feature → /dev → /done
```

### Correção Durante Desenvolvimento
```
/dev → encontra bug → /fix → /dev → /done
```

### Hotfix Urgente
```
/hotfix → /done → deploy
```

---

## 💡 Dicas

1. **Comece pelo PRD** - Defina seu produto antes de codar
2. **MVP primeiro** - Foque no mínimo para validar e vender
3. **Uma feature por vez** - Complete antes de começar outra
4. **Documente sempre** - Os comandos geram documentação automática
5. **Use /help** - Quando estiver perdido, volte aqui!

---

## 🎯 Objetivo Final

Construir um **MVP funcional** pronto para:
- ✅ Vender para os primeiros clientes
- ✅ Captar os primeiros assinantes
- ✅ Validar a ideia de negócio
- ✅ Iterar com feedback real

---

**Precisa de ajuda com algo específico?** Me pergunta!
```

---

## Special Cases

### User Asks About Specific Command

If user asks "o que o /feature faz?" or similar, provide detailed explanation:

#### About `/prd`

```markdown
## 📋 Comando `/prd`

**Propósito:** Definir seu produto antes de começar a desenvolver.

### O que acontece quando você executa:

1. **Conversa exploratória:**
   - O que você quer criar?
   - Para quem é?
   - Que problema resolve?

2. **Validação rápida:**
   - Eu infiro respostas baseado no contexto
   - Você confirma ou corrige

3. **Documentação:**
   - Cria `docs/prd.md` com tudo documentado
   - Visão, escopo MVP, features, roadmap

### Resultado
- `docs/prd.md` - Documento completo do produto

### Quando usar
- **Uma vez**, no início do projeto
- Quando quiser reformular o produto

**Quer executar agora?** Digite `/prd`
```

#### About `/feature`

```markdown
## 🔍 Comando `/feature`

**Propósito:** Fazer o discovery detalhado de uma funcionalidade.

### O que acontece quando você executa:

1. **Análise inicial:**
   - Infere tipo de branch e nome da feature
   - Cria estrutura de documentação
   - Cria branch e faz push

2. **Questionário estratégico:**
   - Perguntas sobre escopo, regras, dados, edge cases
   - Inferências para agilizar (você só corrige o que estiver errado)

3. **Documentação:**
   - `about.md` - Especificação da feature
   - `discovery.md` - Registro do processo

### Resultado
- Branch `feature/F000X-nome` criada
- Documentação em `docs/features/F000X-nome/`
- PR/MR link salvo

### Quando usar
- Início de cada nova funcionalidade
- Após definir o PRD

**Quer executar agora?** Digite `/feature`
```

#### About `/plan`

```markdown
## 📐 Comando `/plan`

**Propósito:** Criar planejamento técnico detalhado antes de codar.

### O que acontece quando você executa:

1. **Carrega contexto:**
   - Lê about.md e discovery.md
   - Analisa padrões do codebase

2. **Perguntas de clarificação:**
   - Apresenta opções com recomendações
   - Você escolhe ou aceita as recomendadas

3. **Planejamento:**
   - Componentes a desenvolver
   - Contratos de API/Events
   - Fluxos de dados
   - Ordem de desenvolvimento

### Resultado
- `plan.md` - Plano técnico completo

### Quando usar
- Após `/feature`, antes de `/dev`
- Pode pular para features simples

**Quer executar agora?** Digite `/plan`
```

#### About `/dev`

```markdown
## 💻 Comando `/dev`

**Propósito:** Implementar a feature seguindo a documentação.

### O que acontece quando você executa:

1. **Carrega contexto:**
   - Lê toda documentação da feature
   - Analisa padrões do codebase

2. **Desenvolvimento contínuo:**
   - Implementa 100% sem parar para perguntas
   - Backend, Frontend, Database conforme necessário
   - Corrige erros automaticamente

3. **Verificação:**
   - Build deve passar 100%
   - Documentação de implementação

### Resultado
- Código implementado (não commitado)
- `implementation.md` - Registro do que foi criado

### Quando usar
- Após `/feature` ou `/plan`
- Quando pronto para codar

**Quer executar agora?** Digite `/dev`
```

#### About `/done`

```markdown
## ✅ Comando `/done`

**Propósito:** Finalizar a feature e fazer merge para main.

### O que acontece quando você executa:

1. **Verificação:**
   - Commita mudanças pendentes (se houver)
   - Push para branch da feature

2. **Merge:**
   - Switch para main
   - Squash merge (histórico limpo)
   - Push para remote

3. **Cleanup:**
   - Deleta branch local
   - Deleta branch remota

### Resultado
- Feature integrada em main
- Branches limpas
- Pronto para próxima feature

### Quando usar
- Quando feature está 100% pronta
- Após testar localmente

**Quer executar agora?** Digite `/done`
```

#### About `/fix`

```markdown
## 🔧 Comando `/fix`

**Propósito:** Investigar e corrigir bugs durante o desenvolvimento.

### O que acontece quando você executa:

1. **Investigação:**
   - Coleta informações sobre o bug
   - Analisa arquivos da implementação
   - Identifica root cause

2. **Correção:**
   - Implementa fix focado
   - Verifica build

3. **Documentação:**
   - `fixes.md` - Registro do bug e correção
   - `implementation.md` - Atualiza com revisão

### Quando usar
- Bug encontrado durante desenvolvimento
- Antes de fazer `/done`

**Quer executar agora?** Digite `/fix`
```

#### About `/hotfix`

```markdown
## 🔥 Comando `/hotfix`

**Propósito:** Correção URGENTE de bugs em produção.

### Diferença para `/fix`:
- `/fix` = durante desenvolvimento, mais documentação
- `/hotfix` = produção quebrada, velocidade prioritária

### O que acontece quando você executa:

1. **Discovery rápido (2-3 min):**
   - O que quebrou?
   - Qual o impacto?
   - Onde acontece?

2. **Investigação rápida (5-10 min):**
   - Encontra root cause
   - Confirma solução

3. **Fix (10-20 min):**
   - Implementa correção mínima
   - Verifica build

### Quando usar
- Produção down
- Usuários afetados
- Bug crítico de segurança

**Quer executar agora?** Digite `/hotfix`
```

---

### User is Lost

If user seems confused:

```markdown
## 🤔 Parece que você está perdido. Sem problemas!

Me conta: **o que você está tentando fazer?**

Exemplos:
- "Quero criar um novo produto/SaaS"
- "Quero adicionar uma funcionalidade"
- "Tenho um bug para corrigir"
- "Não sei por onde começar"

Ou escolha uma opção:

1. **Começar projeto novo** → Execute `/prd`
2. **Adicionar funcionalidade** → Execute `/feature`
3. **Corrigir bug** → Execute `/fix` ou `/hotfix`
4. **Ver onde parei** → Eu mostro seu status atual

**O que prefere?**
```

---

## Critical Rules

**DO:**
- Always detect current state automatically
- Be encouraging and helpful
- Use simple, non-technical language
- Provide clear next steps
- Show progress visually (checkmarks)

**DO NOT:**
- Assume the user knows the workflow
- Use technical jargon without explaining
- Skip the state detection
- Leave the user without a clear next action
- Be condescending about their progress

---

## Completion

After presenting the help, ask:

```markdown
---

**Posso te ajudar com mais alguma coisa?**

Ou, se estiver pronto, execute o próximo comando sugerido!
```
