import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite, SQLiteConnection } from '@capacitor-community/sqlite';

const DATABASE_NAME = 'taget_merchant_data';
const CACHE_PREFIX = 'taget:api-cache:';
let databasePromise;

function isAndroidApp() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

async function getDatabase() {
  if (!isAndroidApp()) return null;
  if (!databasePromise) {
    databasePromise = (async () => {
      const sqlite = new SQLiteConnection(CapacitorSQLite);
      const existing = await sqlite.isConnection(DATABASE_NAME, false);
      const db = existing.result
        ? await sqlite.retrieveConnection(DATABASE_NAME, false)
        : await sqlite.createConnection(DATABASE_NAME, false, 'no-encryption', 1, false);
      const open = await db.isDBOpen();
      if (!open.result) await db.open();
      await db.execute(`CREATE TABLE IF NOT EXISTS merchant_api_cache (
        cache_key TEXT PRIMARY KEY NOT NULL,
        payload TEXT NOT NULL,
        updated_at TEXT NOT NULL
      )`);
      return db;
    })().catch((error) => {
      databasePromise = undefined;
      throw error;
    });
  }
  return databasePromise;
}

function webStorageRead(key) {
  try {
    if (typeof localStorage === 'undefined') return undefined;
    const value = localStorage.getItem(`${CACHE_PREFIX}${key}`);
    return value === null ? undefined : JSON.parse(value);
  } catch {
    return undefined;
  }
}

function webStorageWrite(key, value) {
  try {
    if (typeof localStorage === 'undefined') return false;
    localStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export async function initializeMerchantCache() {
  try {
    return Boolean(await getDatabase());
  } catch (error) {
    console.warn('[MerchantCache] SQLite initialization failed; persistent fallback will be used.', error);
    return false;
  }
}

export async function readMerchantCache(key) {
  try {
    const db = await getDatabase();
    if (db) {
      const result = await db.query('SELECT payload FROM merchant_api_cache WHERE cache_key = ? LIMIT 1', [key]);
      if (result.values?.length) return JSON.parse(result.values[0].payload);
    }
  } catch (error) {
    console.warn('[MerchantCache] SQLite read failed; trying platform storage.', error);
  }
  return webStorageRead(key);
}

export async function writeMerchantCache(key, value) {
  const payload = JSON.stringify(value);
  if (payload === undefined) return false;
  try {
    const db = await getDatabase();
    if (db) {
      await db.run(
        'INSERT OR REPLACE INTO merchant_api_cache (cache_key, payload, updated_at) VALUES (?, ?, ?)',
        [key, payload, new Date().toISOString()],
        false,
      );
      return true;
    }
  } catch (error) {
    console.warn('[MerchantCache] SQLite write failed; using platform storage.', error);
  }
  return webStorageWrite(key, value);
}

export async function removeMerchantCache(key) {
  try {
    const db = await getDatabase();
    if (db) await db.run('DELETE FROM merchant_api_cache WHERE cache_key = ?', [key], false);
  } catch (error) {
    console.warn('[MerchantCache] SQLite delete failed.', error);
  }
  try {
    if (typeof localStorage !== 'undefined') localStorage.removeItem(`${CACHE_PREFIX}${key}`);
  } catch {
    // The native cache remains the source of truth on Android.
  }
}
