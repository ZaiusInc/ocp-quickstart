export enum EventType {
  SubscriptionValidationEvent = 'Microsoft.EventGrid.SubscriptionValidationEvent'
}

export interface StorageEvent {
  id: string;
  topic: string;
  subject: string;
  data: StorageEventData | SubscriptionValidationEvent;
  dataVersion: string;
  metadataVersion: string;
  eventType: string;
}

export interface StorageEventData {
  api: string;
  clientRequestId: string;
  requestId: string;
  eTag: string;
  contentType: string;
  contentLength: number;
  blobType: string;
  url: string;
  sequencer: string;
  storageDiagnostics: StorageDiagnostics;
}

export interface SubscriptionValidationEvent {
  validationCode: string;
  validationUrl: string;
}

interface StorageDiagnostics {
  batchId: string;
}
