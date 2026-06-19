import type { MediaUploadKind } from './media-upload-service.js';

export type OwnerMediaSlot =
  | 'channel-cover'
  | 'partner-carousel-banner'
  | 'super-banner-cover'
  | 'focused-banner-cover'
  | 'news-section-banner'
  | 'hero-background';

export type OwnerMediaSpec = {
  id: OwnerMediaSlot;
  label: string;
  usage: string;
  recommendedPixels: string;
  aspectRatio: string;
  previewClassName: string;
  uploadKind: MediaUploadKind;
};

export const OWNER_MEDIA_SPECS: Record<OwnerMediaSlot, OwnerMediaSpec> = {
  'channel-cover': {
    id: 'channel-cover',
    label: 'Cover image',
    usage: 'Game Hub cards, channel avatars, and directory tiles.',
    recommendedPixels: '800 × 800 px',
    aspectRatio: '1:1 square',
    previewClassName: 'is-owner-media-preview-square',
    uploadKind: 'channel-cover',
  },
  'partner-carousel-banner': {
    id: 'partner-carousel-banner',
    label: 'Featured partner cover banner',
    usage: 'Nami Hub Featured Partner Banner Carousel ticket.',
    recommendedPixels: '1920 × 640 px',
    aspectRatio: '3:1 wide',
    previewClassName: 'is-owner-media-preview-wide-3-1',
    uploadKind: 'channel-cover',
  },
  'super-banner-cover': {
    id: 'super-banner-cover',
    label: 'Super Banner cover',
    usage: 'Full-screen Super Banner alert shown to every member.',
    recommendedPixels: '1040 × 650 px',
    aspectRatio: '16:10',
    previewClassName: 'is-owner-media-preview-16-10',
    uploadKind: 'channel-cover',
  },
  'focused-banner-cover': {
    id: 'focused-banner-cover',
    label: 'Focused banner alert cover',
    usage: 'Get Banners subscriber popup on this channel.',
    recommendedPixels: '1280 × 800 px',
    aspectRatio: '16:10',
    previewClassName: 'is-owner-media-preview-16-10',
    uploadKind: 'channel-cover',
  },
  'news-section-banner': {
    id: 'news-section-banner',
    label: 'News section banner',
    usage: 'Hero image above announcements on your News tab.',
    recommendedPixels: '1920 × 600 px',
    aspectRatio: '16:5 wide',
    previewClassName: 'is-owner-media-preview-news-banner',
    uploadKind: 'channel-cover',
  },
  'hero-background': {
    id: 'hero-background',
    label: 'Profile hero background',
    usage: 'Background art behind your channel hero on My Profile.',
    recommendedPixels: '1920 × 720 px',
    aspectRatio: '8:3 wide',
    previewClassName: 'is-owner-media-preview-hero-background',
    uploadKind: 'channel-cover',
  },
};

export function ownerMediaDimensionNote(slot: OwnerMediaSlot): string {
  const spec = OWNER_MEDIA_SPECS[slot];

  return (
    'Recommended ' +
    spec.recommendedPixels +
    ' (' +
    spec.aspectRatio +
    '). ' +
    spec.usage
  );
}

export function ownerMediaSpecForSlot(slot: OwnerMediaSlot): OwnerMediaSpec {
  return OWNER_MEDIA_SPECS[slot];
}