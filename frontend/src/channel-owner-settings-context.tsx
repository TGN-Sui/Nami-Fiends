import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react';

import {
  commitOwnerSettings,
  discardOwnerSettingsDraft,
  ensureOwnerSettingsDraft,
  refreshOwnerSettingsDraftPromotions,
  resetOwnerSettingsBrandPalette,
  updateOwnerSettingsDraft,
  useOwnerSettingsDraft,
  type ChannelOwnerSettingsDraft,
} from './channel-owner-settings-draft.js';
import type { NamiChannel } from './uiMockData.js';

export type ChannelOwnerSettingsContextValue = {
  draft: ChannelOwnerSettingsDraft;
  isDirty: boolean;
  saveNotice: string | null;
  saveError: string | null;
  updatePlatforms: (platforms: string[]) => void;
  updateGenres: (genres: string[]) => void;
  updateBrandColor: (index: number, color: string) => void;
  resetBrandPalette: () => void;
  updateSuperBanner: (patch: Partial<ChannelOwnerSettingsDraft['superBanner']>) => void;
  updatePartnerCarousel: (patch: Partial<ChannelOwnerSettingsDraft['partnerCarousel']>) => void;
  updateBannerEditor: (patch: Partial<ChannelOwnerSettingsDraft['bannerEditor']>) => void;
  saveSettings: () => void;
  discardSettings: () => void;
  clearMessages: () => void;
};

const ChannelOwnerSettingsContext = createContext<ChannelOwnerSettingsContextValue | null>(null);

export function ChannelOwnerSettingsProvider(props: {
  channel: NamiChannel;
  children: ReactNode;
}): ReactElement {
  ensureOwnerSettingsDraft(props.channel);
  const { draft, isDirty } = useOwnerSettingsDraft(props.channel.id);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    refreshOwnerSettingsDraftPromotions(props.channel);
  }, [props.channel.id]);

  const clearMessages = useCallback(() => {
    setSaveNotice(null);
    setSaveError(null);
  }, []);

  const value = useMemo((): ChannelOwnerSettingsContextValue | null => {
    if (!draft) {
      return null;
    }

    return {
      draft,
      isDirty,
      saveNotice,
      saveError,
      updatePlatforms: (platforms) => {
        clearMessages();
        updateOwnerSettingsDraft(props.channel.id, { platforms });
      },
      updateGenres: (genres) => {
        clearMessages();
        updateOwnerSettingsDraft(props.channel.id, { genres });
      },
      updateBrandColor: (index, color) => {
        clearMessages();
        const nextPalette = draft.brandPalette
          .map((currentColor, currentIndex) => (currentIndex === index ? color : currentColor))
          .slice(0, 4);
        updateOwnerSettingsDraft(props.channel.id, { brandPalette: nextPalette });
      },
      resetBrandPalette: () => {
        clearMessages();
        resetOwnerSettingsBrandPalette(props.channel.id);
      },
      updateSuperBanner: (patch) => {
        clearMessages();
        updateOwnerSettingsDraft(props.channel.id, { superBanner: patch });
      },
      updatePartnerCarousel: (patch) => {
        clearMessages();
        updateOwnerSettingsDraft(props.channel.id, { partnerCarousel: patch });
      },
      updateBannerEditor: (patch) => {
        clearMessages();
        updateOwnerSettingsDraft(props.channel.id, { bannerEditor: patch });
      },
      saveSettings: () => {
        const result = commitOwnerSettings(props.channel);

        if (result.ok) {
          setSaveNotice(result.message);
          setSaveError(null);
        } else {
          setSaveError(result.message);
          setSaveNotice(null);
        }
      },
      discardSettings: () => {
        discardOwnerSettingsDraft(props.channel);
        setSaveNotice('Unsaved changes discarded.');
        setSaveError(null);
      },
      clearMessages,
    };
  }, [clearMessages, draft, isDirty, props.channel, saveError, saveNotice]);

  if (!value) {
    return <>{props.children}</>;
  }

  return (
    <ChannelOwnerSettingsContext.Provider value={value}>{props.children}</ChannelOwnerSettingsContext.Provider>
  );
}

export function useChannelOwnerSettings(): ChannelOwnerSettingsContextValue {
  const context = useContext(ChannelOwnerSettingsContext);

  if (!context) {
    throw new Error('useChannelOwnerSettings must be used within ChannelOwnerSettingsProvider');
  }

  return context;
}

export function useOptionalChannelOwnerSettings(): ChannelOwnerSettingsContextValue | null {
  return useContext(ChannelOwnerSettingsContext);
}