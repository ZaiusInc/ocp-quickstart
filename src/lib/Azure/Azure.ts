import { logger } from '@zaiusinc/app-sdk';
import { Credentials } from '../../data/Azure';
import { ClientSecretCredential } from '@azure/identity';
import { EventGridManagementClient } from '@azure/arm-eventgrid';

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
}
