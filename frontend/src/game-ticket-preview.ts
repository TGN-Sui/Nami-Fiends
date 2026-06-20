import type { GameOfficialSocialPlatform } from './game-onboarding-draft.js';
import { GAME_STORE_LINK_FIELDS } from './game-genres.js';

export type GameTicketPreviewField = {
  id: string;
  label: string;
  value: string;
  href?: string;
};

export type GameTicketPreviewInput = {
  gameTitle: string;
  studioName: string;
  contactName: string;
  email: string;
  genres: string[];
  websiteUrl: string;
  trailerUrl: string;
  steamStoreUrl: string;
  epicStoreUrl: string;
  xboxStoreUrl: string;
  playstationStoreUrl: string;
  otherStoreUrl: string;
  officialSocialPlatform: GameOfficialSocialPlatform | null;
  officialSocialHandle: string;
  officialSocialVerified: boolean;
};

function pushIfFilled(
  fields: GameTicketPreviewField[],
  id: string,
  label: string,
  value: string,
  asLink = false,
): void {
  const trimmed = value.trim();

  if (trimmed === '') {
    return;
  }

  fields.push({
    id,
    label,
    value: trimmed,
    ...(asLink ? { href: trimmed } : {}),
  });
}

export function buildGameTicketPreviewFields(input: GameTicketPreviewInput): GameTicketPreviewField[] {
  const fields: GameTicketPreviewField[] = [];

  pushIfFilled(fields, 'studio', 'Studio', input.studioName);
  pushIfFilled(fields, 'contact', 'Contact', input.contactName);
  pushIfFilled(fields, 'email', 'Email', input.email);

  const genres = input.genres.map((genre) => genre.trim()).filter((genre) => genre.length > 0);

  if (genres.length > 0) {
    fields.push({
      id: 'genres',
      label: genres.length === 1 ? 'Genre' : 'Genres',
      value: genres.join(', '),
    });
  }

  if (input.officialSocialPlatform && input.officialSocialHandle.trim() !== '') {
    const platformLabel = input.officialSocialPlatform === 'twitch' ? 'Twitch' : 'X';
    const verifiedSuffix = input.officialSocialVerified ? ' (verified)' : '';

    fields.push({
      id: 'official-social',
      label: 'Official ' + platformLabel,
      value: input.officialSocialHandle.trim() + verifiedSuffix,
    });
  }

  pushIfFilled(fields, 'website', 'Website', input.websiteUrl, true);
  pushIfFilled(fields, 'trailer', 'Trailer', input.trailerUrl, true);

  for (const storeField of GAME_STORE_LINK_FIELDS) {
    pushIfFilled(
      fields,
      storeField.key,
      storeField.label,
      input[storeField.key],
      true,
    );
  }

  return fields;
}