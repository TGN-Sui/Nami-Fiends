import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './App.js';
import { NamiWalletProvider } from './wallet.js';
import './styles.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <NamiWalletProvider>
      <App />
    </NamiWalletProvider>
  </React.StrictMode>
);