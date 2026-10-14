import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

const TOKEN_KEY = 'taget_fcm_token';
let initializationPromise = null;

/**
 * يفعّل إشعارات Firebase على Android/iOS عند توفر إعدادات المنصة.
 * على الويب لا ينفذ أي طلب صلاحيات.
 */
export async function initializePushNotifications() {
  if (!Capacitor.isNativePlatform()) {
    return { enabled: false, reason: 'web' };
  }

  if (initializationPromise) return initializationPromise;

  initializationPromise = (async () => {
    const listeners = [];
    try {
      listeners.push(await PushNotifications.addListener('registration', token => {
        localStorage.setItem(TOKEN_KEY, token.value);
        window.dispatchEvent(new CustomEvent('fcm-token-ready', { detail: token.value }));
        console.info('Firebase notification token registered');
      }));

      listeners.push(await PushNotifications.addListener('registrationError', error => {
        console.warn('Firebase notification registration error', error);
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
      return { enabled: true, permission: permissions.receive, token: getStoredFcmToken() };
    } catch (error) {
      console.warn('Firebase notifications are unavailable', error);
      for (const listener of listeners) await listener.remove().catch(() => {});
      throw error;
    }
  })();

  try {
    const result = await initializationPromise;
    if (!result.enabled) initializationPromise = null;
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
