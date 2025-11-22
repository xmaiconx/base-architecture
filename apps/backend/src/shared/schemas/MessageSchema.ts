import { z } from 'zod';
import {
  ChatChannel,
  ChatImplementation,
  ChatProvider,
  InteractiveType,
  MessageDirection,
  MessageStatus,
  MessageType,
} from '@agentics/domain';

/**
 * Message Protocol Validation Schemas
 *
 * Zod schemas for runtime validation of message protocol structures
 * These schemas validate both incoming and outgoing messages
 */

// ==================== Enums ====================

export const MessageTypeSchema = z.nativeEnum(MessageType);
export const MessageDirectionSchema = z.nativeEnum(MessageDirection);
export const MessageStatusSchema = z.nativeEnum(MessageStatus);
export const InteractiveTypeSchema = z.nativeEnum(InteractiveType);
export const ChatChannelSchema = z.nativeEnum(ChatChannel);
export const ChatProviderSchema = z.nativeEnum(ChatProvider);
export const ChatImplementationSchema = z.nativeEnum(ChatImplementation);

// ==================== Media Objects ====================

export const MediaSourceSchema = z.discriminatedUnion('source', [
  z.object({
    source: z.literal('url'),
    url: z.string().url(),
    base64: z.never().optional(),
  }),
  z.object({
    source: z.literal('base64'),
    base64: z.string(),
    url: z.never().optional(),
  }),
]);

export const BaseMediaPropsSchema = z.object({
  mimeType: z.string(),
});

export const BaseMediaObjectSchema = z.intersection(MediaSourceSchema, BaseMediaPropsSchema);

export const AudioMediaObjectSchema = z.intersection(
  BaseMediaObjectSchema,
  z.object({
    duration: z.number().positive().optional(),
    transcript: z.string().optional(),
  }),
);

export const VideoMediaObjectSchema = z.intersection(
  BaseMediaObjectSchema,
  z.object({
    duration: z.number().positive().optional(),
    transcript: z.string().optional(),
    caption: z.string().optional(),
    thumbnail: BaseMediaObjectSchema.optional(),
  }),
);

export const ImageMediaObjectSchema = z.intersection(
  BaseMediaObjectSchema,
  z.object({
    caption: z.string().optional(),
    width: z.number().positive().optional(),
    height: z.number().positive().optional(),
  }),
);

export const DocumentMediaObjectSchema = z.intersection(
  BaseMediaObjectSchema,
  z.object({
    fileName: z.string().min(1),
    fileSize: z.number().positive().optional(),
    caption: z.string().optional(),
  }),
);

export const StickerMediaObjectSchema = z.intersection(
  BaseMediaObjectSchema,
  z.object({
    animated: z.boolean().optional(),
  }),
);

// ==================== Message Contents ====================

// TEXT
export const TextContentSchema = z.object({
  text: z.string().min(1).max(65536), // 64KB max
  previewUrls: z.boolean().optional(),
});

// AUDIO
export const AudioContentSchema = AudioMediaObjectSchema;

// VIDEO
export const VideoContentSchema = VideoMediaObjectSchema;

// IMAGE
export const ImageContentSchema = ImageMediaObjectSchema;

// DOCUMENT
export const DocumentContentSchema = DocumentMediaObjectSchema;

// STICKER
export const StickerContentSchema = StickerMediaObjectSchema;

// CONTACT
export const ContactSchema = z.object({
  name: z.object({
    formatted: z.string(),
    first: z.string().optional(),
    last: z.string().optional(),
    middle: z.string().optional(),
    suffix: z.string().optional(),
    prefix: z.string().optional(),
  }),
  phones: z
    .array(
      z.object({
        phone: z.string(),
        type: z.string().optional(),
        wa_id: z.string().optional(),
      }),
    )
    .optional(),
  emails: z
    .array(
      z.object({
        email: z.string().email(),
        type: z.string().optional(),
      }),
    )
    .optional(),
  org: z
    .object({
      company: z.string().optional(),
      department: z.string().optional(),
      title: z.string().optional(),
    })
    .optional(),
  urls: z
    .array(
      z.object({
        url: z.string().url(),
        type: z.string().optional(),
      }),
    )
    .optional(),
  addresses: z
    .array(
      z.object({
        street: z.string().optional(),
        city: z.string().optional(),
        state: z.string().optional(),
        zip: z.string().optional(),
        country: z.string().optional(),
        country_code: z.string().optional(),
        type: z.string().optional(),
      }),
    )
    .optional(),
  birthday: z.string().optional(),
});

