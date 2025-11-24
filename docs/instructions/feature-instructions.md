## Workflow de Desenvolvimento Completo

### FASE 1: Branch Management

**APÓS o Task Discovery Agent ter criado a documentação:**

1. **Verificar branch atual**
   - Execute: `git branch --show-current`

2. **Se estiver em `main` ou `master`:**
   - **Usar o nome da pasta criada pelo Discovery Agent:**
     - A pasta `docs/features/Fxxxx-nome/` já foi criada
     - O nome da branch deve ser IDÊNTICO ao nome da pasta (sem o prefixo `docs/features/`)
   - Criar nova branch seguindo convenções:
     - `feature/` - para novas funcionalidades
     - `fix/` - para correções de bugs
     - `refactor/` - para refatorações
     - `docs/` - para documentação
   - **IMPORTANTE:** O nome da branch DEVE incluir o ID sequencial (Fxxxx) determinado pelo Discovery
   - Padrão de nome: `tipo/Fxxxx-nome-da-pasta`
   - Exemplo: Se pasta é `F0005-jwt-authentication` -> Branch `feature/F0005-jwt-authentication`
   - Execute: `git checkout -b [tipo]/[nome-da-pasta]`

3. **Abrir Pull Request em Draft Mode:**
   - Após o primeiro commit, criar PR em modo draft
   - Título: Descrição clara da tarefa
   - Descrição: Objetivos e contexto da tarefa

---

### FASE 2: Planning Agent

**Agent Name:** "Technical Architecture & Planning Specialist"

**Quando Executar:**
- Somente APÓS o Task Discovery Agent ter concluído e você ter aprovação do usuário no documento de tarefa

**Responsabilidades:**
1. Analisar documento de tarefa criado
2. Planejar arquitetura técnica completa
3. Definir contratos de API
4. Definir eventos/comandos assíncronos
5. Garantir integração 100% entre componentes
6. Criar plano de desenvolvimento detalhado

**Contexto a Carregar:**
- Documento de tarefa: `docs/features/[Fxxx]-[nome-da-branch]/about.md`
- Documento de discovery: `docs/features/[Fxxx]-[nome-da-branch]/discovery.md`
- Arquitetura atual do projeto (TUDO)
- Padrões de API existentes
- Padrões de workers/eventos existentes
- Convenções de código do projeto
- Bibliotecas e frameworks utilizados
- Exemplos de implementações similares
- Estrutura de pastas completa
- Configurações de build e deploy

**IMPORTANTE - Consistência:**
- O nome da pasta em `docs/features/` é determinado pelo Discovery Agent
- O nome da branch deve ser IDÊNTICO ao nome da pasta (com o prefixo apropriado)
- Exemplo: Pasta `docs/features/F0005-login/` -> Branch `feature/F0005-login`

**Output:** Criar `docs/features/[FXXXX]-[nome-da-branch]/plan.md`

**Estrutura do Plano:**

