import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const TOKEN_KEY = 'taget_fcm_token';
let initializationPromise = null;

/**
 * يفعّل إشعارات Firebase على Android/iOS عند توفر إعدادات المنصة.
 * على الويب لا ينفذ أي طلب صلاحيات.
 */
export async function initializePushNotifications({ onToken } = {}) {
  if (!Capacitor.isNativePlatform()) {
    return { enabled: false, reason: 'web' };
  }

  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    const listeners = [];
    try {
      let resolveToken;
      let rejectToken;
      const tokenReady = new Promise((resolve, reject) => {
        resolveToken = resolve;
        rejectToken = reject;
      });
      listeners.push(await PushNotifications.addListener('registration', async token => {
        try { localStorage.setItem(TOKEN_KEY, token.value); } catch { /* The server write is authoritative. */ }
        window.dispatchEvent(new CustomEvent('fcm-token-ready', { detail: token.value }));
        console.info('Firebase notification token registered');
        try {
          await onToken?.(token.value);
          resolveToken(token.value);
        } catch (error) {
          rejectToken(error);
        }
      }));

      listeners.push(await PushNotifications.addListener('registrationError', error => {
        console.warn('Firebase notification registration error', error);
        rejectToken(new Error('تعذّر الحصول على رمز إشعارات الجهاز.'));
      }));

      listeners.push(await PushNotifications.addListener('pushNotificationReceived', notification => {
        window.dispatchEvent(new CustomEvent('fcm-notification-received', { detail: notification }));
      }));

      listeners.push(await PushNotifications.addListener('pushNotificationActionPerformed', action => {
        window.dispatchEvent(new CustomEvent('fcm-notification-action', { detail: action }));
      }));

      let permissions = await PushNotifications.checkPermissions();
      if (permissions.receive === 'prompt') {
        permissions = await PushNotifications.requestPermissions();
      }
      if (permissions.receive !== 'granted') {
        for (const listener of listeners) await listener.remove().catch(() => {});
        return { enabled: false, reason: 'permission-denied' };
      }

      await PushNotifications.register();
      let timeoutId;
      try {
        const token = await Promise.race([
          tokenReady,
          new Promise((_, reject) => {
            timeoutId = window.setTimeout(() => reject(new Error('انتهت مهلة تسجيل رمز الإشعارات.')), 20000);
          }),
        ]);
        return { enabled: true, permission: permissions.receive, token };
      } finally {
        window.clearTimeout(timeoutId);
      }
    } catch (error) {
      console.warn('Firebase notifications are unavailable', error);
      for (const listener of listeners) await listener.remove().catch(() => {});
      throw error;
    }
  })();

  try {
    const result = await initializationPromise;
    initializationPromise = null;
    return result;
  } catch (error) {
    initializationPromise = null;
    return { enabled: false, reason: 'registration-failed', error };
  }
}

export function getStoredFcmToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}
