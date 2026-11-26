import * as React from 'react';
import ReactDOM from 'react-dom/client';
import { FirebaseCrashlytics } from 'firebase/crashlytics/react';
import App from './App';
import { app, crashlyticsOptions } from './src/firebase';
import { FirebaseProvider } from './src/context/AuthContext';
import { ErrorBoundary } from './src/components/ErrorBoundary';

// Google Maps Platform Tier 1 global quota & auth failure listener
(window as any).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};
const origConsoleError = console.error;
console.error = (...args: unknown[]) => {
  origConsoleError.apply(console, args);
  const msg = args.map((a) => String(a)).join(' ');
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Could not find root element to mount to');
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <FirebaseCrashlytics firebaseApp={app} crashlyticsOptions={crashlyticsOptions} />
    <ErrorBoundary>
      <FirebaseProvider>
        <App />
      </FirebaseProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
