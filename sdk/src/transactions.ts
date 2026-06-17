export interface EnterNamiParams {
  nodename: string;
  displayName: string;
  archetype: number;
}

export function enterNamiMoveTarget(packageId: string): string {
  if (packageId.trim() === '' || !packageId.startsWith('0x')) {
    throw new Error('enterNamiMoveTarget requires a valid packageId.');
  }

  return `${packageId}::onboarding::enter_nami`;
}

export function validateEnterNamiParams(params: EnterNamiParams): EnterNamiParams {
  if (params.nodename.trim() === '') {
    throw new Error('enter_nami requires a nodename.');
  }

  if (params.displayName.trim() === '') {
    throw new Error('enter_nami requires a displayName.');
  }

  return {
    nodename: params.nodename.trim().toLowerCase(),
    displayName: params.displayName.trim(),
    archetype: params.archetype,
  };
}