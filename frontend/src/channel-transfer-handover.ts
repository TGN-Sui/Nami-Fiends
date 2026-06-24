import { saveOwnedGameChannelId } from './channel-owner-access.js';
import { releaseHiddenChannelEventsForChannel } from './events-store.js';
import { hydrateOfficialsSubmissionsFromServer } from './officials-submissions-sync.js';
import {
  ownerProvisionedChannelById,
  saveActiveOwnerProvisionedChannelId,
} from './owner-provisioned-channels-store.js';
import { saveUserSurfaceRole } from './surface-preferences.js';
import type { ChannelOwnershipTransfer } from './channel-transfer-api.js';

export async function completeChannelTransferHandover(
  transfer: ChannelOwnershipTransfer,
  recipientWallet: string
): Promise<void> {
  await hydrateOfficialsSubmissionsFromServer();

  const channel = ownerProvisionedChannelById(transfer.channelId);

  if (!channel) {
    return;
  }

  saveOwnedGameChannelId(transfer.channelId);
  saveActiveOwnerProvisionedChannelId(transfer.channelId);
  saveUserSurfaceRole('channel-owner');
  releaseHiddenChannelEventsForChannel(transfer.channelId);

  if (recipientWallet.startsWith('0x')) {
    window.localStorage.setItem('nami.channel-transfer.recipient-wallet', recipientWallet);
  }
}