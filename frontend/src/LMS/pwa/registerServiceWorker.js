/**
 * PWA Service Worker Registration
 * Stable registration without reloading loops.
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', async () => {
    try {
      // Always use fixed script path without random timestamp queries
      const swUrl = '/lms/sw.js';

      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/lms/',
      });

      console.log('[MW Learn PWA] Service Worker registered:', registration.scope);

      // Silently check for updates in background
      if (registration) {
        registration.update().catch(() => {});
      }
    } catch (err) {
      console.warn('[MW Learn PWA] Service Worker notice:', err);
    }
  });
}

export default registerServiceWorker;