export const ContactContentSchema = z.object({
  contacts: z.array(ContactSchema).min(1),
});

// LOCATION
export const LocationContentSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  name: z.string().optional(),
  address: z.string().optional(),
  url: z.string().url().optional(),
});

// INTERACTIVE
const ButtonActionSchema = z.object({
  type: z.literal('button'),
  buttons: z
    .array(
      z.object({
        type: z.literal('reply'),
        reply: z.object({
          id: z.string(),
          title: z.string().max(20),
        }),
      }),
    )
    .min(1)
    .max(3), // WhatsApp limit
});

const ListActionSchema = z.object({
  type: z.literal('list'),
  button: z.string().max(20),
  sections: z
    .array(
      z.object({
        title: z.string().optional(),
        rows: z
          .array(
            z.object({
              id: z.string(),
              title: z.string().max(24),
              description: z.string().max(72).optional(),
            }),
          )
          .min(1)
          .max(10), // WhatsApp limit per section
      }),
    )
    .min(1),
});

export const InteractiveContentSchema = z.object({
  interactiveType: InteractiveTypeSchema,
  body: z.object({
    text: z.string().max(1024),
  }),
  header: z
    .object({
      type: z.enum(['text', 'image', 'video', 'document']),
      text: z.string().optional(),
      media: BaseMediaObjectSchema.optional(),
    })
    .optional(),
  footer: z
    .object({
      text: z.string().max(60),
    })
    .optional(),
  action: z.union([ButtonActionSchema, ListActionSchema]),
});

// TEMPLATE
export const TemplateContentSchema = z.object({
  name: z.string(),
  language: z.object({
    code: z.string(),
  }),
  components: z
    .array(
      z.object({
        type: z.enum(['header', 'body', 'button']),
        parameters: z
          .array(
            z.object({
              type: z.enum(['text', 'currency', 'date_time', 'image', 'document', 'video']),
              text: z.string().optional(),
              currency: z
                .object({
                  fallback_value: z.string(),
                  code: z.string(),
                  amount_1000: z.number(),
                })
                .optional(),
              date_time: z
                .object({
                  fallback_value: z.string(),
                })
                .optional(),
              image: BaseMediaObjectSchema.optional(),
              document: BaseMediaObjectSchema.optional(),
              video: BaseMediaObjectSchema.optional(),
            }),
          )
          .optional(),
        sub_type: z.enum(['quick_reply', 'url']).optional(),
        index: z.number().optional(),
      }),
    )
    .optional(),
});

// REACTION
export const ReactionContentSchema = z.object({
  messageId: z.string().uuid(),
  emoji: z.string().max(10), // Support compound emojis
});

// SYSTEM
export const SystemContentSchema = z.object({
  systemType: z.string(),
  text: z.string(),
  data: z.record(z.any()).optional(),
});

// ==================== Message Metadata ====================

export const MessageParticipantSchema = z.object({
  id: z.string(),
  name: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  avatarUrl: z.string().url().optional(),
  attributes: z.record(z.any()).optional(),
});

export const MessageErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  details: z.record(z.any()).optional(),
  timestamp: z.coerce.date().optional(),
});

export const MessageMetadataSchema = z.object({
  from: MessageParticipantSchema,
  to: MessageParticipantSchema,
  accountId: z.string().uuid(),
  conversationId: z.string().uuid().optional(),
  replyTo: z.string().uuid().optional(),
  forwardedFrom: z.string().uuid().optional(),
  channel: ChatChannelSchema,
  provider: ChatProviderSchema,
  implementation: ChatImplementationSchema.optional(),
  externalId: z.string().optional(),
  wamid: z.string().optional(),
  labels: z.array(z.string()).optional(),
  private: z.boolean().optional(),
  error: MessageErrorSchema.optional(),
  custom: z.record(z.any()).optional(),
});

// ==================== Base Message ====================

export const BaseMessageSchema = z.object({
  id: z.string().uuid(),
  type: MessageTypeSchema,
  direction: MessageDirectionSchema,
  timestamp: z.coerce.date(),
  metadata: MessageMetadataSchema,
  status: MessageStatusSchema.optional(),
  updatedAt: z.coerce.date().optional(),
});

// ==================== Typed Messages ====================

export const TextMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.TEXT),
  content: TextContentSchema,
});

export const AudioMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.AUDIO),
  content: AudioContentSchema,
});

