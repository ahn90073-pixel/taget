import { Capacitor } from '@capacitor/core';
import { Geolocation } from '@capacitor/geolocation';

function browserPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('هذا الجهاز لا يدعم تحديد الموقع. يمكنك متابعة استخدام التطبيق دون مشاركة موقعك.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, (error) => {
      reject(new Error(error.code === 1
        ? 'لم يتم السماح بالوصول للموقع. يمكنك تفعيل الإذن من إعدادات الجهاز أو المتابعة دون مشاركة موقعك.'
        : 'تعذر تحديد الموقع الآن. تحقق من إعدادات الموقع وحاول مرة أخرى.'));
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

  const position = await Geolocation.getCurrentPosition({
    enableHighAccuracy: permissions.location === 'granted',
    timeout: 20000,
    maximumAge: 60000,
  });
  return { latitude: position.coords.latitude, longitude: position.coords.longitude };
}
