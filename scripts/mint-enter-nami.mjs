#!/usr/bin/env node
/**
 * Mint enter_nami for the wallet in env (must sign as that wallet).
 *
 * Usage:
 *   node scripts/mint-enter-nami.mjs
 *   node scripts/mint-enter-nami.mjs --nodename fiendtgnceo --archetype 1
 *   node scripts/mint-enter-nami.mjs --owner 0x... --signer-secret suiprivkey...
 *
 * Requires:
 *   - deployments/testnet/latest.json (or synced backend/.env)
 *   - Signer: `sui client active-address` matches --owner / NAMI_OFFICIAL_OWNER, OR
 *     NAMI_MINT_SIGNER_SECRET in backend/.env (bech32 suiprivkey)
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const sdkDist = path.join(rootDir, 'sdk', 'dist', 'index.js');

function readArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] ?? '' : '';
}

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const values = {};

  for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separator = trimmed.indexOf('=');

    if (separator <= 0) {
      continue;
    }

    values[trimmed.slice(0, separator).trim()] = trimmed.slice(separator + 1).trim();
  }

  return values;
}

function readConfig() {
  const backendEnv = parseEnv(path.join(rootDir, 'backend', '.env'));
  const latestPath = path.join(rootDir, 'deployments', 'testnet', 'latest.json');
  const latest = fs.existsSync(latestPath)
    ? JSON.parse(fs.readFileSync(latestPath, 'utf8'))
    : {};

  const packageId = backendEnv.NAMI_PACKAGE_ID || latest.packageId || '';
  const registryId = backendEnv.NAMI_NODENAME_REGISTRY_ID || latest.nodenameRegistryId || '';
  const owner =
    readArg('--owner') ||
    backendEnv.NAMI_OFFICIAL_OWNER ||
    parseEnv(path.join(rootDir, 'frontend', '.env.local')).VITE_NAMI_OFFICIAL_OWNER ||
    '';
  const nodename =
    readArg('--nodename') ||
    backendEnv.NAMI_OFFICIAL_NODENAME ||
    parseEnv(path.join(rootDir, 'frontend', '.env.local')).VITE_NAMI_OFFICIAL_NODENAME ||
    'fiendtgnceo';
  const archetype = Number(readArg('--archetype') || backendEnv.NAMI_OFFICIAL_ARCHETYPE || '1');
  const avatarRef = readArg('--avatar-ref') || backendEnv.NAMI_OFFICIAL_AVATAR_REF || 'seed:official-owner';
  const signerSecret =
    readArg('--signer-secret') || backendEnv.NAMI_MINT_SIGNER_SECRET || process.env.NAMI_MINT_SIGNER_SECRET || '';

  return { packageId, registryId, owner, nodename, archetype, avatarRef, signerSecret, backendEnv };
}

async function loadMystenModules() {
  const roots = [
    path.join(rootDir, 'sdk', 'node_modules', '@mysten', 'sui'),
    path.join(rootDir, 'backend', 'node_modules', '@mysten', 'sui'),
  ];

  for (const root of roots) {
    const keypairPath = path.join(root, 'dist', 'esm', 'keypairs', 'ed25519', 'index.js');
    const txPath = path.join(root, 'dist', 'esm', 'transactions', 'index.js');

    if (fs.existsSync(keypairPath) && fs.existsSync(txPath)) {
      const [{ Ed25519Keypair }, { Transaction }] = await Promise.all([
        import(pathToFileURL(keypairPath).href),
        import(pathToFileURL(txPath).href),
      ]);

      return { Ed25519Keypair, Transaction };
    }
  }

  throw new Error('Install @mysten/sui via npm --prefix sdk install');
}

async function lookupOwner(chain, registryId, owner) {
  const { lookupOwnerInRegistry } = await import(pathToFileURL(sdkDist).href);
  return lookupOwnerInRegistry(chain, registryId, owner);
}

async function mintWithKeypair(config, keypair) {
  const { Transaction } = await loadMystenModules();
  const { createNamiClient, enterNamiMoveTarget, normalizeNodename } = await import(
    pathToFileURL(sdkDist).href
  );

  const nodename = normalizeNodename(config.nodename);

  if (!nodename) {
    throw new Error(`Invalid nodename: ${config.nodename}`);
  }

  const chain = createNamiClient({
    packageId: config.packageId,
    network: 'testnet',
  });

  const existing = await lookupOwner(chain, config.registryId, config.owner);

  if (existing?.registered) {
    console.log(`Owner already registered as ${existing.nodename || '(indexed)'}`);
    return existing;
  }

  const tx = new Transaction();
  tx.moveCall({
    target: enterNamiMoveTarget(config.packageId),
    arguments: [
      tx.object(config.registryId),
      tx.pure.string(nodename),
      tx.pure.u8(config.archetype),
      tx.pure.string(config.avatarRef),
    ],
  });

  const result = await chain.sui.signAndExecuteTransaction({
    signer: keypair,
    transaction: tx,
    options: { showEffects: true, showEvents: true },
  });

  if (result.effects?.status?.status !== 'success') {
    throw new Error(`enter_nami failed: ${result.effects?.status?.error ?? 'unknown error'}`);
  }

  console.log('enter_nami succeeded');
  console.log('  digest:', result.digest);
  console.log('  owner:', config.owner);
  console.log('  nodename:', nodename);

  return lookupOwner(chain, config.registryId, config.owner);
}

function activeSuiAddress() {
  try {
    return execSync('sui client active-address', { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

function mintWithSuiCli(config) {
  const args = [
    'client',
    'call',
    '--package',
    config.packageId,
    '--module',
    'onboarding',
    '--function',
    'enter_nami',
    '--args',
    config.registryId,
    config.nodename,
    String(config.archetype),
    config.avatarRef,
    '--gas-budget',
    '50000000',
  ];

  const output = execSync(['sui', ...args].join(' '), { encoding: 'utf8' });
  const digestMatch = output.match(/Transaction Digest: ([A-Za-z0-9]+)/);

  console.log('enter_nami succeeded via sui CLI');
  console.log('  digest:', digestMatch?.[1] ?? '(see output above)');
  console.log('  owner:', config.owner);
  console.log('  nodename:', config.nodename);
}

async function main() {
  if (!fs.existsSync(sdkDist)) {
    console.error('Build SDK first: npm --prefix sdk run build');
    process.exit(1);
  }

  const config = readConfig();

  if (!config.packageId.startsWith('0x') || !config.registryId.startsWith('0x')) {
    console.error('Missing packageId or nodenameRegistryId — run sync-testnet-env.mjs');
    process.exit(1);
  }

  if (!config.owner.startsWith('0x')) {
    console.error('Missing owner — set NAMI_OFFICIAL_OWNER in backend/.env');
    process.exit(1);
  }

  const { createNamiClient } = await import(pathToFileURL(sdkDist).href);
  const chain = createNamiClient({ packageId: config.packageId, network: 'testnet' });
  const existing = await lookupOwner(chain, config.registryId, config.owner);

  if (existing?.registered) {
    console.log(`Already minted: ${existing.nodename} (${existing.identityId})`);
    process.exit(0);
  }

  if (config.signerSecret.trim()) {
    const { Ed25519Keypair } = await loadMystenModules();
    const keypair = Ed25519Keypair.fromSecretKey(config.signerSecret.trim());
    const signerAddress = keypair.getPublicKey().toSuiAddress();

    if (signerAddress.toLowerCase() !== config.owner.toLowerCase()) {
      console.error('NAMI_MINT_SIGNER_SECRET does not match target owner');
      console.error('  signer:', signerAddress);
      console.error('  owner: ', config.owner);
      process.exit(1);
    }

    await mintWithKeypair(config, keypair);
    process.exit(0);
  }

  const active = activeSuiAddress();

  if (active.toLowerCase() === config.owner.toLowerCase()) {
    mintWithSuiCli(config);
    process.exit(0);
  }

  console.error('Cannot mint enter_nami for official owner without that wallet signer.');
  console.error('');
  console.error('Target owner:', config.owner);
  console.error('Active sui CLI: ', active || '(none)');
  console.error('');
  console.error('Options:');
  console.error('  1. sui client switch --address <official-owner-alias>');
  console.error('  2. Set NAMI_MINT_SIGNER_SECRET in backend/.env (bech32 suiprivkey)');
  console.error('  3. Sign enter_nami in the Nami app with zkLogin on that address');
  process.exit(1);
}

void main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});