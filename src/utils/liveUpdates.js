import { Capacitor } from '@capacitor/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';

const DEFAULT_MANIFEST_URL =
  'https://github.com/zazotona301-oss/taget/releases/download/ota-latest/ota-manifest.json';
const manifestUrl = import.meta.env.VITE_OTA_MANIFEST_URL || DEFAULT_MANIFEST_URL;
const nativeAppVersion = import.meta.env.VITE_NATIVE_APP_VERSION || '1.1.0';

/** Checks GitHub for a compatible web bundle and reports progress to the UI. */
export async function checkForOtaUpdate({ onStatus } = {}) {
  const report = (status, details = {}) => onStatus?.({ status, ...details });

  if (!Capacitor.isNativePlatform()) {
    report('web', {
      message: 'التحديث الهوائي يعمل داخل تطبيق الهاتف',
      nativeVersion: nativeAppVersion,
    });
    return { available: false, reason: 'web', nativeVersion: nativeAppVersion };
  }

  report('checking', {
    message: 'جاري البحث عن آخر إصدار متوافق...',
    nativeVersion: nativeAppVersion,
  });
  await LiveUpdate.ready();

  const response = await fetch(`${manifestUrl}?t=${Date.now()}`, {
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) throw new Error(`OTA manifest request failed: ${response.status}`);

  const manifest = await response.json();
  if (!manifest.bundleId || !manifest.bundleUrl) {
    throw new Error('OTA manifest is missing bundleId or bundleUrl');
  }

  const versionInfo = {
    nativeVersion: nativeAppVersion,
    requiredNativeVersion: manifest.nativeVersion || nativeAppVersion,
    bundleVersion: manifest.bundleVersion || manifest.version || manifest.bundleId,
  };

  if (versionInfo.requiredNativeVersion !== nativeAppVersion) {
    report('native-required', {
      message: `هذا التحديث يحتاج نسخة تطبيق ${versionInfo.requiredNativeVersion}`,
      ...versionInfo,
    });
    return { available: false, reason: 'native-required', ...versionInfo };
  }

  const current = await LiveUpdate.getCurrentBundle();
  if (current.bundleId === manifest.bundleId) {
    report('current', {
      message: 'أنت تستخدم أحدث إصدار من الواجهة',
      bundleId: manifest.bundleId,
      updatedAt: manifest.createdAt,
      ...versionInfo,
    });
    return { available: false, bundleId: manifest.bundleId, ...versionInfo };
  }

  report('downloading', {
    message: 'تم العثور على تحديث متوافق، جاري التحميل...',
    progress: 0,
    ...versionInfo,
  });
  let progressHandle;
  try {
    progressHandle = await LiveUpdate.addListener('downloadBundleProgress', (event) => {
      report('downloading', {
        message: 'جاري تحميل التحديث الهوائي...',
        progress: Math.round((event.progress || 0) * 100),
        ...versionInfo,
      });
    });

    await LiveUpdate.downloadBundle({ url: manifest.bundleUrl, bundleId: manifest.bundleId });
    await LiveUpdate.setNextBundle({ bundleId: manifest.bundleId });
    report('updated', {
      message: 'اكتمل التحديث، سيتم تشغيل الواجهة الجديدة الآن',
      progress: 100,
      bundleId: manifest.bundleId,
      ...versionInfo,
    });
    await LiveUpdate.reload();
    return { available: true, bundleId: manifest.bundleId, ...versionInfo };
  } finally {
    await progressHandle?.remove?.();
  }
}
