import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';
import { ErrorBoundary } from './components/ErrorBoundary/ErrorBoundary';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found in DOM');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <ErrorBoundary context="App Root">
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);

// Register Service Worker for PWA and Web Push
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((reg) => console.info('[Credzo SW] Registered with scope:', reg.scope))
      .catch((err) => console.warn('[Credzo SW] Registration notice:', err));
  });
}
