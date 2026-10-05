import { Capacitor } from '@capacitor/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';

const DEFAULT_MANIFEST_URL =
  'https://github.com/zazotona301-oss/taget/releases/download/ota-latest/ota-manifest.json';
const manifestUrl = import.meta.env.VITE_OTA_MANIFEST_URL || DEFAULT_MANIFEST_URL;

/**
 * Marks the current bundle as healthy and downloads a newer signed bundle when
 * GitHub publishes one. The native plugin rolls back automatically if the new
 * bundle fails before ready() is called.
 */
export async function checkForOtaUpdate() {
  if (!Capacitor.isNativePlatform()) return { available: false, reason: 'web' };

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
    return { available: false, bundleId: manifest.bundleId };
  }

  await LiveUpdate.downloadBundle({
    url: manifest.bundleUrl,
    bundleId: manifest.bundleId,
  });
  await LiveUpdate.setNextBundle({ bundleId: manifest.bundleId });
  await LiveUpdate.reload();
  return { available: true, bundleId: manifest.bundleId };
}
