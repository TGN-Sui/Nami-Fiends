import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

import {
  buildWalletAuthMessage,
  verifyWalletAuthPayload,
} from './wallet-auth.service.js';

describe('wallet-auth.service', () => {
  it('accepts zkLogin ephemeral signatures when signerAddress is provided', async () => {
    const keypair = Ed25519Keypair.generate();
    const signerAddress = keypair.getPublicKey().toSuiAddress();
    const owner = '0x' + 'b'.repeat(64);
    const timestampMs = Date.now();
    const message = buildWalletAuthMessage(owner, timestampMs);
    const { signature } = await keypair.signPersonalMessage(new TextEncoder().encode(message));

    assert.equal(
      await verifyWalletAuthPayload({
        owner,
        timestampMs,
        signature,
      }),
      false
    );

    assert.equal(
      await verifyWalletAuthPayload({
        owner,
        timestampMs,
        signature,
        signerAddress,
      }),
      true
    );
  });

  it('accepts wallet-extension signatures against the owner address', async () => {
    const keypair = Ed25519Keypair.generate();
    const owner = keypair.getPublicKey().toSuiAddress();
    const timestampMs = Date.now();
    const message = buildWalletAuthMessage(owner, timestampMs);
    const { signature } = await keypair.signPersonalMessage(new TextEncoder().encode(message));

    assert.equal(
      await verifyWalletAuthPayload({
        owner,
        timestampMs,
        signature,
      }),
      true
    );
  });
});