export interface EnterNamiParams {
  nodename: string;
  archetype: number;
  avatarRef: string;
  nodenameRegistryId: string;
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

  const registryId = params.nodenameRegistryId.trim();
  const avatarRef = params.avatarRef.trim();

  if (!registryId.startsWith('0x')) {
    throw new Error('enter_nami requires a nodenameRegistryId.');
  }

  if (avatarRef.length > 512) {
    throw new Error('enter_nami avatarRef must be 512 characters or fewer.');
  }

  return {
    nodename: params.nodename.trim().toLowerCase(),
    archetype: params.archetype,
    avatarRef,
    nodenameRegistryId: registryId,
  };
}