```markdown
# Technical Plan: [Nome da Tarefa]

## Visão Geral da Solução
[Descrição de alto nível da solução técnica - 3-4 parágrafos]

## Componentes a Desenvolver

### Backend - API
- Endpoints necessários
- Responsabilidades de cada endpoint

### Backend - Workers/Jobs
- Workers necessários
- Responsabilidades de cada worker

### Frontend
- Páginas/Componentes necessários
- Responsabilidades de cada componente

## Contratos de Integração

### API Contracts

#### Endpoint: [Nome do Endpoint]
**Rota:** `[METHOD] /api/v1/resource`

**Request:**
- Headers necessários
- Query parameters
- Body structure (descrição conceitual)
- Validações

**Response:**
- Status codes possíveis
- Response structure (descrição conceitual)
- Headers de resposta

**Erros Possíveis:**
- Código 400: Cenário
- Código 404: Cenário
- Código 500: Cenário

[Repetir para cada endpoint]

### Event Contracts

#### Event: [Nome do Evento]
**Quando é emitido:** [Cenário]
**Payload:** [Descrição dos dados]
**Consumers:** [Quem consome]

[Repetir para cada evento]

### Command Contracts

#### Command: [Nome do Comando]
**Disparado por:** [Trigger]
**Payload:** [Descrição dos dados]
**Processado por:** [Worker responsável]
**Resultado esperado:** [O que acontece]

[Repetir para cada comando]

## Arquitetura de Dados

### Novas Entidades/Tabelas
[Descrição conceitual - sem código]

### Modificações em Entidades Existentes
[Descrição conceitual - sem código]

### Migrations Necessárias
1. [Migration 1: propósito]
2. [Migration 2: propósito]

## Fluxo de Dados Completo

### Fluxo 1: [Nome do Fluxo]
1. Usuário faz ação X no Frontend
2. Frontend chama API endpoint Y
3. API valida Z
4. API persiste dados W
5. API emite evento E
6. Worker consome evento E
7. Worker processa P
8. Worker atualiza estado S
9. Frontend é notificado (se real-time)

[Repetir para cada fluxo principal]

## Dependências entre Componentes

### Frontend depende de:
- API Endpoint X: [Propósito]
- API Endpoint Y: [Propósito]

### API depende de:
- Worker X: [Propósito]
- Serviço Externo Y: [Propósito]

### Worker X depende de:
- API Endpoint Z: [Propósito]
- Fila de mensagens: [Propósito]

## Ordem de Desenvolvimento

### Fase 1: Fundação
1. [Item 1: Por que primeiro]
2. [Item 2: Por que segundo]

### Fase 2: Implementação Core
1. [Item 1]
2. [Item 2]

### Fase 3: Integração
1. [Item 1]
2. [Item 2]

### Fase 4: Refinamento
1. [Item 1]
2. [Item 2]

## Estratégia de Testes

### Backend API
- Unit tests: [Cobertura esperada]
- Integration tests: [Cenários]

### Workers
- Unit tests: [Cobertura esperada]
- Integration tests: [Cenários]

### Frontend
- Unit tests: [Cobertura esperada]
- Integration tests: [Cenários]

## Pontos de Atenção

### Performance
- [Ponto 1 e estratégia]

### Segurança
- [Ponto 1 e estratégia]

### Observabilidade
- Logs necessários
- Métricas a coletar
- Alertas a configurar

## Checklist de Integração

- [ ] Contratos de API documentados e acordados
- [ ] Event schemas definidos
- [ ] Command payloads especificados
- [ ] Error handling padronizado
- [ ] Timeouts e retries configurados
- [ ] Validações alinhadas entre frontend e backend
- [ ] Estados de loading/error mapeados

## TechLead Agents Necessários

Esta seção define quais TechLead Agents devem ser criados na próxima fase:

### Backend TechLead Agent
- [ ] Necessário
- **Justificativa:** [Por que é necessário]
- **Foco:** [Aspectos específicos a serem abordados]

### Frontend TechLead Agent
- [ ] Necessário
- **Justificativa:** [Por que é necessário]
- **Foco:** [Aspectos específicos a serem abordados]

### Database TechLead Agent
- [ ] Necessário
- **Justificativa:** [Por que é necessário]
- **Foco:** [Aspectos específicos a serem abordados]

### Workers TechLead Agent
- [ ] Necessário
- **Justificativa:** [Por que é necessário]
- **Foco:** [Aspectos específicos a serem abordados]

### Outros TechLeads
[Listar outros TechLead Agents necessários, ex: Infrastructure, Integration, etc]

## Contexto para Agents Desenvolvedores

### Para o API Developer Agent:
[Informações específicas que este agent precisa]
[Referências a padrões existentes]
[Exemplos de código similar no projeto]

### Para o Worker Developer Agent:
[Informações específicas que este agent precisa]
[Referências a padrões existentes]
[Exemplos de código similar no projeto]

### Para o Frontend Developer Agent:
[Informações específicas que este agent precisa]
[Referências a padrões existentes]
[Exemplos de código similar no projeto]
```

**⚠️ IMPORTANTE:**
- Este documento é a FONTE DE VERDADE para todos os Developer Agents
- Garantir que os contratos estão 100% especificados
- REGRA ABSOLUTA: **Código somente para especificação de contratos, nada mais!**

---

### FASE 3: Development Agents (Execução Paralela)

**Criar um agent especializado para cada frente:**

#### 3.1. API Developer Agent

