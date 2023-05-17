import * as App from '@zaiusinc/app-sdk';
import {StorageEvent, StorageEventData, SubscriptionValidationEvent} from '../data/StorageEvents';
import {logger} from '@zaiusinc/app-sdk';
import {OrderInfo} from '../data/DataFiles';
import {Azure} from '../lib/Azure/Azure';
import {CustomerPayload, EventPayload, z} from '@zaiusinc/node-sdk';

export class StorageEventHandler extends App.Function {
  public async perform(): Promise<App.Response> {
    let event: StorageEvent;
    try {
      event = this.request.bodyJSON[0];
    } catch (error) {
      return new App.Response(400, 'Invalid request');
    }

    if (event.eventType === 'Microsoft.EventGrid.SubscriptionValidationEvent') {
      logger.info('SubscriptionValidation event received');
      const eventData = event.data as SubscriptionValidationEvent;

      return new App.Response(200, {validationResponse: eventData.validationCode});
    } else if (event.eventType === 'Microsoft.Storage.BlobCreated') {
      logger.info('BlobCreated event received');
      const eventData = event.data as StorageEventData;

      // Pull the blob's contents from the Azure Container
      let blob: OrderInfo;
      try {
        const azure = await Azure.createOrderInfoClient();
        blob = await azure.getOrderInfoBlob(eventData.url);
      } catch (error) {
        logger.error('Error reading blob', error);
        return new App.Response(500);
      }

      // Write the customer to ODP
      const customerPayload: CustomerPayload = {
        identifiers: {
          email: blob.customer_email,
          ocp_quickstart_clubcard_id: blob.customer_loyalty_card_id
        },
        attributes: {
          ocp_quickstart_clubcard_creation_date: blob.customer_loyalty_card_creation_date
        }
      };

      logger.debug('Writing customer to ODP', customerPayload);

      try {
        await z.customer(customerPayload);
      } catch (error) {
        logger.error('Error writing customer', customerPayload, error);
        return new App.Response(500);
      }

      // Write the order to ODP
      const eventPayload: EventPayload = {
        type: 'order',
        action: 'purchase',
        identifiers: {
          email: blob.customer_email
        },
        data: {
          order: {
            order_id: blob.order_id,
            total: blob.price_total,
            product_id: blob.product_id,
            ocp_quickstart_offline_store_id: blob.offline_store_id
          },
          product: {
            product_id: blob.product_id
          }
        }
      };

      logger.debug('Writing event to ODP', eventPayload);

      try {
        await z.event(eventPayload);
      } catch (error) {
        logger.error('Error writing event', eventPayload, error);
        return new App.Response(500);
      }
      return new App.Response(200);
    } else {
      logger.error('Unknown event type', event);
      return new App.Response(400, 'Invalid request');
    }
  }
}
