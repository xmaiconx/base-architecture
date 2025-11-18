# FRD – [ID DA FUNCIONALIDADE – ex: F001]
Nome da funcionalidade: [nome]  
Produto / Módulo: [ex: Core / Onboarding / Billing]  
Versão alvo: [ex: v1.0]  
Responsável: [nome]  
Relacionado ao objetivo do PRD: [cite seção / objetivo]

---

## 1. Contexto e Objetivo da Funcionalidade

**Resumo:**  
[2–4 frases explicando por que essa funcionalidade existe e que problema ela resolve dentro do produto.]

**Resultado esperado para o usuário:**  
[Ex: “Conseguir criar o primeiro projeto em menos de 3 minutos.”]

---

## 2. Escopo

**Inclui neste FRD:**  
- [Ponto 1]  
- [Ponto 2]  
- [Ponto 3]  

**Não inclui (explicitamente fora):**  
- [Coisa que poderia ser pedida mas será deixada para outro FRD]  

---

## 3. Usuário-Alvo e Cenário Principal

**Persona:**  
[ex: Dono de pequena agência, nutricionista, etc.]

**História do usuário (User Story):**  
> Como [tipo de usuário], quero [ação] para [resultado].

---

## 4. Fluxo Principal (Happy Path)

Descreva o caminho ideal, passo a passo:

1. [Usuário faz…]  
2. [Sistema responde…]  
3. [Usuário escolhe…]  
4. [Sistema salva / envia / exibe…]  

Se fizer sentido, inclua pequenos subfluxos (ex: “4.1 – confecção do link de convite”).

---

## 5. Fluxos Alternativos e Exceções

Liste situações importantes fora do caminho feliz:

- [Ex: Usuário tenta salvar sem preencher campo obrigatório]  
- [Ex: Falha na integração externa]  
- [Ex: Usuário cancela no meio do fluxo]  

Para cada caso, descreva o que o sistema deve fazer.

---

## 6. Regras de Negócio

Use formato objetivo:

- Se **[condição]**, então **[comportamento do sistema]**  
- Limites: [ex: máximo 3 projetos no plano gratuito]  
- Validações: [ex: e-mail deve ser único por conta]  

---

## 7. Dados (Entrada e Saída)

**Entradas (inputs):**
- Campos:  
  - [nome_do_campo] – tipo [string / int / boolean / enum] – obrigatório? [sim/não] – validação extra  
- Origem dos dados: [input usuário / outro serviço / IA]

**Saídas (outputs):**
- O que deve ser retornado / salvo:
  - [Ex: objeto projeto criado com id, nome, status, timestamps]  

**Modelos / Tabelas afetadas:**
- [nome da tabela / coleção]  
  - Campos impactados: [lista]

---

## 8. Integrações

**Sistemas externos / APIs:**
- [Nome da integração] – uso (ex: criar assinatura, enviar e-mail, etc.)  

**Eventos / Webhooks (se houver):**
- Evento disparado: [nome]  
- Quando: [momento do fluxo]  
- Payload mínimo: [campos importantes]

---

## 9. UX / UI de Referência

**Telas impactadas:**
- [Tela 1 – exemplo: “Tela de cadastro de projeto”]  
- [Tela 2 – exemplo: “Dashboard home”]  

**Referências / anotações:**
- [Link para wireframe / Figma / rascunho]  
- Regras visuais importantes (se houver):
  - [Ex: destacar CTA principal]
  - [Mensagens de erro claras abaixo do campo]

---

## 10. Erros e Mensagens

Liste os erros principais e suas mensagens:

- Cenário: [ex: campo obrigatório vazio]  
  - Mensagem: “[texto amigável]”  

- Cenário: [ex: falha de integração externa]  
  - Mensagem: “[texto amigável + instrução do que fazer]”

---

## 11. Critérios de Aceite

O que precisa estar funcionando para considerar “pronto”:

- [ ] Usuário consegue [resultado principal] sem ajuda externa  
- [ ] Regra de negócio X aplicada corretamente (descrição)  
- [ ] Logs / eventos sendo gerados para [métrica ou tracking]  
- [ ] Fluxos alternativos Y e Z tratados corretamente  

(Se quiser, use formato Given/When/Then.)

---

## 12. Métricas e Tracking

- Eventos a registrar:  
  - [Ex: onboarding_started, onboarding_completed]  
- Propriedades importantes:  
  - [plano, origem do usuário, etc.]

---

## 13. Dependências e Impactos

- Depende de:  
  - [Ex: Cadastro de usuário pronto (FRD F000)]  
- Impacta:  
  - [Ex: Relatórios, faturamento, onboarding etc.]

---

## 14. Notas para Desenvolvimento (humano ou IA)

- Padrões a seguir:  
  - [Stack, libs preferidas, naming convention, etc.]  
- Formato esperado de código / API / contrato:  
  - [Ex: deve expor endpoint REST / evento em fila / função serverless]  
- Observações finais:  
  - [Qualquer nuance que você não quer que o dev/IA ignore]

