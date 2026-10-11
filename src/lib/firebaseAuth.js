import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

export function isAndroidNative() {
  return Capacitor.getPlatform() === 'android';
}

export function isGoogleNativeAuthAvailable() {
  return isAndroidNative() && Capacitor.isPluginAvailable('FirebaseAuthentication');
}

export async function signInWithGoogle() {
  if (!isAndroidNative()) {
    throw new Error('تسجيل الدخول باستخدام Google متاح في تطبيق Android فقط.');
  }
  if (!Capacitor.isPluginAvailable('FirebaseAuthentication')) {
    throw new Error('حدّث تطبيق Android إلى أحدث إصدار لتسجيل الدخول باستخدام Google.');
  }

  await FirebaseAuthentication.signInWithGoogle();
  const { token } = await FirebaseAuthentication.getIdToken({ forceRefresh: true });
  if (!token) throw new Error('تعذر استرجاع رمز Firebase. أعد تسجيل الدخول وحاول مرة أخرى.');
  return token;
}

export async function signOutGoogle() {
  if (isAndroidNative() && Capacitor.isPluginAvailable('FirebaseAuthentication')) {
    await FirebaseAuthentication.signOut();
  }
}
