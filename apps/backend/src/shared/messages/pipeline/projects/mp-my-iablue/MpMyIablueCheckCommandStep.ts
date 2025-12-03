import { Inject, Injectable } from '@nestjs/common';
import { ILoggerService, IMessagePipelineStep } from '@fnd/backend';
import {
  MessageContext,
  MessageType,
  PipelineResult,
  TextMessage,
} from '@fnd/domain';

/**
 * MP My IABlue - Check Command Step
 *
 * Detecção e validação de comandos customizados para o projeto mp-my-iablue.
 *
 * Comandos Disponíveis:
 * - /status - Verifica status do sistema IABlue
 * - /report - Solicita geração de relatório
 * - /config - Acessa configurações da conta
 * - /help - Exibe ajuda com comandos disponíveis
 * - /start - Inicia interação com o bot
 *
 * Comportamento:
 * - Apenas mensagens TEXT são processadas
 * - Prefix customizado: "/" (configurável via Project.settings)
 * - Valida comandos contra whitelist
 * - Adiciona metadata de comando ao context
 * - Gera resposta de erro para comandos inválidos
 *
 * Configuração (via Project.settings):
 * - commands.enabled: boolean
 * - commands.prefix: string (default: "/")
 * - commands.allowedCommands: string[] (default: ver ALLOWED_COMMANDS)
 */
@Injectable()
export class MpMyIablueCheckCommandStep implements IMessagePipelineStep {
  readonly name = 'mp-my-iablue:check-command';

  /**
   * Comandos permitidos específicos do mp-my-iablue
   */
  private readonly ALLOWED_COMMANDS = [
    'status',
    'report',
    'config',
    'help',
    'start',
  ];

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService
  ) {}

  async execute(context: MessageContext): Promise<PipelineResult> {
    this.logger.debug('MP My IABlue: Checking for commands', {
      operation: 'pipeline.step.mp_my_iablue.check_command',
      module: 'MpMyIablueCheckCommandStep',
      messageId: context.message.id,
      messageType: context.message.type,
    });

    // Only process TEXT messages
    if (context.message.type !== MessageType.TEXT) {
      context.metadata.isCommand = false;

      return {
        shouldContinue: true,
        context,
      };
    }

    const textMessage = context.message as TextMessage;
    const text = textMessage.content.text.trim();

    // Get command prefix from project settings (default: "/")
    const commandPrefix =
      context.metadata.project?.settings?.commands?.prefix || '/';

    // Check if message starts with command prefix
    if (!text.startsWith(commandPrefix)) {
      context.metadata.isCommand = false;

      return {
        shouldContinue: true,
        context,
      };
    }

    // Parse command
    const commandText = text.substring(commandPrefix.length);
    const parts = commandText.split(/\s+/);
    const commandName = parts[0].toLowerCase();
    const args = parts.slice(1);

    // Get allowed commands from project settings or use defaults
    const allowedCommands =
      context.metadata.project?.settings?.commands?.allowedCommands ||
      this.ALLOWED_COMMANDS;

    // Validate command
    if (!allowedCommands.includes(commandName)) {
      this.logger.warn('Invalid command detected', {
        operation: 'pipeline.step.mp_my_iablue.check_command.invalid',
        commandName,
        allowedCommands,
      });

      context.metadata.isCommand = true;
      context.metadata.command = {
        name: commandName,
        args,
        valid: false,
        error: 'Command not recognized',
      };

      // Generate error response for invalid command
      context.metadata.commandResponse = {
        text: this.generateInvalidCommandResponse(commandName, allowedCommands),
      };

      this.logger.info('Invalid command, error response generated', {
        operation: 'pipeline.step.mp_my_iablue.check_command.invalid_response',
        commandName,
      });

      // Continue pipeline to send error response
      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          commandValid: false,
          commandName,
        },
      };
    }

    // Valid command detected
    context.metadata.isCommand = true;
    context.metadata.command = {
      name: commandName,
      args,
      valid: true,
    };

    this.logger.info('Valid command detected', {
      operation: 'pipeline.step.mp_my_iablue.check_command.valid',
      module: 'MpMyIablueCheckCommandStep',
      commandName,
      argsCount: args.length,
    });

    return {
      shouldContinue: true,
      context,
      stepMetadata: {
        commandValid: true,
        commandName,
        argsCount: args.length,
      },
    };
  }

  /**
   * Generate invalid command error response
   */
  private generateInvalidCommandResponse(
    invalidCommand: string,
    allowedCommands: string[]
  ): string {
    const commandList = allowedCommands
      .map(cmd => `  /${cmd}`)
      .join('\n');

    return `
❌ Comando "${invalidCommand}" não reconhecido.

📋 Comandos disponíveis no IABlue:

${commandList}

💡 Use /help para mais informações sobre cada comando.
    `.trim();
  }
}
