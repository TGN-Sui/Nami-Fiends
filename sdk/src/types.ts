export type NamiNetwork = 'devnet' | 'testnet' | 'mainnet' | 'localnet';

export interface NamiSdkConfig {
  packageId: string;
  network?: NamiNetwork;
  fullnodeUrl?: string;
}

export interface NamiObjectTypeInput {
  module: string;
  struct: string;
}

export interface NamiEventCursor {
  txDigest: string;
  eventSeq: string;
}

export interface NamiEventQueryOptions {
  cursor?: NamiEventCursor | null;
  limit?: number;
  order?: 'ascending' | 'descending';
}

export interface NamiOwnedObjectQueryOptions {
  limit?: number;
}