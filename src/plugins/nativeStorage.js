import { registerPlugin } from '@capacitor/core';

/**
 * NativeStorage is implemented in Kotlin on Android and Swift on iOS.
 * The web implementation keeps local development and the existing web app working.
 */
export const NativeStorage = registerPlugin('NativeStorage', {
  web: () => import('./nativeStorageWeb.js').then((module) => new module.NativeStorageWeb()),
});

export async function recordAppLaunch() {
  const value = new Date().toISOString();
  await NativeStorage.set({ key: 'lastLaunchAt', value });
  return NativeStorage.get({ key: 'lastLaunchAt' });
}
