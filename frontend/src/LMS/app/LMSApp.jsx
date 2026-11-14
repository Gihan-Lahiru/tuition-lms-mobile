import { useState, useEffect } from 'react';
import { BrowserRouter } from 'react-router-dom';
import LMSProviders from './LMSProviders';
import LMSRoutes from './LMSRoutes';
import AppSplashScreen from '../components/feedback/AppSplashScreen';

export default function LMSApp() {
  const [booting, setBooting] = useState(true);

  // Give 1800ms for a satisfying, clean, high-end mobile app boot experience
  useEffect(() => {
    const timer = setTimeout(() => {
      setBooting(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  if (booting) {
    return <AppSplashScreen durationMs={1800} onComplete={() => setBooting(false)} />;
  }

  return (
    <BrowserRouter>
      <LMSProviders>
        <LMSRoutes />
      </LMSProviders>
    </BrowserRouter>
  );
}
