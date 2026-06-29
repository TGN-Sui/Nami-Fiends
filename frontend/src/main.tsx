import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App.js';
import { bootstrapTestLaunchLoungeMocks } from './fixtures/test-launch-lounge-mocks.js';
import { ensureGenesisLocalDataOnTestLaunch } from './genesis-member.js';
import { bootstrapOfficialsSubmissionsHydration } from './officials-submissions-sync.js';
import './partner-banner-submission-store.js';
import { initNamiSoundscape } from './nami-sfx.js';
import { NamiThemeProvider } from './theme.js';
import { NamiWalletProvider } from './wallet.js';
import './styles.css';
import './phase7-ui.css';
import './my-profile-modern.css';
import './nami-light-theme.css';
import './nami-dark-theme.css';
import './nami-custom-theme.css';
import './nami-pixel-ui.css';
import './nami-classic-ui.css';


ensureGenesisLocalDataOnTestLaunch();
bootstrapTestLaunchLoungeMocks();
initNamiSoundscape();

void import('./channel-media-persistence.js').then(({ bootstrapChannelMediaPersistence }) => {
  void bootstrapChannelMediaPersistence();
});

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found.');
}

void bootstrapOfficialsSubmissionsHydration().finally(() => {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <NamiWalletProvider>
        <NamiThemeProvider>
          <App />
        </NamiThemeProvider>
      </NamiWalletProvider>
    </React.StrictMode>
  );
});