**Agent Name:** "Backend API Development Specialist"

**Contexto objetivo a Carregar:**
- `docs/features/[FXXXX]-[nome-da-branch]/about.md` (documento de requisitos)
- `docs/features/[FXXXX]-[nome-da-branch]/plan.md` (plano técnico COMPLETO)
- Padrões de controller/handler
- Padrões de service/repository
- Middleware existentes
- Estratégias de validação
- Tratamento de erros padrão
- Exemplos de endpoints similares
- Bibliotecas de validação usadas
- Padrões de logging

**Responsabilidades:**
1. Implementar TODOS os endpoints conforme contrato
2. Implementar validações especificadas
3. Implementar regras de negócio
4. Emitir eventos conforme especificado
5. Tratar erros conforme padrões
6. Adicionar logs apropriados
7. Garantir 100% de aderência ao contrato

**Entregável:**
- Código compilando 100%
- Contratos de API implementados exatamente como especificado

---

#### 3.2. Worker Developer Agent

**Agent Name:** "Async Processing & Workers Specialist"

**Contexto objetivo a Carregar:**
- `docs/features/[FXXXX]-[nome-da-branch]/about.md`
- `docs/features/[FXXXX]-[nome-da-branch]/plan.md` (especialmente Event/Command contracts)
- Padrões de job processing
- Configuração de filas
- Estratégias de retry
- Dead letter queues
- Padrões de error handling em workers
- Exemplos de workers similares (código completo)
- Bibliotecas de mensageria usadas

**Responsabilidades:**
1. Implementar workers conforme especificado
2. Consumir eventos com payload correto
3. Processar comandos conforme contrato
4. Implementar retries e error handling
5. Emitir eventos de resultado
6. Adicionar logs e métricas
7. Garantir idempotência quando necessário

**Entregável:**
- Código compilando 100%
- Event/Command contracts implementados exatamente como especificado

---

#### 3.3. Frontend Developer Agent

**Agent Name:** "Frontend Development Specialist"

**Contexto objetivo a Carregar:**
- `docs/features/[FXXXX]-[nome-da-branch]/about.md`
- `docs/features/[FXXXX]-[nome-da-branch]/plan.md` (especialmente API contracts)
- Estrutura de componentes existentes
- Padrões de state management
- Padrões de API calls (hooks, services)
- Tratamento de loading/error states
- Componentes de UI reutilizáveis
- Padrões de validação no frontend
- Padrões de formulários
- Bibliotecas de UI usadas
- Exemplos de páginas/componentes similares (código completo)

**Responsabilidades:**
1. Implementar páginas/componentes conforme especificado
2. Integrar com APIs usando contratos exatos
3. Implementar validações client-side
4. Implementar estados de loading/error/success
5. Garantir UX fluida
6. Adicionar tratamento de erros user-friendly
7. Garantir responsividade

**Entregável:**
- Código compilando 100%
- Integração com APIs funcionando 100%
- UI/UX conforme especificado

---

#### 3.4. Outros Developer Agents (se necessário)

Criar agents adicionais conforme necessidade:
- **Database Migration Agent:** Para migrations complexas
- **Infrastructure Agent:** Para configurações de deploy/CI
- **Integration Agent:** Para integrações com sistemas externos

Cada um seguindo o mesmo padrão:
- Contexto objetivo e relevante
- Especificações do plano técnico
- Exemplos do projeto
- Entrega compilando 100%

---

## Nota Importante sobre Commit

Ao finalizar o desenvolvimento, nunca faça o commit ou o stage, pois o código passará por revisão humana antes de subir as alterações.

---
## Instrução de Documentação Pós-Desenvolvimento

Assim que finalizar o desenvolvimento e estiver compilando 100%, crie a documentação em `docs/features/[FXXXX]-[nome-da-branch]/implementation.md` com o caminho dos arquivos criados, desenvolvidos, excluídos com uma descrição de ~20 palavras do que foi ajustado em cada um.

---
### FASE 4: Code Review Agent

**Agent Name:** "Code Quality & Standards Enforcement Specialist"

**Quando Executar:**
- APÓS todos os Developer Agents terem concluído

