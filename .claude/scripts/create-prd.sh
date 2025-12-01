#!/bin/bash

# Script para criar o documento PRD inicial
# Uso: bash .claude/scripts/create-prd.sh

set -e

PRD_FILE="docs/prd.md"

# Verifica se o PRD já existe
if [ -f "$PRD_FILE" ]; then
    echo "⚠️  PRD já existe em $PRD_FILE"
    echo "STATUS: EXISTS"
    echo "PATH: $PRD_FILE"
    exit 0
fi

# Cria diretório docs se não existir
mkdir -p docs

# Cria o template do PRD
cat > "$PRD_FILE" << 'EOF'
# PRD - Product Requirements Document

> **Status:** Em Discovery
> **Última atualização:** [DATA]
> **Versão:** 1.0

---

## 1. Visão do Produto

### 1.1 O que é?
[Descrição clara e concisa do produto - 2-3 frases]

### 1.2 Para quem?
[Público-alvo principal e secundário]

### 1.3 Que problema resolve?
[Dor/necessidade que o produto endereça]

### 1.4 Qual o valor entregue?
[Benefício principal para o usuário]

---

## 2. Contexto e Motivação

### 2.1 Por que construir isso agora?
[Oportunidade de mercado, timing, motivação]

### 2.2 Alternativas existentes
[Concorrentes ou soluções alternativas e suas limitações]

### 2.3 Diferencial competitivo
[O que torna esta solução única]

---

## 3. Escopo do MVP

### 3.1 Objetivo do MVP
[O que queremos validar/provar com o MVP]

### 3.2 Critérios de Sucesso
- [ ] [Critério mensurável 1]
- [ ] [Critério mensurável 2]
- [ ] [Critério mensurável 3]

### 3.3 O que ESTÁ incluído no MVP
- [Feature/capacidade 1]
- [Feature/capacidade 2]
- [Feature/capacidade 3]

### 3.4 O que NÃO ESTÁ incluído no MVP
- [Feature para versão futura 1] - Motivo: [por que não agora]
- [Feature para versão futura 2] - Motivo: [por que não agora]

---

## 4. Funcionalidades Principais

### 4.1 [Nome da Funcionalidade 1]

**Objetivo:** [O que essa funcionalidade permite]

**Descrição:**
[Como funciona do ponto de vista do usuário]

**Fluxo Principal:**
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

**Regras de Negócio:**
- [Regra 1]
- [Regra 2]

---

### 4.2 [Nome da Funcionalidade 2]

**Objetivo:** [O que essa funcionalidade permite]

**Descrição:**
[Como funciona do ponto de vista do usuário]

**Fluxo Principal:**
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

**Regras de Negócio:**
- [Regra 1]
- [Regra 2]

---

## 5. Usuários e Permissões

### 5.1 Tipos de Usuário
| Tipo | Descrição | Permissões |
|------|-----------|------------|
| [Tipo 1] | [Descrição] | [O que pode fazer] |
| [Tipo 2] | [Descrição] | [O que pode fazer] |

### 5.2 Fluxo de Onboarding
[Como um novo usuário começa a usar o produto]

### 5.3 Multi-tenancy
- [ ] Sim, múltiplas empresas/contas usam o sistema
- [ ] Não, sistema single-tenant

[Se sim, descrever isolamento de dados]

---

## 6. Integrações

### 6.1 Integrações Necessárias para MVP
| Sistema | Propósito | Criticidade |
|---------|-----------|-------------|
| [Sistema 1] | [Para que serve] | Bloqueante / Importante / Nice-to-have |

### 6.2 Integrações Futuras
- [Integração 1] - [Propósito]
- [Integração 2] - [Propósito]

---

## 7. Requisitos Não-Funcionais

### 7.1 Performance
- [Expectativa de tempo de resposta]
- [Volume esperado de usuários/transações]

### 7.2 Segurança
- [Requisitos de autenticação]
- [Dados sensíveis a proteger]

### 7.3 Disponibilidade
- [Expectativa de uptime]
- [Horários críticos de uso]

---

## 8. Roadmap de Funcionalidades

### Fase 1: MVP (Prioridade Máxima)
| # | Funcionalidade | Dependência | Criticidade |
|---|----------------|-------------|-------------|
| 1 | [Feature] | - | Bloqueante |
| 2 | [Feature] | #1 | Bloqueante |
| 3 | [Feature] | - | Importante |

### Fase 2: Pós-MVP
| # | Funcionalidade | Valor | Complexidade |
|---|----------------|-------|--------------|
| 1 | [Feature] | Alto | Média |
| 2 | [Feature] | Médio | Baixa |

---

## 9. Riscos e Dependências

### 9.1 Riscos Identificados
| Risco | Impacto | Probabilidade | Mitigação |
|-------|---------|---------------|-----------|
| [Risco 1] | Alto/Médio/Baixo | Alta/Média/Baixa | [Ação] |

### 9.2 Dependências Externas
- [Dependência 1] - [Impacto se não disponível]

### 9.3 Premissas
- [Premissa 1] - Se falsa: [impacto]
- [Premissa 2] - Se falsa: [impacto]

---

## 10. Glossário

| Termo | Definição |
|-------|-----------|
| [Termo 1] | [Definição] |
| [Termo 2] | [Definição] |

---

## Histórico de Alterações

| Data | Versão | Alteração | Autor |
|------|--------|-----------|-------|
| [DATA] | 1.0 | Criação inicial | [Nome] |

EOF

echo "✅ PRD criado com sucesso!"
echo "STATUS: CREATED"
echo "PATH: $PRD_FILE"
