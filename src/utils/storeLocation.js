import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

function explainLocationError(error) {
  const message = String(error?.message || error || '').toLowerCase();
  if (message.includes('location services are not enabled')
    || message.includes('location services disabled')
    || message.includes('location is disabled')) {
    return 'خدمة الموقع في الهاتف مغلقة. فعّل «الموقع» من لوحة الإعدادات السريعة أو من إعدادات الهاتف > الموقع، ثم اضغط «تحديث الموقع» مرة أخرى.';
  }
  if (message.includes('permission') || message.includes('denied')) {
    return 'لم يتم السماح بالوصول للموقع. فعّل إذن الموقع لتطبيق التاجر من إعدادات التطبيقات، ثم حاول مرة أخرى.';
  }
  if (message.includes('timeout') || message.includes('unavailable')) {
    return 'تعذر تحديد موقع الهاتف الآن. تأكد من تشغيل خدمة الموقع وأنك في مكان يمكن استقبال الإشارة فيه، ثم حاول مرة أخرى.';
  }
  return 'تعذر تحديد الموقع الآن. تحقق من تشغيل خدمة الموقع وإذن التطبيق من إعدادات الهاتف، ثم حاول مرة أخرى.';
}

function browserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('هذا الجهاز لا يدعم تحديد الموقع. يمكنك متابعة استخدام التطبيق دون مشاركة موقعك.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      reject(new Error(error.code === 1
        ? 'لم يتم السماح بالوصول للموقع. فعّل إذن الموقع لتطبيق التاجر من إعدادات التطبيقات، ثم حاول مرة أخرى.'
        : explainLocationError(error.message)));
    }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 60000 });
  });
}

export async function getStoreLocation() {
  if (!Capacitor.isNativePlatform()) {
    const position = await browserPosition();
    return { latitude: position.coords.latitude, longitude: position.coords.longitude };
  }

  if (!Capacitor.isPluginAvailable('Geolocation')) {
    throw new Error('لتفعيل إذن الموقع، ثبّت تحديث تطبيق التاجر الذي يدعم إذن الموقع. لا تحتاج إلى إنشاء حساب جديد.');
  }

  let permissions = await Geolocation.checkPermissions();
  if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
    permissions = await Geolocation.requestPermissions({ permissions: ['location'] });
  }
  if (permissions.location !== 'granted' && permissions.coarseLocation !== 'granted') {
    throw new Error('لم يتم السماح بالوصول للموقع. يمكنك تفعيل الإذن من إعدادات الجهاز أو المتابعة دون مشاركة موقعك.');
  }

  let position;
  try {
    position = await Geolocation.getCurrentPosition({
      enableHighAccuracy: permissions.location === 'granted',
      timeout: 20000,
      maximumAge: 60000,
    });
  } catch (error) {
    throw new Error(explainLocationError(error));
  }
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}
