import { ObjectPayload } from '@zaiusinc/node-sdk';

export interface OfflineStore {
  id: string;
  name: string;
  location: string;
}

export interface OdpOfflineStore extends ObjectPayload {
  ocp_quickstart_offline_store_id: string;
  offline_store_name: string;
  offline_store_location: string;
}