export const VideoMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.VIDEO),
  content: VideoContentSchema,
});

export const ImageMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.IMAGE),
  content: ImageContentSchema,
});

export const DocumentMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.DOCUMENT),
  content: DocumentContentSchema,
});

export const StickerMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.STICKER),
  content: StickerContentSchema,
});

export const ContactMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.CONTACT),
  content: ContactContentSchema,
});

export const LocationMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.LOCATION),
  content: LocationContentSchema,
});

export const InteractiveMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.INTERACTIVE),
  content: InteractiveContentSchema,
});

export const TemplateMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.TEMPLATE),
  content: TemplateContentSchema,
});

export const ReactionMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.REACTION),
  content: ReactionContentSchema,
});

export const SystemMessageSchema = BaseMessageSchema.extend({
  type: z.literal(MessageType.SYSTEM),
  content: SystemContentSchema,
});

// ==================== Union Schema ====================

/**
 * Complete Message schema with discriminated union on type
 * This ensures the content matches the declared type
 */
export const MessageSchema = z.discriminatedUnion('type', [
  TextMessageSchema,
  AudioMessageSchema,
  VideoMessageSchema,
  ImageMessageSchema,
  DocumentMessageSchema,
  StickerMessageSchema,
  ContactMessageSchema,
  LocationMessageSchema,
  InteractiveMessageSchema,
  TemplateMessageSchema,
  ReactionMessageSchema,
  SystemMessageSchema,
]);

// ==================== Helper Schemas ====================

/**
 * Schema for creating a new message (without system-generated fields)
 * Created by omitting system fields from each message schema
 */
const CreateTextMessagePayloadSchema = TextMessageSchema.omit({ id: true, timestamp: true, updatedAt: true });
const CreateAudioMessagePayloadSchema = AudioMessageSchema.omit({ id: true, timestamp: true, updatedAt: true });
const CreateVideoMessagePayloadSchema = VideoMessageSchema.omit({ id: true, timestamp: true, updatedAt: true });
const CreateImageMessagePayloadSchema = ImageMessageSchema.omit({ id: true, timestamp: true, updatedAt: true });
const CreateDocumentMessagePayloadSchema = DocumentMessageSchema.omit({ id: true, timestamp: true, updatedAt: true });
const CreateStickerMessagePayloadSchema = StickerMessageSchema.omit({ id: true, timestamp: true, updatedAt: true });
const CreateContactMessagePayloadSchema = ContactMessageSchema.omit({ id: true, timestamp: true, updatedAt: true });
const CreateLocationMessagePayloadSchema = LocationMessageSchema.omit({ id: true, timestamp: true, updatedAt: true });
const CreateInteractiveMessagePayloadSchema = InteractiveMessageSchema.omit({ id: true, timestamp: true, updatedAt: true });
const CreateTemplateMessagePayloadSchema = TemplateMessageSchema.omit({ id: true, timestamp: true, updatedAt: true });
const CreateReactionMessagePayloadSchema = ReactionMessageSchema.omit({ id: true, timestamp: true, updatedAt: true });
const CreateSystemMessagePayloadSchema = SystemMessageSchema.omit({ id: true, timestamp: true, updatedAt: true });

export const CreateMessagePayloadSchema = z.discriminatedUnion('type', [
  CreateTextMessagePayloadSchema,
  CreateAudioMessagePayloadSchema,
  CreateVideoMessagePayloadSchema,
  CreateImageMessagePayloadSchema,
  CreateDocumentMessagePayloadSchema,
  CreateStickerMessagePayloadSchema,
  CreateContactMessagePayloadSchema,
  CreateLocationMessagePayloadSchema,
  CreateInteractiveMessagePayloadSchema,
  CreateTemplateMessagePayloadSchema,
  CreateReactionMessagePayloadSchema,
  CreateSystemMessagePayloadSchema,
]);

/**
 * Schema for updating a message (only updatable fields)
 */
export const UpdateMessagePayloadSchema = z.object({
  status: MessageStatusSchema.optional(),
  metadata: MessageMetadataSchema.partial().optional(),
});

// ==================== Type Inference ====================

/**
 * Infer TypeScript types from Zod schemas
 * These can be used for type-safe validation
 */
export type MessageSchemaType = z.infer<typeof MessageSchema>;
export type CreateMessagePayloadSchemaType = z.infer<typeof CreateMessagePayloadSchema>;
export type UpdateMessagePayloadSchemaType = z.infer<typeof UpdateMessagePayloadSchema>;
