import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import apiClient, {
  clearLmsToken,
  getLmsToken,
  setLmsToken,
} from '../services/apiClient';

const LMSAuthContext = createContext(null);

export function LMSAuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const token = getLmsToken();
    if (!token) {
      setUser(null);
      setLoading(false);
      return null;
    }
    try {
      // First try /users/profile to get complete user data including profilePicture
      let userData = null;
      try {
        const pRes = await apiClient.get('/users/profile');
        userData = pRes.data?.user || pRes.data;
      } catch {
        const res = await apiClient.get('/auth/me');
        userData = res.data?.user || res.data;
      }
      setUser(userData);
      return userData;
    } catch {
      clearLmsToken();
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshMe();
  }, [refreshMe]);

  useEffect(() => {
    const handleUnauth = () => {
      clearLmsToken();
      setUser(null);
    };
    const handlePaymentLock = () => {
      refreshMe();
    };
    window.addEventListener('lms:unauthorized', handleUnauth);
    window.addEventListener('lms:payment-locked', handlePaymentLock);
    return () => {
      window.removeEventListener('lms:unauthorized', handleUnauth);
      window.removeEventListener('lms:payment-locked', handlePaymentLock);
    };
  }, [refreshMe]);

  const login = async (email, password, remember = true) => {
    const res = await apiClient.post('/auth/login', { email, password });
    setLmsToken(res.data.token, remember);
    let fullUser = res.data.user;
    try {
      const pRes = await apiClient.get('/users/profile');
      fullUser = pRes.data?.user || pRes.data || fullUser;
    } catch {}
    setUser(fullUser);
    return fullUser;
  };

  const register = async (payload) => {
    const res = await apiClient.post('/auth/register', payload);
    setLmsToken(res.data.token, true);
    setUser(res.data.user);
    return res.data.user;
  };

  const logout = async () => {
    try {
      if (getLmsToken()) {
        await apiClient.post('/auth/logout');
      }
    } catch {
      // still clear local state cleanly
    }
    clearLmsToken();
    setUser(null);
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'LOGOUT_CLEAR_CACHES',
      });
    }
  };

  return (
    <LMSAuthContext.Provider
      value={{ user, loading, login, register, logout, refreshMe }}
    >
      {children}
    </LMSAuthContext.Provider>
  );
}

export function useLMSAuth() {
  const ctx = useContext(LMSAuthContext);
  if (!ctx) throw new Error('useLMSAuth must be used inside LMSAuthProvider');
  return ctx;
}

