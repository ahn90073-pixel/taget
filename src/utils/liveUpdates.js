import { Capacitor } from '@capacitor/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';

const DEFAULT_MANIFEST_URL =
  'https://github.com/zazotona301-oss/taget/releases/download/ota-latest/ota-manifest.json';
const manifestUrl = import.meta.env.VITE_OTA_MANIFEST_URL || DEFAULT_MANIFEST_URL;

/**
 * Checks GitHub for a new web bundle and reports progress to the UI.
 * Native plugin rolls back automatically if the new bundle fails before ready().
 */
export async function checkForOtaUpdate({ onStatus } = {}) {
  const report = (status, details = {}) => onStatus?.({ status, ...details });

  if (!Capacitor.isNativePlatform()) {
    report('web', { message: 'التحديث الهوائي يعمل داخل نسخة الهاتف' });
    return { available: false, reason: 'web' };
  }

  report('checking', { message: 'جاري البحث عن تحديث جديد...' });
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

  const current = await LiveUpdate.getCurrentBundle();
  if (current.bundleId === manifest.bundleId) {
    report('current', {
      message: 'أنت تستخدم أحدث إصدار من الواجهة',
      bundleId: manifest.bundleId,
      updatedAt: manifest.createdAt,
    });
    return { available: false, bundleId: manifest.bundleId };
  }

  report('downloading', { message: 'تم العثور على تحديث، جاري التحميل...', progress: 0 });
  let progressHandle;
  try {
    progressHandle = await LiveUpdate.addListener('downloadBundleProgress', (event) => {
      report('downloading', {
        message: 'جاري تحميل التحديث الهوائي...',
        progress: Math.round((event.progress || 0) * 100),
      });
    });

    await LiveUpdate.downloadBundle({
      url: manifest.bundleUrl,
      bundleId: manifest.bundleId,
    });
    await LiveUpdate.setNextBundle({ bundleId: manifest.bundleId });
    report('updated', {
      message: 'اكتمل التحديث، سيتم تشغيل الواجهة الجديدة الآن',
      progress: 100,
      bundleId: manifest.bundleId,
    });
    await LiveUpdate.reload();
    return { available: true, bundleId: manifest.bundleId };
  } finally {
    await progressHandle?.remove?.();
  }
}
