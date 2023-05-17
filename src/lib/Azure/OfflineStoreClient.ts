import {Credentials, StorageAccountSettings, StorageFile} from '../../data/Azure';
import {ClientSecretCredential} from '@azure/identity';
import {BlobServiceClient, ContainerClient} from '@azure/storage-blob';

export class AzureOfflineStoreClient {
  private offlineStoreContainerClient: ContainerClient;

  public constructor(credentials: Credentials, settings: StorageAccountSettings) {
    const csc = new ClientSecretCredential(credentials.tenantId, credentials.clientId, credentials.clientSecret);
    const blobServiceClient = new BlobServiceClient(`https://${settings.accountName}.blob.core.windows.net`, csc);
    this.offlineStoreContainerClient = blobServiceClient.getContainerClient(settings.offlineStoreContainer);
  }

  public async listOfflineStoreBlobs(): Promise<StorageFile[]> {
    const blobs: StorageFile[] = [];
    for await (const blob of this.offlineStoreContainerClient.listBlobsFlat()) {
      blobs.push({name: blob.name, lastModified: blob.properties.lastModified.getTime()});
    }
    return blobs.sort((a, b) => a.lastModified - b.lastModified);
  }

  public async getOfflineStoreBlob(name: string) {
    const response = await this.offlineStoreContainerClient.getBlobClient(name).downloadToBuffer();
    return response.toString();
  }
}
