import { Inject, Injectable } from '@nestjs/common';
import { ILoggerService, IMessagePipelineStep } from '@fnd/backend';
import {
  MessageContext,
  MessageType,
  PipelineResult,
  TextMessage,
} from '@fnd/domain';

/**
 * Check Command Step
 *
 * Detects if the message is a command (starts with / or configured prefix).
 *
 * Behavior:
 * - Only processes TEXT messages
 * - Checks if message starts with command prefix (default: "/")
 * - Extracts command name and arguments
 * - Adds command info to context
 * - Always continues (downstream steps can handle commands)
 *
 * Context Enrichment:
 * - context.metadata.isCommand: boolean
 * - context.metadata.command: { name: string, args: string[] }
 *
 * Examples:
 * - "/novo" → { name: "novo", args: [] }
 * - "/help assistente" → { name: "help", args: ["assistente"] }
 */
@Injectable()
export class CheckCommandStep implements IMessagePipelineStep {
  readonly name = 'check-command';

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService
  ) {}

  async execute(context: MessageContext): Promise<PipelineResult> {
    this.logger.debug('Checking if message is a command', {
      operation: 'pipeline.step.check_command',
      module: 'CheckCommandStep',
      messageId: context.message.id,
      messageType: context.message.type,
    });

    // Only check commands in text messages
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

    context.metadata.isCommand = true;
    context.metadata.command = {
      name: commandName,
      args,
    };

    this.logger.info('Command detected', {
      operation: 'pipeline.step.check_command.detected',
      module: 'CheckCommandStep',
      messageId: context.message.id,
      commandName,
      argsCount: args.length,
    });

    // TODO: Optionally validate against allowed commands
    // const allowedCommands = context.metadata.project?.settings?.commands?.allowedCommands;
    // if (allowedCommands && !allowedCommands.includes(commandName)) {
    //   this.logger.warn('Unknown command', {
    //     operation: 'pipeline.step.check_command',
    //     commandName,
    //     allowedCommands,
    //   });
    //
    //   context.metadata.commandValid = false;
    // }

    return {
      shouldContinue: true,
      context,
    };
  }
}
