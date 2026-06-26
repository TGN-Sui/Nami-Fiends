import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';

import { buildWalletAuthMessage } from './wallet-auth.service.js';
import { buildWalletAuthProbe } from './wallet-auth-probe.service.js';

describe('wallet-auth-probe.service', () => {
  it('reports missing signerAddress for zkLogin-style rejects', async () => {
    const owner = '0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca';
    const keypair = Ed25519Keypair.generate();
    const timestampMs = Date.now();
    const message = buildWalletAuthMessage(owner, timestampMs);
    const { signature } = await keypair.signPersonalMessage(new TextEncoder().encode(message));

    const probe = await buildWalletAuthProbe({
      owner,
      auth: {
        signature,
        timestampMs,
      },
    });

    assert.equal(probe.verify?.verified, false);
    assert.equal(probe.verify?.has_signer_address, false);
    assert.equal(probe.verify?.rejection_reason, 'missing_signer_address');
  });
});