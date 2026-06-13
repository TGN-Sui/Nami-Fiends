import {
  getJsonRpcFullnodeUrl,
  SuiJsonRpcClient
} from '@mysten/sui/jsonRpc';

import { config } from './config.js';

export function createSuiClient(): SuiJsonRpcClient {
  const url =
    config.network === 'localnet'
      ? config.fullnodeUrl
      : getJsonRpcFullnodeUrl(config.network);

  return new SuiJsonRpcClient({
    url,
    network: config.network
  });
}