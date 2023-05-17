import {BlobServiceClient, ContainerClient} from '@azure/storage-blob';
import {Credentials, StorageAccountSettings} from '../../data/Azure';
import {ClientSecretCredential} from '@azure/identity';
import {OrderInfo} from '../../data/DataFiles';

export class AzureOrderInfoClient {
  private orderInfoContainerClient: ContainerClient;

  public constructor(credentials: Credentials, settings: StorageAccountSettings) {
    const csc = new ClientSecretCredential(credentials.tenantId, credentials.clientId, credentials.clientSecret);
    const blobServiceClient = new BlobServiceClient(`https://${settings.accountName}.blob.core.windows.net`, csc);
    this.orderInfoContainerClient = blobServiceClient.getContainerClient(settings.orderContainer);
  }

  public async getOrderInfoBlob(url: string): Promise<OrderInfo> {
    const blobName = new URL(url).pathname.substring(`/${this.orderInfoContainerClient.containerName}/`.length);
    const blob = await this.orderInfoContainerClient
      .getBlobClient(blobName)
      .downloadToBuffer();
    return JSON.parse(blob.toString());
  }
}
