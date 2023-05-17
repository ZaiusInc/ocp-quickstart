import { functions, logger, storage } from '@zaiusinc/app-sdk';
import { Credentials, StorageAccountSettings } from '../../data/Azure';
import { ClientSecretCredential } from '@azure/identity';
import { EventGridManagementClient, EventSubscription } from '@azure/arm-eventgrid';
import { AzureOrderInfoClient } from './OrderInfoClient';
import { BlobServiceClient } from '@azure/storage-blob';

export namespace Azure {
  export async function validateCredentials(credentials: Credentials) {
    const csc = new ClientSecretCredential(credentials.tenantId, credentials.clientId, credentials.clientSecret);
    const eventgridClient = new EventGridManagementClient(csc, credentials.subscriptionId);

    try {
      await eventgridClient.eventSubscriptions.listGlobalBySubscription().next();
    } catch (e) {
      logger.warn('Could not authenticate with the provided credentials.', e);
      return false;
    }

    return true;
  }

  export async function createOrderInfoClient() {
    const credentials = await storage.settings.get<Credentials>('credentials');
    if (!await validateCredentials(credentials)) {
      logger.error('Invalid credentials.');
      throw new Error('Invalid Azure credentials.');
    }
    const settings = await storage.settings.get<StorageAccountSettings>('settings');

    return new AzureOrderInfoClient(credentials, settings);
  }

  export async function installWebhook(settings: StorageAccountSettings) {
    const credentials = await storage.settings.get<Credentials>('credentials');

    if (!credentials || !settings) {
      logger.warn('Credentials or settings not found.');
      return false;
    }

    const csc = new ClientSecretCredential(credentials.tenantId, credentials.clientId, credentials.clientSecret);
    const blobServiceClient = new BlobServiceClient(`https://${settings.accountName}.blob.core.windows.net`, csc);
    const containerClient = blobServiceClient.getContainerClient(settings.orderContainer);

    try {
      if (!await containerClient.exists()) {
        logger.warn('Could not find storage container for orders.');
        return false;
      }
    } catch (e) {
      logger.warn('Could validate storage container for orders exists.', e);
      return false;
    }

    const eventSubscription: EventSubscription = {
      destination: {
        endpointType: 'WebHook',
        endpointUrl: (await functions.getEndpoints())['storage_event']
      },
      eventDeliverySchema: 'EventGridSchema'
    };

    const scope = `/subscriptions/${credentials.subscriptionId}/resourceGroups/${settings.resourceGroup}/` +
      `providers/Microsoft.Storage/storageAccounts/${settings.accountName}`;
    const eventgridClient = new EventGridManagementClient(csc, credentials.subscriptionId);
    await eventgridClient.eventSubscriptions.beginCreateOrUpdate(
      scope,
      'ocp-quickstart-azure-sync-webhoook-subscription',
      eventSubscription
    );

    return true;
  }
}
