---
name: updating-claude-documentation
description: |
  **SEMPRE usar (NUNCA editar CLAUDE.md diretamente)** quando usuario diz: "atualize o CLAUDE.md", "verifique se o CLAUDE.md esta atualizado"
---

# Atualizacao de Documentacao Claude

Documentacao do projeto (CLAUDE.md) e fonte de verdade arquitetural para onboarding, assistentes IA e alinhamento do time. DEVE refletir estado atual do codebase, nao aspiracoes. Esta skill previne drift de documentacao atraves de verificacao sistematica antes de atualizacoes, aplicando brevidade (~50 palavras por conceito) e mantendo consistencia com padroes estabelecidos.

**Principio Central**: Documentacao e codigo. Docs desatualizados sao piores que nenhum doc - enganam e erodem confianca.

## Diretrizes de Formatacao

### Regras Obrigatorias
- **Idioma**: Sempre pt-br no CLAUDE.md
- **Sem emojis**: Nenhum emoji em headers ou conteudo
- **Sem codigo de exemplo**: Apenas listar paths de arquivos importantes
- **Brevidade**: Maximo 100 palavras por paragrafo
- **Especificidade**: Mencionar arquivos/classes concretos com paths

### O Que NAO Incluir
- Blocos de codigo com implementacoes
- Exemplos de uso de classes/funcoes
- Controllers, DTOs, POCOs, classes de dominio puras
- Variaveis de ambiente detalhadas
- Scripts npm detalhados

### O Que INCLUIR
- Listagem de paths de enums e entities (sem codigo)
- Paths de arquivos com regras de negocio importantes
- Stack tecnologica com versoes
- Convencoes de nomenclatura
- Boas praticas (KISS, YAGNI)
- Padroes arquiteturais (descricao textual, sem codigo)

## Processo de Atualizacao

### Fase 1: Auditar Estado Atual

**Objetivo**: Identificar gaps entre CLAUDE.md e realidade do codebase.

**Passos**:
1. **Verificar commits recentes** para mudancas arquiteturais:
   ```bash
   git log --oneline -20 --name-status
   ```
   Procurar: novos modulos, arquivos deletados, mudancas de dependencias

2. **Verificar estrutura do monorepo**:
   ```bash
   ls apps/ libs/
   ```
   Comparar com secao "Estrutura do Monorepo" no CLAUDE.md

3. **Verificar features desenvolvidas**:
   ```bash
   ls docs/features/
   ```
   Garantir que secao "Features Desenvolvidas" esta atualizada

### Fase 2: Mapear Stack Tecnologica

**Objetivo**: Descrever libs/apps de forma concisa (~50 palavras cada).

**Template** (por lib/app):
```
### [Nome do Pacote]
**Proposito**: [Problema que resolve] (10-15 palavras)
**Componentes Principais**: [Exports/modulos principais] (15-20 palavras)
**Dependencias**: [Integracoes criticas] (10-15 palavras)
```

**Diretrizes**:
- Alvo: 40-60 palavras total
- Ser especifico: "Kysely 0.27 para queries type-safe" nao "coisas de banco"
- Listar exports concretos: "EmailQueueService, ResendEmailService" nao "varios servicos"
- Omitir obviedades: Nao dizer "escrito em TypeScript" para cada pacote

### Fase 3: Atualizar Secoes Afetadas

**Objetivo**: Modificar apenas secoes impactadas por mudancas, preservando estilo.

