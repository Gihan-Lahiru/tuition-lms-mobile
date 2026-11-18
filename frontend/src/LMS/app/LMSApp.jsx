import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import LMSProviders from './LMSProviders';
import LMSRoutes from './LMSRoutes';
import AppSplashScreen from '../components/feedback/AppSplashScreen';

export default function LMSApp() {
  // Show splash screen only ONCE per browser session
  const [booting, setBooting] = useState(() => {
    try {
      return sessionStorage.getItem('lms_splash_seen') !== 'true';
    } catch {
      return true;
    }
  });

  const handleComplete = () => {
    try {
      sessionStorage.setItem('lms_splash_seen', 'true');
    } catch {}
    setBooting(false);
  };

  return (
    <BrowserRouter>
      <LMSProviders>
        {booting ? (
          <AppSplashScreen durationMs={2600} onComplete={handleComplete} />
        ) : (
          <LMSRoutes />
        )}
      </LMSProviders>
    </BrowserRouter>
  );
}
