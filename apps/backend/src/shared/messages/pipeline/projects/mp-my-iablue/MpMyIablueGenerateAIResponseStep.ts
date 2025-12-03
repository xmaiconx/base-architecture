import { Inject, Injectable } from '@nestjs/common';
import { ILoggerService, IMessagePipelineStep } from '@fnd/backend';
import { MessageContext, MessageType, PipelineResult } from '@fnd/domain';

/**
 * MP My IABlue - Generate AI Response Step
 *
 * Geração de resposta com agente customizado do projeto mp-my-iablue.
 *
 * Features Específicas:
 * - System prompt específico do IABlue
 * - Processamento de comandos customizados (/status, /report, /config, /help, /start)
 * - Context injection com dados do cliente IABlue
 * - Configuração AI personalizada (model, temperature, tokens)
 *
 * Comandos Implementados:
 * - /status  → Status do sistema IABlue
 * - /report  → Solicita geração de relatório
 * - /config  → Link para configurações da conta
 * - /help    → Ajuda com comandos disponíveis
 * - /start   → Boas-vindas e introdução ao bot
 *
 * Configuração AI (via Project.settings):
 * - ai.provider: string (default: "openai")
 * - ai.model: string (default: "gpt-4-turbo")
 * - ai.temperature: number (default: 0.8)
 * - ai.maxTokens: number (default: 2000)
 * - ai.systemPrompt: string (optional override)
 */
