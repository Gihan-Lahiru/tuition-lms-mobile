/**
 * Automatic PWA Service Worker Registration & Live Updater
 * Ensures:
 * 1. Service Worker is registered with the correct /lms/ scope.
 * 2. Checks for updates on every app launch.
 * 3. Activates updates automatically without requiring manual reinstall.
 * 4. Silently reloads when a new version/icon is deployed so students always have the latest app.
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Run on page load
  window.addEventListener('load', async () => {
    try {
      const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      // In production, append timestamp query to bypass any edge CDN caching
      const swUrl = isLocal ? '/lms/sw.js' : `/lms/sw.js?v=${Date.now()}`;

      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/lms/',
        updateViaCache: 'none', // Force browser to bypass HTTP cache for sw.js
      });

      console.log('[MW Learn PWA] Service Worker active:', registration.scope);

      // Check for updates immediately on launch
      registration.update().catch(() => {});

      // When a new SW is found
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          // New worker is installed and ready to take over
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[MW Learn PWA] New update ready. Activating immediately...');
            newWorker.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });

      // Auto-reload to apply new icons & assets when new worker claims clients
      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          refreshing = true;
          console.log('[MW Learn PWA] Fresh version activated. Refreshing app...');
          window.location.reload();
        }
      });

      // Periodic check every 15 minutes while app is running
      setInterval(() => {
        registration.update().catch(() => {});
      }, 15 * 60 * 1000);

    } catch (err) {
      console.warn('[MW Learn PWA] Service Worker registration notice:', err);
    }
  });
}

export default registerServiceWorker;
