import {
  getJsonRpcFullnodeUrl,
  SuiJsonRpcClient
} from '@mysten/sui/jsonRpc';

import type {
  NamiEventQueryOptions,
  NamiNetwork,
  NamiOwnedObjectQueryOptions,
  NamiSdkConfig
} from './types.js';

import type { NamiModule } from './modules.js';

type QueryEventsParams = Parameters<SuiJsonRpcClient['queryEvents']>[0];
type QueryEventsResponse = Awaited<ReturnType<SuiJsonRpcClient['queryEvents']>>;

type GetObjectParams = Parameters<SuiJsonRpcClient['getObject']>[0];
type GetObjectResponse = Awaited<ReturnType<SuiJsonRpcClient['getObject']>>;

type GetOwnedObjectsParams = Parameters<SuiJsonRpcClient['getOwnedObjects']>[0];
type GetOwnedObjectsResponse = Awaited<ReturnType<SuiJsonRpcClient['getOwnedObjects']>>;
type OwnedObjectResponse = GetOwnedObjectsResponse['data'][number];

function resolveNetwork(network: NamiNetwork | undefined): NamiNetwork {
  return network ?? 'testnet';
}

function resolveFullnodeUrl(config: NamiSdkConfig): string {
  const network = resolveNetwork(config.network);

  if (network === 'localnet') {
    return config.fullnodeUrl ?? 'http://127.0.0.1:9000';
  }

  return getJsonRpcFullnodeUrl(network);
}

function assertPackageId(packageId: string): void {
  if (packageId.trim() === '') {
    throw new Error('Nami SDK requires a packageId.');
  }

  if (!packageId.startsWith('0x')) {
    throw new Error('Nami SDK packageId must start with 0x.');
  }
}

export class NamiClient {
  public readonly sui: SuiJsonRpcClient;
  public readonly packageId: string;
  public readonly network: NamiNetwork;

  constructor(config: NamiSdkConfig) {
    assertPackageId(config.packageId);

    this.packageId = config.packageId;
    this.network = resolveNetwork(config.network);

    this.sui = new SuiJsonRpcClient({
      url: resolveFullnodeUrl(config),
      network: this.network
    });
  }

  objectType(moduleName: string, structName: string): string {
    return `${this.packageId}::${moduleName}::${structName}`;
  }

  async getObject(objectId: string): Promise<GetObjectResponse> {
    const params: GetObjectParams = {
      id: objectId,
      options: {
        showType: true,
        showContent: true,
        showOwner: true,
        showDisplay: true
      }
    };

    return this.sui.getObject(params);
  }

  async getOwnedObjectsByType(
    owner: string,
    objectType: string,
    options: NamiOwnedObjectQueryOptions = {}
  ): Promise<OwnedObjectResponse[]> {
    const limit = options.limit ?? 50;
    const objects: OwnedObjectResponse[] = [];

    let cursor: GetOwnedObjectsResponse['nextCursor'] | null = null;
    let hasNextPage = true;

    while (hasNextPage) {
      const params: GetOwnedObjectsParams = {
        owner,
        filter: {
          StructType: objectType
        },
        options: {
          showType: true,
          showContent: true,
          showOwner: true,
          showDisplay: true
        },
        cursor,
        limit
      };

      const response = await this.sui.getOwnedObjects(params);

      objects.push(...response.data);

      cursor = response.nextCursor ?? null;
      hasNextPage = response.hasNextPage;
    }

    return objects;
  }

  async getOwnedNamiObjects(
    owner: string,
    moduleName: string,
    structName: string,
    options: NamiOwnedObjectQueryOptions = {}
  ): Promise<OwnedObjectResponse[]> {
    return this.getOwnedObjectsByType(
      owner,
      this.objectType(moduleName, structName),
      options
    );
  }

  async getOwnedPassports(owner: string): Promise<OwnedObjectResponse[]> {
    return this.getOwnedNamiObjects(owner, 'passport', 'Passport');
  }

  async getOwnedProfiles(owner: string): Promise<OwnedObjectResponse[]> {
    return this.getOwnedNamiObjects(owner, 'profile', 'Profile');
  }

  async getOwnedConductStatuses(owner: string): Promise<OwnedObjectResponse[]> {
    return this.getOwnedNamiObjects(owner, 'conduct', 'ConductStatus');
  }

  async getOwnedChannels(owner: string): Promise<OwnedObjectResponse[]> {
    return this.getOwnedNamiObjects(owner, 'channel', 'Channel');
  }

  async getOwnedGuilds(owner: string): Promise<OwnedObjectResponse[]> {
    return this.getOwnedNamiObjects(owner, 'guild', 'Guild');
  }

  async getOwnedSquads(owner: string): Promise<OwnedObjectResponse[]> {
    return this.getOwnedNamiObjects(owner, 'squad', 'Squad');
  }

  async getOwnedTitleDisplays(owner: string): Promise<OwnedObjectResponse[]> {
    return this.getOwnedNamiObjects(owner, 'title', 'TitleDisplay');
  }

  async getOwnedCosmeticLoadouts(owner: string): Promise<OwnedObjectResponse[]> {
    return this.getOwnedNamiObjects(owner, 'cosmetics', 'CosmeticLoadout');
  }

  async queryModuleEvents(
    moduleName: NamiModule,
    options: NamiEventQueryOptions = {}
  ): Promise<QueryEventsResponse> {
    const params: QueryEventsParams = {
      query: {
        MoveModule: {
          package: this.packageId,
          module: moduleName
        }
      },
      cursor: options.cursor ?? null,
      limit: options.limit ?? 50,
      order: options.order ?? 'ascending'
    };

    return this.sui.queryEvents(params);
  }
}

export function createNamiClient(config: NamiSdkConfig): NamiClient {
  return new NamiClient(config);
}