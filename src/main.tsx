import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/main.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the (intentionally no-op) service worker — required by Chrome/Android
// for the app to be considered "installable" as a PWA. See public/sw.js for why
// it doesn't cache anything.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Installability is a nice-to-have, not a hard requirement — if registration
      // fails for any reason, the app still works fine as a regular web page.
    });
  });
}
