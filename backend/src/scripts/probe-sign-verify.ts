import { Ed25519Keypair } from '@mysten/sui/keypairs/ed25519';
import { verifyPersonalMessageSignature } from '@mysten/sui/verify';

import { buildWalletAuthMessage, verifyWalletAuthPayload } from '../services/wallet-auth.service.js';

const owner = '0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca';
const keypair = Ed25519Keypair.generate();
const signerAddress = keypair.getPublicKey().toSuiAddress();
const timestampMs = Date.now();
const message = buildWalletAuthMessage(owner, timestampMs);
const bytes = new TextEncoder().encode(message);
const result = await keypair.signPersonalMessage(bytes);

console.log('signature preview', String(result.signature).slice(0, 48));
console.log(
  'verify owner',
  await verifyPersonalMessageSignature(bytes, result.signature, { address: owner }).then(
    () => true,
    () => false
  )
);
console.log(
  'verify signer',
  await verifyPersonalMessageSignature(bytes, result.signature, { address: signerAddress }).then(
    () => true,
    () => false
  )
);
console.log(
  'verifyWalletAuthPayload with signer',
  await verifyWalletAuthPayload({
    owner,
    timestampMs,
    signature: result.signature,
    signerAddress,
  })
);
console.log(
  'verifyWalletAuthPayload without signer',
  await verifyWalletAuthPayload({
    owner,
    timestampMs,
    signature: result.signature,
  })
);