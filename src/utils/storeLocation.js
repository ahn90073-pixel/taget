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
  if (message.includes('timeout') || message.includes('unavailable') || message.includes('obtain location in time')) {
    return 'استغرق تحديد الموقع وقتًا أطول من المتاح. تم توسيع المهلة وإضافة محاولة بدقة أقل؛ جرّب مرة أخرى قرب نافذة أو خارج المبنى مع إبقاء خدمة الموقع والإنترنت مفعّلين.';
  }
  return 'تعذر تحديد الموقع الآن. تحقق من تشغيل خدمة الموقع وإذن التطبيق من إعدادات الهاتف، ثم حاول مرة أخرى.';
}

function browserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('هذا الجهاز لا يدعم تحديد الموقع. يمكنك متابعة استخدام التطبيق دون مشاركة موقعك.'));
      return;
    }
    const options = { enableHighAccuracy: true, timeout: 45000, maximumAge: 120000 };
    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      if (error.code === 1) {
        reject(new Error('لم يتم السماح بالوصول للموقع. فعّل إذن الموقع لتطبيق التاجر من إعدادات التطبيقات، ثم حاول مرة أخرى.'));
        return;
      }
      navigator.geolocation.getCurrentPosition(resolve, (retryError) => {
        reject(new Error(explainLocationError(retryError.message || error.message)));
      }, { ...options, enableHighAccuracy: false, timeout: 30000 });
    }, options);
  });
}

async function nativePosition(options) {
  try {
    return await Geolocation.getCurrentPosition(options);
  } catch (error) {
    const message = String(error?.message || error || '').toLowerCase();
    if (message.includes('permission') || message.includes('denied')) throw error;
    return Geolocation.getCurrentPosition({
      enableHighAccuracy: false,
      timeout: 30000,
      maximumAge: 120000,
    });
  }
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
    position = await nativePosition({
      enableHighAccuracy: permissions.location === 'granted',
      timeout: 45000,
      maximumAge: 120000,
    });
  } catch (error) {
    throw new Error(explainLocationError(error));
  }
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}
