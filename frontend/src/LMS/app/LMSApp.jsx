import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import LMSProviders from './LMSProviders';
import LMSRoutes from './LMSRoutes';
import AppSplashScreen from '../components/feedback/AppSplashScreen';

export default function LMSApp() {
  const [booting, setBooting] = useState(true);

  return (
    <BrowserRouter>
      <LMSProviders>
        {booting ? (
          <AppSplashScreen durationMs={3800} onComplete={() => setBooting(false)} />
        ) : (
          <LMSRoutes />
        )}
      </LMSProviders>
    </BrowserRouter>
  );
}
