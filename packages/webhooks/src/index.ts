export interface WebhookDelivery {
  id: string;
  url: string;
  eventType: string;
  payload: Record<string, unknown>;
}

export function createWebhookSignaturePayload(delivery: WebhookDelivery): string {
  return `${delivery.id}.${delivery.eventType}.${JSON.stringify(delivery.payload)}`;
}
