import { createContext, useContext, useEffect, useState } from 'react';

const PWAInstallContext = createContext(null);

export function PWAInstallProvider({ children }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [updateWaiting, setUpdateWaiting] = useState(null);

  const isIOS =
    typeof navigator !== 'undefined' &&
    /iPad|iPhone|iPod/.test(navigator.userAgent) &&
    !window.MSStream;

  useEffect(() => {
    const standalone =
      window.matchMedia?.('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsInstalled(Boolean(standalone));

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    const onAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onAppInstalled);

    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      navigator.serviceWorker
        .register('/lms/sw.js', { scope: '/lms/' })
        .then((reg) => {
          if (reg.waiting) setUpdateWaiting(reg.waiting);
          reg.addEventListener('updatefound', () => {
            const installing = reg.installing;
            if (!installing) return;
            installing.addEventListener('statechange', () => {
              if (
                installing.state === 'installed' &&
                navigator.serviceWorker.controller
              ) {
                setUpdateWaiting(installing);
              }
            });
          });
        })
        .catch(() => {
          // registration optional in dev
        });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onAppInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      if (choice?.outcome === 'accepted') setIsInstalled(true);
      return;
    }
    setShowInstructions(true);
  };

  const applyUpdate = () => {
    if (updateWaiting) {
      updateWaiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  return (
    <PWAInstallContext.Provider
      value={{
        canNativeInstall: Boolean(deferredPrompt),
        isInstalled,
        isIOS,
        showInstructions,
        setShowInstructions,
        promptInstall,
        hasUpdate: Boolean(updateWaiting),
        applyUpdate,
      }}
    >
      {children}
    </PWAInstallContext.Provider>
  );
}

export function usePWAInstall() {
  const ctx = useContext(PWAInstallContext);
  if (!ctx) throw new Error('usePWAInstall must be used inside PWAInstallProvider');
  return ctx;
}

