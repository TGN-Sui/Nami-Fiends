/** Last wallet address observed from dapp-kit (set by useProtocolOwner). */
let lastWalletOwner: string | null = null;

export function setLastWalletOwner(address: string | null): void {
  lastWalletOwner = address?.startsWith('0x') ? address : null;
}

export function readLastWalletOwner(): string | null {
  return lastWalletOwner;
}

export function resetLastWalletOwnerForTests(): void {
  lastWalletOwner = null;
}