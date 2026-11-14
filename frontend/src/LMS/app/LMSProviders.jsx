import { Toaster } from 'react-hot-toast';
import { LMSAuthProvider } from '../context/LMSAuthContext';
import { PWAInstallProvider } from '../context/PWAInstallContext';

export default function LMSProviders({ children }) {
  return (
    <PWAInstallProvider>
      <LMSAuthProvider>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2800,
            style: { borderRadius: '16px', fontSize: '13px', fontWeight: 600 },
          }}
        />
        {children}
      </LMSAuthProvider>
    </PWAInstallProvider>
  );
}

