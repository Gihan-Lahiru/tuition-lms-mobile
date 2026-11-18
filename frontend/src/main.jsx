import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { registerServiceWorker } from './LMS/pwa/registerServiceWorker';

// Register automatic PWA updater & service worker
registerServiceWorker();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

