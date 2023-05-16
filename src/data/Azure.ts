import { ValueHash } from '@zaiusinc/app-sdk';

export interface Credentials extends ValueHash {
  clientId: string;
  clientSecret: string;
  tenantId: string;
  subscriptionId: string;
}

export interface StorageAccountSettings extends ValueHash {
  resourceGroup: string;
  accountName: string;
  orderContainer: string;
  offlineStoreContainer: string;
}
