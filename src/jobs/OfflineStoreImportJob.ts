import * as App from '@zaiusinc/app-sdk';
import {OdpOfflineStore, OfflineStore} from '../data/OfflineStore';
import {Batcher, logger, notifications, storage, ValueHash} from '@zaiusinc/app-sdk';
import {Azure} from '../lib/Azure/Azure';
import {StorageFile} from '../data/Azure';
import {AzureOfflineStoreClient} from '../lib/Azure/OfflineStoreClient';
import {z} from '@zaiusinc/node-sdk';

interface OfflineStoreImportJobStatus extends App.JobStatus {
  state: {
    files: StorageFile[];
    lastFileTimestamp: number;
    count: number;
    jobState: JobState;
  };
}

enum JobState {
  FETCH_OFFLINE_STORE_FILES,
  IMPORT_OFFLINE_STORE_FILES,
  COMPLETE
}

export class OfflineStoreImportJob extends App.Job {
  private azure!: AzureOfflineStoreClient;
  private batcher: Batcher<OdpOfflineStore> = new Batcher(async (i) => await this.storeBatcher(i), 100);

  public async prepare(params: ValueHash, status?: OfflineStoreImportJobStatus): Promise<OfflineStoreImportJobStatus> {
    logger.info('Preparing Offline Store Import:', params, 'and status', status);

    try {
      this.azure = await Azure.createOfflineStoreClient();
    } catch (error) {
      logger.error('Error creating offline store client', error);

      // Mark the job as complete so that we don't continue.
      return {complete: true} as OfflineStoreImportJobStatus;
    }

    if (status) {
      // when resuming, we will be provided the last state where we left off
      // Long running jobs are more likely to be forced to pause and resume
      // Shorter jobs are less likely, but may still be resumed
      return status;
    }
    const lastFileTimestamp = (await storage.kvStore.get('lastFileImport')).timestamp as number || 0;
    return {
      state: {
        lastFileTimestamp,
        count: 0,
        files: [],
        jobState: JobState.FETCH_OFFLINE_STORE_FILES
      },
      complete: false
    };
  }

  public async perform(status: OfflineStoreImportJobStatus): Promise<OfflineStoreImportJobStatus> {
    const state = status.state;
    switch (state.jobState) {
    case JobState.FETCH_OFFLINE_STORE_FILES:
      logger.info('Fetching names of offline store files');
      try {
        const files = await this.azure.listOfflineStoreBlobs();
        logger.debug('Found offline store files', files);
        const storesFilesToImport = files.filter((f) =>
          f.lastModified && f.lastModified > new Date(state.lastFileTimestamp).getTime()
        );
        logger.info('Found files to be imported: ', storesFilesToImport.map((s) => s.name));
        state.files = storesFilesToImport;
        state.jobState = JobState.IMPORT_OFFLINE_STORE_FILES;
      } catch (error: any) {
        logger.error('Failed to fetch names of offline store files', error);
        await notifications.error(
          'Offline Store Import',
          'Failed to fetch offline store blobs',
          `Reason: ${error}`
        );
        status.complete = true;
      }
      break;
    case JobState.IMPORT_OFFLINE_STORE_FILES:
      logger.info('Importing offline stores from files');
      const file = state.files.pop();
      if (!file) {
        state.jobState = JobState.COMPLETE;
        break;
      }

      try {
        logger.info('Downloading and importing offline store file: ', file.name);
        const stores = JSON.parse(await this.azure.getOfflineStoreBlob(file.name)) as OfflineStore[];
        for (const store of stores) {
          logger.debug('Importing offline store', store);
          await this.batcher.append(this.offlineStoreTransform(store));
          state.count++;
        }
        await this.batcher.flush();
        await storage.kvStore.put('lastFileImport', {timestamp: file.lastModified});
      } catch (error: any) {
        logger.error(`Failed to import stores from file: ${file.name}`, error);
        await notifications.error(
          'Offline Store Import',
          'Failed to fetch offline store blobs',
          `Reason: ${error}`
        );
        status.complete = true;
      }
      break;
    case JobState.COMPLETE:
      logger.info(`Offline Store Import complete, imported ${state.count} offline stores`);
      try {
        await this.batcher.flush();
      } catch (error: any) {
        logger.error('Failed to flush final batch', error);
      }

      await notifications.info(
        'Offline Store Import',
        'Imported data',
        `Imported ${state.count} offline stores`
      );
      status.complete = true;
      break;
    }
    return status;
  }

  private offlineStoreTransform(store: OfflineStore): OdpOfflineStore {
    return {
      ocp_quickstart_offline_store_id: store.id,
      offline_store_name: store.name,
      offline_store_location: store.location
    };
  }

  private async storeBatcher(store: any) {
    await z.object('ocp_quickstart_offline_stores', store);
  }
}
