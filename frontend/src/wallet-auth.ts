export type WalletAuthPayload = {
  signature: string;
  timestampMs: number;
};

export function buildWalletAuthMessage(owner: string, timestampMs: number): string {
  return 'nami-auth:v1:' + owner.toLowerCase() + ':' + String(timestampMs);
}

type WalletAuthSigner = (owner: string) => Promise<WalletAuthPayload>;

let walletAuthSigner: WalletAuthSigner | null = null;

export function registerWalletAuthSigner(signer: WalletAuthSigner | null): void {
  walletAuthSigner = signer;
}

export async function createWalletAuthPayload(owner: string): Promise<WalletAuthPayload | null> {
  if (!owner.startsWith('0x') || !walletAuthSigner) {
    return null;
  }

  return walletAuthSigner(owner);
}