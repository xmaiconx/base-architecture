import { Inject, Injectable } from '@nestjs/common';
import { ILoggerService, IMessagePipelineStep } from '@fnd/backend';
import {
  AudioMessage,
  ImageMessage,
  MessageContext,
  MessageType,
  PipelineResult,
  VideoMessage,
} from '@fnd/domain';

/**
 * Convert Media to Text Step
 *
 * Converts audio, video, and images to text for AI processing.
 *
 * Behavior:
 * - AUDIO: Transcribe to text using Whisper or similar
 * - VIDEO: Extract audio and transcribe
 * - IMAGE: Describe image using vision model
 * - Adds transcriptions to context.metadata.transcriptions
 * - Always continues
 *
 * Configuration (from project settings):
 * - media.transcriptionEnabled: boolean
 * - media.transcriptionService: string (e.g., "whisper", "google-speech")
 * - media.imageAnalysisEnabled: boolean
 * - media.videoAnalysisEnabled: boolean
 *
 * TODO: Integrate with actual transcription/vision services
 */
@Injectable()
export class ConvertMediaToTextStep implements IMessagePipelineStep {
  readonly name = 'convert-media-to-text';

  constructor(
    @Inject('ILoggerService') private readonly logger: ILoggerService
    // TODO: Inject transcription service
    // @Inject('ITranscriptionService') private readonly transcriptionService: ITranscriptionService
    // @Inject('IVisionService') private readonly visionService: IVisionService
  ) {}

  async execute(context: MessageContext): Promise<PipelineResult> {
    this.logger.debug('Converting media to text', {
      operation: 'pipeline.step.convert_media',
      module: 'ConvertMediaToTextStep',
      messageId: context.message.id,
      messageType: context.message.type,
    });

    const message = context.message;
    const transcriptions: Array<{
      messageId: string;
      type: 'audio' | 'video' | 'image';
      text: string;
    }> = [];

    try {
      switch (message.type) {
        case MessageType.AUDIO: {
          const audioMessage = message as AudioMessage;
          const text = await this.transcribeAudio(audioMessage, context);
          transcriptions.push({
            messageId: message.id,
            type: 'audio',
            text,
          });
          break;
        }

        case MessageType.VIDEO: {
          const videoMessage = message as VideoMessage;
          const text = await this.transcribeVideo(videoMessage, context);
          transcriptions.push({
            messageId: message.id,
            type: 'video',
            text,
          });
          break;
        }

        case MessageType.IMAGE: {
          const imageMessage = message as ImageMessage;
          const text = await this.describeImage(imageMessage, context);
          transcriptions.push({
            messageId: message.id,
            type: 'image',
            text,
          });
          break;
        }

        default:
          // Not a media message, skip
          break;
      }

      // Add transcriptions to context
      if (transcriptions.length > 0) {
        context.metadata.transcriptions = transcriptions;

        this.logger.info('Media converted to text', {
          operation: 'pipeline.step.convert_media.completed',
          module: 'ConvertMediaToTextStep',
          messageId: message.id,
          transcriptionCount: transcriptions.length,
        });
      }

      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          transcriptionCount: transcriptions.length,
        },
      };
    } catch (error) {
      this.logger.error(
        'Failed to convert media to text',
        error instanceof Error ? error : new Error(String(error)),
        {
          operation: 'pipeline.step.convert_media.error',
          module: 'ConvertMediaToTextStep',
          messageId: message.id,
        }
      );

      // Continue even if conversion fails
      return {
        shouldContinue: true,
        context,
        stepMetadata: {
          conversionError: error instanceof Error ? error.message : String(error),
        },
      };
    }
  }

  /**
   * Transcribe audio to text
   */
  private async transcribeAudio(
    message: AudioMessage,
    context: MessageContext
  ): Promise<string> {
    const enabled =
      context.metadata.project?.settings?.media?.transcriptionEnabled ?? true;

    if (!enabled) {
      return '[Audio transcription disabled]';
    }

    // TODO: Implement actual audio transcription
    // const service = context.metadata.project?.settings?.media?.transcriptionService ?? 'whisper';
    // const audioUrl = message.content.media.url;
    //
    // const transcription = await this.transcriptionService.transcribe(audioUrl, service);
    // return transcription.text;

    // Temporary placeholder
    this.logger.info('Audio transcription placeholder', {
      operation: 'pipeline.step.convert_media.audio_placeholder',
      messageId: message.id,
    });

    return '[Audio transcription placeholder - TODO: implement Whisper integration]';
  }

  /**
   * Transcribe video to text
   */
  private async transcribeVideo(
    message: VideoMessage,
    context: MessageContext
  ): Promise<string> {
    const enabled =
      context.metadata.project?.settings?.media?.videoAnalysisEnabled ?? true;

    if (!enabled) {
      return '[Video analysis disabled]';
    }

    // TODO: Extract audio from video and transcribe
    this.logger.info('Video transcription placeholder', {
      operation: 'pipeline.step.convert_media.video_placeholder',
      messageId: message.id,
    });

    return '[Video transcription placeholder - TODO: implement video processing]';
  }

  /**
   * Describe image using vision model
   */
  private async describeImage(
    message: ImageMessage,
    context: MessageContext
  ): Promise<string> {
    const enabled =
      context.metadata.project?.settings?.media?.imageAnalysisEnabled ?? true;

    if (!enabled) {
      return '[Image analysis disabled]';
    }

    // TODO: Implement vision model integration
    // const imageUrl = message.content.media.url;
    // const description = await this.visionService.describe(imageUrl);
    // return description.text;

    this.logger.info('Image analysis placeholder', {
      operation: 'pipeline.step.convert_media.image_placeholder',
      messageId: message.id,
    });

    // Use caption if available
    if (message.content.caption) {
      return `[Image with caption: ${message.content.caption}]`;
    }

    return '[Image analysis placeholder - TODO: implement vision model integration]';
  }
}