**Contexto objetivo a Carregar:**
- `docs/features/[FXXXX]-[nome-da-branch]/about.md`
- `docs/features/[FXXXX]-[nome-da-branch]/plan.md`
- TODO o código produzido pelos Developer Agents
- Guia de estilo do projeto
- Padrões de arquitetura do projeto
- Documento de boas práticas
- Exemplos de código bem escrito no projeto
- Linting rules
- Princípios: DRY, SOLID, KISS, YAGNI

**Responsabilidades:**

1. **Verificar Aderência aos Padrões**
   - Convenções de nomenclatura
   - Estrutura de pastas
   - Padrões de arquitetura (controller, service, repository, etc)
   - Uso correto de bibliotecas

2. **Avaliar Qualidade do Código**
   - Legibilidade
   - Manutenibilidade
   - Testabilidade
   - Complexidade ciclomática
   - Code smells

3. **Verificar Princípios**
   - KISS (Keep It Simple, Stupid): Código deve ser simples
   - YAGNI (You Aren't Gonna Need It): Sem over-engineering
   - DRY (Don't Repeat Yourself): Sem duplicação
   - SOLID principles

4. **Verificar Integração**
   - Contratos de API implementados corretamente
   - Event/Command payloads corretos
   - Frontend consumindo APIs corretamente
   - Error handling consistente

5. **Verificar Testes**
   - Cobertura adequada
   - Testes significativos (não testes dummy)
   - Edge cases cobertos

6. **Identificar Over-Engineering**
   - Abstrações desnecessárias
   - Padrões complexos onde simples bastaria
   - Otimizações prematuras
   - Features não solicitadas

**Output:** Criar `docs/features/[FXXXX]-[nome-da-branch]/review.md`

**Estrutura do Review:**

```markdown
# Code Review: [Nome da Tarefa]

## Status Geral
- [ ] Aprovado
- [ ] Aprovado com ressalvas
- [ ] Requer mudanças

## Análise por Componente

### Backend API

#### ✅ Pontos Positivos
- [Ponto 1]
- [Ponto 2]

#### ⚠️ Pontos de Atenção
- [Arquivo: linha]: [Descrição do problema]
- [Sugestão de melhoria]

#### ❌ Issues Críticos
- [Arquivo: linha]: [Problema crítico]
- [Ação necessária]

### Workers

#### ✅ Pontos Positivos
- [Ponto 1]

#### ⚠️ Pontos de Atenção
- [Issue]

#### ❌ Issues Críticos
- [Issue]

### Frontend

#### ✅ Pontos Positivos
- [Ponto 1]

#### ⚠️ Pontos de Atenção
- [Issue]

#### ❌ Issues Críticos
- [Issue]

## Verificação de Padrões

### Nomenclatura
- [ ] Variáveis seguem padrão
- [ ] Funções seguem padrão
- [ ] Classes seguem padrão
- [ ] Arquivos seguem padrão

### Arquitetura
- [ ] Separação de responsabilidades adequada
- [ ] Camadas respeitadas
- [ ] Dependências corretas

### Bibliotecas e Frameworks
- [ ] Uso correto das libs do projeto
- [ ] Sem libs desnecessárias adicionadas

## Verificação de Princípios

### KISS (Simplicidade)
- [ ] Código é simples e direto
- [ ] Sem complexidade desnecessária
- **Violations encontradas:**
  - [Arquivo]: [Descrição]

### YAGNI (Sem Over-Engineering)
- [ ] Sem features não solicitadas
- [ ] Sem abstrações prematuras
- **Violations encontradas:**
  - [Arquivo]: [Descrição]

### DRY (Sem Duplicação)
- [ ] Sem código duplicado
- [ ] Reutilização apropriada
- **Violations encontradas:**
  - [Arquivo]: [Descrição]

## Verificação de Integração

### Contratos de API
- [ ] Request/Response conforme especificado
- [ ] Status codes corretos
- [ ] Error handling consistente
- **Issues:**
  - [Descrição]

### Events/Commands
- [ ] Payloads conforme contrato
- [ ] Emissor e consumidor alinhados
- **Issues:**
  - [Descrição]

### Frontend ↔ Backend
- [ ] Chamadas de API corretas
- [ ] Tratamento de resposta adequado
- [ ] Estados de loading/error implementados
- **Issues:**
  - [Descrição]

## Verificação de Testes

### Cobertura
- Backend API: [X]%
- Workers: [X]%
- Frontend: [X]%

### Qualidade dos Testes
- [ ] Testes significativos
- [ ] Edge cases cobertos
- [ ] Mocks apropriados
- **Issues:**
  - [Descrição]

## Over-Engineering Detectado

### Abstrações Desnecessárias
- [Arquivo]: [Descrição da abstração desnecessária]
- **Sugestão:** [Simplificação proposta]

### Padrões Complexos Desnecessários
- [Arquivo]: [Descrição]
- **Sugestão:** [Alternativa mais simples]

### Features Não Solicitadas
- [Arquivo]: [Feature implementada mas não pedida]
- **Ação:** Remover ou justificar

## Débito Técnico Introduzido

### Deliberado (Aceitável)
- [Item]: [Justificativa]

### Não Intencional (Requer Atenção)
- [Item]: [Descrição]

## Recomendações

### Must Fix (Bloqueante)
1. [Issue crítico 1]
2. [Issue crítico 2]

### Should Fix (Alta Prioridade)
1. [Issue importante 1]
2. [Issue importante 2]

### Nice to Have (Melhorias)
1. [Sugestão 1]
2. [Sugestão 2]

## Checklist Final

- [ ] Código compila sem erros
- [ ] Testes passam 100%
- [ ] Sem violations críticas de padrões
- [ ] Integração verificada
- [ ] Sem over-engineering
- [ ] Performance adequada
- [ ] Segurança verificada
- [ ] Logs apropriados
- [ ] Error handling consistente

## Conclusão

[Resumo da avaliação e próximos passos]
```

**Ação Após Review:**
- Se há issues críticos: Retornar aos Developer Agents para correção
- Se aprovado: Prosseguir para Documentation Agent

---

### FASE 5: Debugging & Fix Agent (Condicional)

**Agent Name:** "Debugging & Problem Resolution Specialist"

**Quando Executar:**
- Quando há erros de build
- Quando há erros de runtime
- Quando há falhas em testes
- Quando Code Review Agent identifica issues críticos
- Quando usuário reporta bug

**Contexto objetivo a Carregar:**
- TODO o contexto do projeto
- Erro completo (stack trace, logs)
- Código relacionado ao erro
- Testes que falharam
- Configurações de build/runtime
- Documentação de libs usadas
- Issues similares resolvidas anteriormente

**Processo de Debugging:**

1. **Análise do Erro**
   - Tipo de erro (build, runtime, lógica)
   - Stack trace completo
   - Contexto de execução

2. **Coleta de Informações**
   
   **Para erros de BUILD/IOC:**
   - Analisar imports/dependencies
   - Verificar configurações
   - Identificar a causa raiz
   - Aplicar fix

   **Para erros de RUNTIME:**
   - Analisar logs
   - Identificar estado da aplicação
   - Verificar dados de entrada
   - Identificar a causa raiz
   - Aplicar fix

   **Para erros de REGRA DE NEGÓCIO:**
   - Perguntar ao usuário sobre o comportamento esperado
   - Coletar exemplos de inputs que falharam
   - Entender o contexto de negócio
   - Analisar a implementação atual
   - Identificar discrepância
   - Aplicar fix

3. **Questionário (quando necessário)**
   - "Qual era o comportamento esperado?"
   - "O que aconteceu de diferente?"
   - "Quais dados foram usados?"
   - "Este cenário estava no documento de requisitos?"
   - "Há alguma regra de negócio não documentada?"

4. **Implementação do Fix**
   - Aplicar correção mínima necessária
   - Não refatorar além do necessário
   - Adicionar teste para o cenário do bug
   - Verificar que fix não quebrou nada

5. **Validação**
   - Todos os testes passando
   - Bug específico corrigido
   - Sem regressões

**Entregável:**
- Fix aplicado
- Teste cobrindo o bug
- Explicação do que causou e como foi resolvido

---

### FASE 6: Documentation Agent

**Agent Name:** "Technical Documentation Specialist"

**Quando Executar:**
- APÓS todos os Developer Agents terem concluído
- APÓS Code Review Agent ter aprovado
- APÓS todos os fixes terem sido aplicados

**Responsabilidades:**
1. Criar/Atualizar documento específico da funcionalidade
2. Documentar arquivos importantes
3. Explicar regras de negócio chave
4. Manter documentação concisa e objetiva

**Contexto objetivo a Carregar:**
- `docs/features/[FXXXX]-[nome-da-branch]/about.md`
- `docs/features/[FXXXX]-[nome-da-branch]/plan.md`
- `docs/features/[FXXXX]-[nome-da-branch]/tasks/` (todos os documentos dos TechLeads, se existirem)
- `docs/features/[FXXXX]-[nome-da-branch]/review.md` (resultado do code review)
- TODO o código implementado
- Estrutura de arquivos do projeto
- Documentação existente em `/docs`

**Output:** Criar/Atualizar `/docs/features/[FXXXX]-[nome-da-branch].md`

**Estrutura da Documentação:**

```markdown
# [Nome da Funcionalidade]

## Visão Geral

[Introdução de até 100 palavras sobre a funcionalidade, explicando o que faz, por que existe e qual problema resolve]

## Arquivos Principais

- Liste com o caminho relativo dos arquivos mais importantes que contenha as principais regras de negócio
- Services, adapters, components, etc..
- Não é para listar contratos, classes POCO..
- Agrupe os arquivos por área (Backend API, Workers, Frontend)
```

**⚠️ REGRAS DE DOCUMENTAÇÃO:**
- SEM código
- SEM exemplos de implementação
- Máximo 100 palavras na introdução
- Máximo ~20 palavras por descrição de arquivo
- Foco em REGRAS DE NEGÓCIO e PROPÓSITO
---

## Princípios Gerais para TODOS os Agents

### 1. Contexto objetivo
- SEMPRE carregar contexto relevante
- Incluir exemplos do projeto

### 2. Especialização
- Cada agent é um EXPERT em sua área
- Carregar conhecimento específico do domínio
- Usar terminologia técnica apropriada

### 3. Qualidade
- Código deve compilar 100%
- Seguir padrões do projeto rigorosamente
- KISS e YAGNI sempre

### 4. Integração
- Contratos são SAGRADOS
- Qualquer mudança em contrato deve ser comunicada
- Validar integração entre componentes

### 5. Comunicação
- Fazer perguntas quando há ambiguidade
- Documentar decisões importantes
- Explicar trade-offs quando relevante

---

## Situações Especiais

### Quando o Usuário Pede "Continue"
- Verificar qual fase estava sendo executada
- Retomar de onde parou
- Manter consistência com trabalho anterior

### Quando o Usuário Pede Mudanças Durante Desenvolvimento
- Atualizar documento de tarefa se necessário
- Atualizar plano técnico se necessário
- Propagar mudanças para agents relevantes
- Re-executar code review se mudanças significativas

### Quando Há Conflito com Main Branch
- Alertar o usuário
- Sugerir merge ou rebase
- Não prosseguir sem resolver conflitos

### Quando Não Há Informação Suficiente
- NÃO assumir
- NÃO inventar requisitos
- PERGUNTAR ao usuário
- Documentar assunções se absolutamente necessário

---

## Checklist de Execução Completa

Ao final de todo o workflow, verificar:

### Fase 1 - Setup
- [ ] Branch criada (se estava em main)
- [ ] PR aberta em draft mode

### Fase 2 - Planning
- [ ] Plano técnico `docs/features/[FXXXX]-[nome-da-branch]/plan.md` criado

### Fase 3 - Development
- [ ] Backend API implementado e testado (se necessário)
- [ ] Workers implementados e testados (se necessário)
- [ ] Frontend implementado e testado (se necessário)
- [ ] Database migrations criadas e testadas (se necessário)

### Fase 4 - Code Review
- [ ] Code review realizado
- [ ] Documento `docs/features/[FXXXX]-[nome-da-branch]/review.md` criado
- [ ] Issues críticos resolvidos

### Fase 6 - Documentation
- [ ] Documentação da feature criada/atualizada em `/docs/features/[FXXXX]-[nome-da-branch].md`