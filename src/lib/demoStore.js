const DB_NAME = 'taget-local-demo-store';
const DB_VERSION = 1;
const PRODUCT_STORE = 'products';

let databasePromise;

function openDatabase() {
  if (databasePromise) return databasePromise;
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('التخزين المحلي غير متاح على هذا الجهاز.'));
  }

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PRODUCT_STORE)) {
        const store = database.createObjectStore(PRODUCT_STORE, { keyPath: 'id' });
        store.createIndex('userId', 'userId', { unique: false });
      }
    };
    request.onsuccess = () => {
      const database = request.result;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () => {
      databasePromise = null;
      reject(request.error || new Error('تعذر فتح التخزين المحلي للمتجر التجريبي.'));
    };
    request.onblocked = () => {
      databasePromise = null;
      reject(new Error('أغلق نسخة التطبيق الأخرى ثم أعد المحاولة.'));
    };
  });
  return databasePromise;
}

function runRequest(storeName, mode, createRequest) {
  return openDatabase().then((database) => new Promise((resolve, reject) => {
    const transaction = database.transaction(storeName, mode);
    const request = createRequest(transaction.objectStore(storeName));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('تعذر حفظ بيانات المتجر التجريبي.'));
    transaction.onabort = () => reject(transaction.error || new Error('تعذر إتمام عملية التخزين المحلي.'));
  }));
}

export async function listDemoProducts(userId) {
  if (!userId) return [];
  const products = await runRequest(PRODUCT_STORE, 'readonly', (store) => store.index('userId').getAll(String(userId)));
  return products.sort((a, b) => String(b.createdAt || '').localeCompare(String(a.createdAt || '')));
}

export async function saveDemoProduct(userId, product) {
  if (!userId) throw new Error('تعذر تحديد حساب التاجر لهذا المتجر التجريبي.');
  const saved = {
    ...product,
    id: product.id || crypto.randomUUID(),
    userId: String(userId),
    updatedAt: new Date().toISOString(),
  };
  await runRequest(PRODUCT_STORE, 'readwrite', (store) => store.put(saved));
  return saved;
}

export async function deleteDemoProduct(userId, productId) {
  if (!userId || !productId) return;
  const existing = await runRequest(PRODUCT_STORE, 'readonly', (store) => store.get(String(productId)));
  if (!existing || existing.userId !== String(userId)) return;
  await runRequest(PRODUCT_STORE, 'readwrite', (store) => store.delete(String(productId)));
}