**Mapa de Secoes do CLAUDE.md**:
1. **Stack Tecnologica** - Dependencias, versoes, libs core
2. **Clean Architecture** - Estrutura do monorepo (apps/*, libs/*)
3. **Convencoes de Nomenclatura** - Padroes de naming
4. **Estrutura de Arquivos** - Novos modulos ou convencoes
5. **Arquitetura Backend** - Shared.module, worker.module, CQRS
6. **Padroes Arquiteturais** - Novos padroes (factories, strategies, etc.)
7. **Multi-Tenancy** - Mudancas de isolamento de tenant
8. **Database** - Atualizacoes de schema, novas tabelas
9. **Arquitetura Frontend** - Novas pages, stores, components
10. **Boas Praticas** - Novas convencoes ou anti-patterns
11. **Arquivos com Regras de Negocio** - Arquivos criticos com logica de negocio
12. **Features Desenvolvidas** - Referencia a /docs/features/*
13. **Principios de Design** - KISS, YAGNI, SOLID

**Estrategia de Atualizacao**:
- Localizar subsecao exata que precisa atualizacao
- Preservar tom e formato existente
- Usar marcadores para boas praticas (Correto/Errado)
- Adicionar explicacoes "Por que?" para regras nao obvias

**Red Flags**:
- Reescrever secoes inteiras quando apenas uma subsecao mudou
- Mudar tom de conciso para verboso
- Adicionar blocos de codigo extensos
- Remover informacoes existentes validas para dar espaco a novas

### Fase 4: Verificar Consistencia

**Objetivo**: Garantir que atualizacao segue padroes estabelecidos.

**Checklist**:
- [ ] **Brevidade**: Nenhum paragrafo excede 100 palavras
- [ ] **Especificidade**: Menciona arquivos/classes concretos
- [ ] **Versoes**: Inclui numeros de versao para dependencias
- [ ] **Formatacao**:
  - [ ] Sem emojis em headers
  - [ ] Blocos de codigo especificam linguagem apenas para comandos bash
  - [ ] Convencoes usam camelCase, PascalCase, snake_case conforme contexto
- [ ] **Cross-references**: Paths de arquivos correspondem a estrutura real
- [ ] **Idioma**: Sempre pt-br

**Comandos de Verificacao**:
```bash
# Verificar se paths mencionados existem
grep -oP '`[^`]+\.(ts|js|json|yml)`' CLAUDE.md | sort -u

# Verificar nomes de pacotes
grep "@agentics" CLAUDE.md
```

## Secao: Arquivos com Regras de Negocio

Esta secao substitui "Key Files" e deve listar APENAS arquivos que contem logica de negocio importante.

**O Que Incluir**:
- Services que orquestram logica de negocio
- Command Handlers que implementam validacoes
- Pipeline Steps que executam fluxos
- Factories que criam objetos complexos

**O Que NAO Incluir**:
- Controllers (apenas roteamento)
- DTOs (apenas estrutura de dados)
- POCOs/Entities (apenas definicao de dados)
- Repositories (apenas acesso a dados)
- Interfaces (apenas contratos)

**Formato**:
```
### Arquivos com Regras de Negocio

**Backend - Services**
- apps/backend/src/api/modules/auth/auth.service.ts - Orquestra autenticacao, validacao de credenciais e geracao de tokens JWT
- apps/backend/src/api/modules/workspace/workspace.service.ts - Gerencia criacao e associacao de usuarios a workspaces

**Backend - Command Handlers**
- apps/backend/src/api/modules/auth/commands/handlers/SignUpCommandHandler.ts - Valida dados de cadastro, cria conta e usuario, emite eventos

**Backend - Pipeline Steps**
- apps/backend/src/shared/messages/pipeline/steps/GenerateAIResponseStep.ts - Processa contexto e gera resposta usando assistente IA configurado
```

**Regra**: Cada arquivo com descricao de ~20 palavras explicando a regra de negocio principal.

## Secao: Features Desenvolvidas

Esta secao DEVE existir no CLAUDE.md e referenciar a pasta /docs/features/*.

**Conteudo Obrigatorio**:
```
### Features Desenvolvidas

Funcionalidades desenvolvidas no projeto estao documentadas em /docs/features/. Cada feature possui pasta propria com estrutura padronizada contendo tres documentos: about.md (requisitos e escopo), discovery.md (processo de descoberta e decisoes) e implementation.md (detalhes tecnicos da implementacao). Consultar esta pasta para entender contexto de features existentes antes de implementar novas funcionalidades.
```

**Proposito**: Orientar desenvolvedores e assistentes IA a consultarem /docs/features/ para entender contexto de features existentes antes de iniciar novas implementacoes.

## Secao: Enums e Entities

Listar APENAS paths, sem codigo:

**Formato Correto**:
```
### Domain Layer

**Entities** (libs/domain/src/entities/)
- Account.ts
- User.ts
- Workspace.ts
- AuditLog.ts

**Enums** (libs/domain/src/enums/)
- EntityStatus.ts
- UserRole.ts
- OnboardingStatus.ts
```

**Formato Errado** (NAO usar):
```typescript
// NAO incluir codigo como este
export enum UserRole {
  ADMIN = 'admin',
  USER = 'user'
}
```

## Racionalizacoes Comuns (e Realidade)

| Desculpa | Realidade |
|----------|-----------|
| "Vou documentar isso depois" | Depois nunca chega. Faca agora enquanto contexto esta fresco. |
| "E so uma pequena mudanca" | Pequenas mudancas acumulam. Teoria da janela quebrada se aplica. |
| "O codigo e auto-documentado" | Arquitetura, convencoes e decisoes de "por que" nao estao no codigo. |
| "Todo mundo no time sabe disso" | Onboarding, voce do futuro e assistentes IA nao sabem. |
| "Documentacao sempre fica desatualizada" | So se voce nao mantiver. Esta skill previne isso. |

## Red Flags: Voce Esta Violando o Espirito

Observe estes pensamentos/declaracoes:
- "Vou adicionar um TODO para documentar isso depois"
- "Deixa eu so fazer push, docs podem esperar"
- "Funciona, e isso que importa" (sem atualizar CLAUDE.md)
- "Ninguem le isso mesmo"
- Escrever docs aspiracionais: "Isso vai suportar feature X" (ainda nao implementada)
- Copiar/colar de docs antigos sem verificar codigo atual
- Adicionar explicacoes verbosas que pertencem a comentarios, nao docs de arquitetura
- Documentar detalhes de implementacao ao inves de padroes/convencoes
- Adicionar emojis ou blocos de codigo extensos

## Integracao com Outras Skills

**Usar antes desta skill**:
- `systematic-debugging` - Se incerto sobre o que mudou, debugar codebase primeiro
- `root-cause-tracing` - Rastrear mudancas arquiteturais ate requisitos

**Usar apos esta skill**:
- `verification-before-completion` - Sempre verificar se paths/comandos nos docs funcionam
- `requesting-code-review` - Ter docs revisados como parte do PR

**Skills relacionadas**:
- `writing-plans` - Planos frequentemente se tornam secoes de documentacao
- `test-driven-development` - Padroes de teste pertencem ao CLAUDE.md

## Nota Final: Documentacao e uma Feature

Tratar atualizacoes do CLAUDE.md com o mesmo rigor que codigo:
- Revisar em PRs
- Executar comandos de verificacao
- Testar que paths funcionam
- Aplicar em CI (futuro: lint docs para paths quebrados)

**Evidencia antes de afirmacoes**: Se documentar um padrao, verificar que existe no codigo primeiro.

Sem excecoes. Sem "depois". Sem racionalizacao.
