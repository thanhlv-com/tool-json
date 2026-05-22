import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {registerSW} from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

const SW_UPDATE_INTERVAL_MS = 60 * 1000;

const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_swUrl, registration) {
    if (!registration) {
      return;
    }

    const checkForUpdate = () => {
      if (!navigator.onLine) {
        return;
      }

      registration.update().catch(() => undefined);
    };

    const checkWhenVisible = () => {
      if (document.visibilityState !== 'visible') {
        return;
      }

      checkForUpdate();
    };

    checkForUpdate();
    window.addEventListener('online', checkForUpdate);
    document.addEventListener('visibilitychange', checkWhenVisible);
    window.setInterval(checkForUpdate, SW_UPDATE_INTERVAL_MS);
  },
  onNeedRefresh() {
    updateSW(true);
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
