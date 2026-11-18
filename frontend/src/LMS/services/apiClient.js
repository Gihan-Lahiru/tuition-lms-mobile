import axios from 'axios';

export const LMS_TOKEN_KEY = 'mw_lms_token';

export function getLmsToken() {
  try {
    return sessionStorage.getItem(LMS_TOKEN_KEY) || localStorage.getItem(LMS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setLmsToken(token, remember = true) {
  try {
    if (remember) {
      localStorage.setItem(LMS_TOKEN_KEY, token);
      sessionStorage.removeItem(LMS_TOKEN_KEY);
    } else {
      sessionStorage.setItem(LMS_TOKEN_KEY, token);
      localStorage.removeItem(LMS_TOKEN_KEY);
    }
  } catch {
    // ignore storage restriction
  }
}

export function clearLmsToken() {
  try {
    localStorage.removeItem(LMS_TOKEN_KEY);
    sessionStorage.removeItem(LMS_TOKEN_KEY);
  } catch {
    // ignore
  }
}

const isLocalEnv = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  window.location.hostname.startsWith('172.') ||
  window.location.hostname.startsWith('192.168.')
);

const defaultBaseUrl = isLocalEnv
  ? '/api'
  : 'https://tutionproject-backendv2-qpji.vercel.app/api';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || defaultBaseUrl,
  timeout: 20000,
});

apiClient.interceptors.request.use((config) => {
  const token = getLmsToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      window.dispatchEvent(new CustomEvent('lms:unauthorized'));
    }
    if (status === 403 && error?.response?.data?.code === 'PAYMENT_LOCKED') {
      window.dispatchEvent(new CustomEvent('lms:payment-locked'));
    }
    return Promise.reject(error);
  },
);

export default apiClient;