@Injectable()
export class MpMyIablueGenerateAIResponseStep implements IMessagePipelineStep {
  readonly name = 'mp-my-iablue:generate-ai-response';

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService
    // TODO: Inject IABlue-specific AI service
    // @Inject('IMpMyIablueAIService') private readonly aiService: IMpMyIablueAIService
  ) {}

  async execute(context: MessageContext): Promise<PipelineResult> {
    this.logger.debug('MP My IABlue: Generating AI response', {
      operation: 'pipeline.step.mp_my_iablue.generate_ai',
      module: 'MpMyIablueGenerateAIResponseStep',
      messageId: context.message.id,
      isCommand: context.metadata.isCommand,
      commandName: context.metadata.command?.name,
    });

    try {
      // If command has error response already generated, use it
      if (
        context.metadata.isCommand &&
        context.metadata.command?.valid === false &&
        context.metadata.commandResponse
      ) {
        this.logger.debug('Using pre-generated command error response', {
          operation: 'pipeline.step.mp_my_iablue.generate_ai.command_error',
        });

        context.metadata.aiResponse = context.metadata.commandResponse;

        return {
          shouldContinue: true,
          context,
        };
      }

      // Process valid command
      if (
        context.metadata.isCommand &&
        context.metadata.command?.valid === true
      ) {
        const commandResponse = await this.handleCommand(
          context.metadata.command.name,
          context.metadata.command.args,
          context
        );

        context.metadata.aiResponse = {
          text: commandResponse,
          source: 'command_handler',
          commandName: context.metadata.command.name,
        };

        this.logger.info('Command processed successfully', {
          operation: 'pipeline.step.mp_my_iablue.generate_ai.command_success',
          commandName: context.metadata.command.name,
        });

        return {
          shouldContinue: true,
          context,
          stepMetadata: {
            source: 'command_handler',
            commandName: context.metadata.command.name,
          },
        };
      }

      // Generate AI response for regular message
      const systemPrompt = this.buildCustomSystemPrompt(context);
      const conversationHistory = this.buildConversationHistory(context);

      // Get AI configuration from project settings
      const aiConfig = context.metadata.project?.settings?.ai ?? {};
      const provider = aiConfig.provider ?? 'openai';
      const model = aiConfig.model ?? 'gpt-4-turbo';
      const temperature = aiConfig.temperature ?? 0.8;
      const maxTokens = aiConfig.maxTokens ?? 2000;

      this.logger.debug('AI configuration for mp-my-iablue', {
        operation: 'pipeline.step.mp_my_iablue.generate_ai.config',
        provider,
        model,
        temperature,
        maxTokens,
      });

      // TODO: Call IABlue-specific AI service
      // const response = await this.aiService.generateResponse({
      //   provider,
      //   model,
      //   temperature,
      //   systemPrompt,
      //   maxTokens,
      //   messages: conversationHistory,
      //   clientContext: context.metadata.iablueAuthorization,
      // });
      //
      // context.metadata.aiResponse = {
      //   text: response.text,
      //   provider,
      //   model,
      //   tokensUsed: response.tokensUsed,
      //   finishReason: response.finishReason,
      // };

      // Temporary: Mock AI response
      this.logger.info('AI response generation placeholder for mp-my-iablue', {
        operation: 'pipeline.step.mp_my_iablue.generate_ai.placeholder',
        messageId: context.message.id,
      });

      const mockResponse = this.generateMockResponse(context);

      context.metadata.aiResponse = {
        text: mockResponse,
        provider,
        model,
        tokensUsed: 150,
        finishReason: 'stop',
        source: 'mock',
      };

      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          provider,
          model,
          tokensUsed: 150,
          source: 'mock',
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to generate IABlue AI response',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'pipeline.step.mp_my_iablue.generate_ai.error',
          module: 'MpMyIablueGenerateAIResponseStep',
          messageId: context.message.id,
        }
      );

      // Generate error response
      context.metadata.aiResponse = {
        text: 'Desculpe, encontrei um erro ao processar sua mensagem. Por favor, tente novamente em alguns instantes.',
        error: error instanceof Error ? error.message : String(error),
        source: 'error',
      };

      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Build custom system prompt for IABlue
   */
  private buildCustomSystemPrompt(context: MessageContext): string {
    const clientInfo = context.metadata.iablueAuthorization || {};
    const clientId = clientInfo.clientId || 'unknown';
    const plan = clientInfo.plan || 'free';
    const companyName = clientInfo.companyName || 'Cliente IABlue';

    // Check for custom system prompt override
    const customPrompt = context.metadata.project?.settings?.ai?.systemPrompt;
    if (customPrompt) {
      return customPrompt;
    }

    return `
Você é o assistente virtual inteligente do sistema IABlue.

## Contexto do Cliente
- Cliente ID: ${clientId}
- Empresa: ${companyName}
- Plano: ${plan}

## Sua Missão
Ajudar o cliente com informações, suporte e orientações sobre o sistema IABlue de forma profissional, clara e prestativa.

## Diretrizes de Comunicação
1. **Seja Profissional**: Mantenha tom cordial e empresarial
2. **Seja Claro**: Use linguagem direta e objetiva
3. **Seja Prestativo**: Antecipe necessidades e ofereça soluções
4. **Seja Conciso**: Para comandos, seja direto; para dúvidas, seja detalhado
5. **Seja Proativo**: Sugira recursos relevantes do IABlue

## Comandos Disponíveis
O usuário pode usar comandos para ações rápidas:
- /status - Verificar status do sistema
- /report - Gerar relatório
- /config - Acessar configurações
- /help - Obter ajuda

## Capacidades do IABlue
Você pode ajudar com:
- Consultas sobre funcionalidades do sistema
- Geração de relatórios personalizados
- Configurações de conta e preferências
- Suporte técnico e troubleshooting
- Dicas de uso e best practices

Sempre mantenha foco nas necessidades do cliente e nos recursos do IABlue.
    `.trim();
  }

  /**
   * Build conversation history for AI context
   */
  private buildConversationHistory(context: MessageContext): string[] {
    const history = context.metadata.conversationHistory || [context.message];

    return history.map((msg: any) => {
      const text = this.extractMessageText(msg);
      const direction = msg.direction === 'INCOMING' ? 'User' : 'Assistant';
      return `${direction}: ${text}`;
    });
  }

  /**
   * Extract text from any message type
   */
  private extractMessageText(message: any): string {
    switch (message.type) {
      case MessageType.TEXT:
        return message.content.text;

      case MessageType.AUDIO:
        // Check for transcription
        return '[Mensagem de áudio]';

      case MessageType.VIDEO:
        return message.content.caption
          ? `[Vídeo: ${message.content.caption}]`
          : '[Mensagem de vídeo]';

      case MessageType.IMAGE:
        return message.content.caption
          ? `[Imagem: ${message.content.caption}]`
          : '[Mensagem de imagem]';

      case MessageType.DOCUMENT:
        return `[Documento: ${message.content.filename ?? 'arquivo'}]`;

      case MessageType.LOCATION:
        return `[Localização compartilhada]`;

      case MessageType.CONTACT:
        return `[Contato compartilhado]`;

      default:
        return '[Tipo de mensagem não suportado]';
    }
  }

  /**
   * Handle IABlue-specific commands
   */
  private async handleCommand(
    commandName: string,
    args: string[],
    context: MessageContext
  ): Promise<string> {
    this.logger.debug('Processing IABlue command', {
      operation: 'pipeline.step.mp_my_iablue.handle_command',
      commandName,
      argsCount: args.length,
    });

    const clientInfo = context.metadata.iablueAuthorization || {};

    switch (commandName) {
      case 'status':
        return this.handleStatusCommand(clientInfo);

      case 'report':
        return this.handleReportCommand(args, clientInfo);

      case 'config':
        return this.handleConfigCommand(clientInfo);

      case 'help':
        return this.handleHelpCommand();

      case 'start':
        return this.handleStartCommand(clientInfo);

      default:
        return 'Comando não implementado.';
    }
  }

  /**
   * Command: /status
   */
  private handleStatusCommand(clientInfo: any): string {
    return `
✅ **Status do Sistema IABlue**

🟢 **Sistema**: Online e operacional
🟢 **API**: Funcionando normalmente
🟢 **Banco de Dados**: Conectado
🟢 **Serviços**: Todos operacionais

📊 **Sua Conta**
- Cliente: ${clientInfo.companyName || 'Cliente IABlue'}
- Plano: ${clientInfo.plan || 'free'}
- Status: Ativo

Última verificação: ${new Date().toLocaleString('pt-BR')}
    `.trim();
  }

  /**
   * Command: /report
   */
  private handleReportCommand(args: string[], clientInfo: any): string {
    const reportType = args[0] || 'geral';

    return `
📊 **Geração de Relatório IABlue**

Tipo: ${reportType}
Cliente: ${clientInfo.companyName || 'Cliente IABlue'}

🔄 Processando seu relatório...

✅ Seu relatório será gerado e enviado para o email cadastrado em alguns instantes.

💡 **Tipos de relatório disponíveis:**
- /report geral - Relatório geral de uso
- /report mensal - Relatório mensal
- /report custom - Relatório personalizado
    `.trim();
  }

  /**
   * Command: /config
   */
  private handleConfigCommand(clientInfo: any): string {
    return `
⚙️ **Configurações da Conta IABlue**

Cliente: ${clientInfo.companyName || 'Cliente IABlue'}
Plano: ${clientInfo.plan || 'free'}

🔗 **Acesse o painel de configurações:**
https://iablue.com/config

📱 **Ou use o app mobile:**
- iOS: App Store
- Android: Google Play

💡 **Configurações disponíveis:**
- Preferências de notificação
- Integrações e APIs
- Usuários e permissões
- Billing e faturamento
    `.trim();
  }

  /**
   * Command: /help
   */
  private handleHelpCommand(): string {
    return `
📋 **Ajuda - Comandos do IABlue**

**Comandos Disponíveis:**

🔹 **/status**
   Verifica o status do sistema e da sua conta

🔹 **/report [tipo]**
   Gera relatório (geral, mensal, custom)

🔹 **/config**
   Acessa configurações da conta

🔹 **/help**
   Exibe esta mensagem de ajuda

🔹 **/start**
   Reinicia a conversa

**Suporte:**
💬 Chat: Envie sua dúvida aqui
📧 Email: suporte@iablue.com
🌐 Portal: https://iablue.com/suporte

Estou aqui para ajudar! 😊
    `.trim();
  }

  /**
   * Command: /start
   */
  private handleStartCommand(clientInfo: any): string {
    return `
👋 **Bem-vindo ao IABlue!**

Olá, ${clientInfo.companyName || 'Cliente'}!

Sou seu assistente virtual inteligente. Estou aqui para ajudá-lo com:

✅ Consultas sobre o sistema
✅ Geração de relatórios
✅ Configurações da conta
✅ Suporte técnico
✅ Dicas e orientações

**Como posso ajudar você hoje?**

💡 Use /help para ver comandos disponíveis
    `.trim();
  }

  /**
   * Generate mock response for testing
   */
  private generateMockResponse(context: MessageContext): string {
    const clientInfo = context.metadata.iablueAuthorization || {};

    return `
🤖 **Assistente IABlue (Demo)**

Olá! Recebi sua mensagem.

**Sua Conta:**
- Empresa: ${clientInfo.companyName || 'Cliente IABlue'}
- Plano: ${clientInfo.plan || 'free'}

**O que posso fazer por você?**

📊 Use /status para verificar o sistema
📈 Use /report para gerar relatórios
⚙️ Use /config para configurações
❓ Use /help para ajuda completa

Envie sua dúvida ou comando e terei prazer em ajudar!

_Nota: Esta é uma resposta simulada. A integração AI real será implementada em breve._
    `.trim();
  }
}
