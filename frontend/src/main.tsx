import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App.js';
import { initNamiSoundscape } from './nami-sfx.js';
import { NamiThemeProvider } from './theme.js';
import { NamiWalletProvider } from './wallet.js';
import './styles.css';
import './phase7-ui.css';
import './nami-light-theme.css';
import './nami-dark-theme.css';
import './nami-custom-theme.css';

initNamiSoundscape();

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <NamiWalletProvider>
      <NamiThemeProvider>
        <App />
      </NamiThemeProvider>
    </NamiWalletProvider>
  </React.StrictMode>
);