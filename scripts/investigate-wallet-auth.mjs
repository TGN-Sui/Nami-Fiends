#!/usr/bin/env node
/**
 * Investigate wallet auth for border art catalog sync (zkLogin vs extension).
 *
 * Usage:
 *   node scripts/investigate-wallet-auth.mjs
 *   node scripts/investigate-wallet-auth.mjs --indexer-url https://nami-backend-rv0o.onrender.com
 */
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';

const backendRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'backend');
const { Ed25519Keypair } = await import(
  pathToFileURL(join(backendRoot, 'node_modules/@mysten/sui/dist/keypairs/ed25519/index.mjs')).href
);
const { verifyPersonalMessageSignature } = await import(
  pathToFileURL(join(backendRoot, 'node_modules/@mysten/sui/dist/verify/index.mjs')).href
);

const DEFAULT_INDEXER = 'https://nami-backend-rv0o.onrender.com';
const OFFICIAL_OWNER = '0xbcf5a725b72f88fd50c7146a48822fc61e3691cbe44193a668887de4573764ca';

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] ?? '' : '';
}

function buildWalletAuthMessage(owner, timestampMs) {
  return 'nami-auth:v1:' + owner.toLowerCase() + ':' + String(timestampMs);
}

async function probeIndexer(indexerUrl) {
  console.log('Live receiving server');
  console.log('---------------------');
  console.log('URL:', indexerUrl);

  const summaryResponse = await fetch(indexerUrl + '/api/ops/launch-summary');

  if (!summaryResponse.ok) {
    console.log('[XX] launch-summary HTTP', summaryResponse.status);
    return;
  }

  const summary = await summaryResponse.json();
  console.log('[ok] launch-summary');
  console.log('  network:', summary.network);
  console.log('  test_launch:', summary.test_launch);
  console.log('  official_owner_configured:', summary.official_owner_configured);
  console.log('  server_time_ms:', summary.generated_at_ms);
  console.log('  walrus_border_art:', summary.walrus_border_art?.configured ?? false);

  const probeResponse = await fetch(indexerUrl + '/api/ops/wallet-auth-probe', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ owner: OFFICIAL_OWNER }),
  }).catch(() => null);

  if (!probeResponse) {
    console.log('[!!] wallet-auth-probe unavailable (deploy backend probe route to continue live auth tests)');
    return;
  }

  if (probeResponse.status === 404) {
    console.log('[!!] wallet-auth-probe route not deployed yet');
    return;
  }

  const probe = await probeResponse.json();
  console.log('[ok] wallet-auth-probe');
  console.log('  require_signature:', probe.require_signature);
  console.log('  official_owner_prefix:', probe.official_owner_prefix);
  console.log('  owner_is_official:', probe.owner_is_official);
  console.log('  server_skew_hint_ms:', probe.server_skew_hint_ms);
}

async function simulateZkLoginVerify() {
  console.log('');
  console.log('Local zkLogin-style signature simulation');
  console.log('---------------------------------------');

  const owner = OFFICIAL_OWNER;
  const keypair = Ed25519Keypair.generate();
  const signerAddress = keypair.getPublicKey().toSuiAddress();
  const timestampMs = Date.now();
  const message = buildWalletAuthMessage(owner, timestampMs);
  const bytes = new TextEncoder().encode(message);
  const { signature } = await keypair.signPersonalMessage(bytes);

  const verifyOwner = await verifyPersonalMessageSignature(bytes, signature, { address: owner }).then(
    () => true,
    () => false
  );
  const verifySigner = await verifyPersonalMessageSignature(bytes, signature, {
    address: signerAddress,
  }).then(
    () => true,
    () => false
  );

  console.log('[ok] ephemeral signer', signerAddress.slice(0, 14) + '…');
  console.log(verifyOwner ? '[ok]' : '[XX]', 'verify against owner address (expected fail for zkLogin)');
  console.log(verifySigner ? '[ok]' : '[XX]', 'verify against signerAddress (expected pass)');

  const verifyResponse = await fetch(
    (readArg('--indexer-url') || DEFAULT_INDEXER) + '/api/ops/wallet-auth-probe',
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        owner,
        auth: {
          signature,
          timestampMs,
          signerAddress,
        },
      }),
    }
  ).catch(() => null);

  if (verifyResponse?.ok) {
    const body = await verifyResponse.json();
    console.log('[ok] live verify probe', JSON.stringify(body.verify));
  }
}

async function printBrowserChecklist() {
  console.log('');
  console.log('Browser checklist (run in DevTools on nami-fiends.vercel.app)');
  console.log('--------------------------------------------------------------');
  console.log('1. localStorage.getItem("nami.zklogin.session")');
  console.log('   - address should equal official owner');
  console.log('   - ephemeralSecretKey must be present (non-empty string)');
  console.log('2. Check for competing wallet extension:');
  console.log('   - Disconnect any Sui wallet extension before saving border art');
  console.log('3. In Network tab, inspect POST /api/platform/chat-overlay-rewards/sync');
  console.log('   - body.owner should be official owner');
  console.log('   - body.auth.signerAddress should be present for zkLogin');
  console.log('   - response 401 wallet_auth_invalid means backend rejected signature');
}

const indexerUrl = (readArg('--indexer-url') || DEFAULT_INDEXER).replace(/\/$/, '');

await probeIndexer(indexerUrl);
await simulateZkLoginVerify();
await printBrowserChecklist();