import { IWebhookParser, ParsedWebhookData } from '@fnd/backend';

/**
 * Classe base abstrata para parsers de webhook
 * Fornece estrutura comum para todos os parsers
 */
export abstract class BaseWebhookParser<TPayload = unknown, TMetadata = Record<string, unknown>>
  implements IWebhookParser<TPayload, TMetadata>
{
  /**
   * Nome do provider do parser
   */
  abstract readonly providerName: string;

  /**
   * Fila padrão para processamento
   */
  abstract readonly defaultQueueName: string;

  /**
   * Método abstrato para parsear o payload
   * Deve ser implementado por cada parser específico
   */
  abstract parse(payload: TPayload): Promise<ParsedWebhookData<TMetadata>>;

  /**
   * Helper para validar se o payload tem um campo específico
   */
  protected hasField(payload: unknown, field: string): boolean {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      field in payload &&
      (payload as Record<string, unknown>)[field] !== undefined
    );
  }

  /**
   * Helper para extrair valor de um campo do payload
   */
  protected getField<T>(payload: unknown, field: string, defaultValue?: T): T | undefined {
    if (this.hasField(payload, field)) {
      return (payload as Record<string, unknown>)[field] as T;
    }
    return defaultValue;
  }

  /**
   * Extrai o ID do remetente do payload
   * Override em parsers específicos para implementar lógica customizada
   * @returns ID do remetente ou null se não disponível
   */
  protected extractSenderId(payload: unknown): string | null {
    return null;
  }
}
