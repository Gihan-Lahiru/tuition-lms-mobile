import apiClient from './apiClient';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const pushNotificationService = {
  isSupported() {
    return (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window &&
      'Notification' in window
    );
  },

  getPermission() {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission; // 'default' | 'granted' | 'denied'
  },

  async getVapidPublicKey() {
    const envKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
    if (envKey) return envKey;

    try {
      const res = await apiClient.get('/notifications/vapid-key');
      return res.data?.publicKey || null;
    } catch {
      return null;
    }
  },

  async getExistingSubscription() {
    if (!this.isSupported()) return null;
    try {
      const reg = await navigator.serviceWorker.ready;
      return await reg.pushManager.getSubscription();
    } catch {
      return null;
    }
  },

  async subscribe() {
    if (!this.isSupported()) {
      throw new Error('Push notifications are not supported on this browser/device.');
    }

    // 1. Request user permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error('Notification permission was not granted by user.');
    }

    // 2. Fetch VAPID public key
    const publicKey = await this.getVapidPublicKey();
    if (!publicKey) {
      throw new Error('VAPID public key not found on server.');
    }

    // 3. Register push subscription with browser
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(publicKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
    }

    // 4. Send subscription to LMS backend
    const subJson = subscription.toJSON();
    await apiClient.post('/notifications/subscribe', {
      endpoint: subJson.endpoint,
      keys: {
        p256dh: subJson.keys?.p256dh,
        auth: subJson.keys?.auth,
      },
    });

    return subscription;
  },

  async unsubscribe() {
    if (!this.isSupported()) return false;
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        const endpoint = subscription.endpoint;
        await subscription.unsubscribe();
        try {
          await apiClient.post('/notifications/unsubscribe', { endpoint });
        } catch {}
      }
      return true;
    } catch {
      return false;
    }
  },

  async sendTestPush() {
    const res = await apiClient.post('/notifications/test-push');
    return res.data;
  },

  async broadcast({ title, message, grade, type, url }) {
    const res = await apiClient.post('/notifications/broadcast', {
      title,
      message,
      grade,
      type,
      url,
    });
    return res.data;
  },

  async sendDirect({ studentId, title, message, type, url }) {
    const res = await apiClient.post('/notifications/send-direct', {
      studentId,
      title,
      message,
      type,
      url,
    });
    return res.data;
  },
};

export default pushNotificationService;
