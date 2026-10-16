import { Capacitor } from '@capacitor/core';
import { NativeStorage } from '@/plugins/nativeStorage';
import { readMerchantCache, writeMerchantCache } from '@/lib/merchantLocalCache';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://tagerbackend.ahn90073.workers.dev').replace(/\/$/, '');
const TOKEN_KEY = 'taget_api_token';
const REFRESH_TOKEN_KEY = 'taget_refresh_token';
const COMPANY_KEY = 'taget_company';
const USER_KEY = 'taget_user';
const DEMO_USER_KEY = 'taget_demo_user';
const SESSION_KEYS = [TOKEN_KEY, REFRESH_TOKEN_KEY, COMPANY_KEY, USER_KEY, DEMO_USER_KEY];
const session = { token: null, refreshToken: null, company: null, user: null, demoUser: null };
let sessionInitialization;

function isAndroidApp() {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
}

function parseStoredJson(value) {
  try { return value ? JSON.parse(value) : null; } catch { return null; }
}

async function readPersistentValue(key) {
  if (isAndroidApp()) {
    try {
      const result = await NativeStorage.get({ key });
      if (result?.value != null) return result.value;
    } catch (error) {
      console.warn('[Session] Native storage read failed; trying existing browser storage.', error);
    }
  }
  try {
    const value = localStorage.getItem(key);
    if (value != null && isAndroidApp()) await NativeStorage.set({ key, value });
    return value;
  } catch {
    return null;
  }
}

async function writePersistentValue(key, value) {
  const encoded = value == null ? null : (typeof value === 'string' ? value : JSON.stringify(value));
  if (isAndroidApp()) {
    try {
      if (encoded == null) await NativeStorage.remove({ key });
      else await NativeStorage.set({ key, value: encoded });
    } catch (error) {
      console.warn('[Session] Native storage write failed; retaining browser fallback.', error);
    }
  }
  try {
    if (encoded == null) localStorage.removeItem(key);
    else localStorage.setItem(key, encoded);
  } catch {
    // Android's app-private storage remains authoritative if browser storage is unavailable.
  }
}

export const sessionStore = {
  initialize: () => {
    if (!sessionInitialization) {
      sessionInitialization = (async () => {
        const [token, refreshToken, company, user, demoUser] = await Promise.all(SESSION_KEYS.map(readPersistentValue));
        session.token = token || null;
        session.refreshToken = refreshToken || null;
        session.company = parseStoredJson(company);
        session.user = parseStoredJson(user);
        session.demoUser = parseStoredJson(demoUser);
        return true;
      })().catch((error) => {
        sessionInitialization = null;
        console.warn('[Session] Initialization failed; the app will use available local state.', error);
        return false;
      });
    }
    return sessionInitialization;
  },
  getToken: () => session.token,
  setToken: (token) => { session.token = token || null; return writePersistentValue(TOKEN_KEY, session.token); },
  getRefreshToken: () => session.refreshToken,
  setRefreshToken: (token) => { session.refreshToken = token || null; return writePersistentValue(REFRESH_TOKEN_KEY, session.refreshToken); },
  getCompany: () => session.company,
  setCompany: (company) => { session.company = company || null; return writePersistentValue(COMPANY_KEY, session.company); },
  clearCompany: () => { session.company = null; return writePersistentValue(COMPANY_KEY, null); },
  getUser: () => session.user,
  setUser: (user) => { session.user = user || null; return writePersistentValue(USER_KEY, session.user); },
  getDemoUser: () => session.demoUser,
  setDemoUser: (user) => { session.demoUser = user || null; return writePersistentValue(DEMO_USER_KEY, session.demoUser); },
  clearDemoUser: () => { session.demoUser = null; return writePersistentValue(DEMO_USER_KEY, null); },
  clear: async () => {
    session.token = null;
    session.refreshToken = null;
    session.company = null;
    session.user = null;
    session.demoUser = null;
    await Promise.all(SESSION_KEYS.map((key) => writePersistentValue(key, null)));
  },
};

let refreshInFlight;

function apiCacheKey(path) {
  const account = sessionStore.getUser()?.id || sessionStore.getCompany()?.id || 'unscoped';
  return `${encodeURIComponent(account)}:${path}`;
}

function shouldCacheApiRead(method, path) {
  return method === 'GET' && path.startsWith('/api/') && !path.includes('/documents/');
}

async function refreshAccessToken() {
  const refreshToken = sessionStore.getRefreshToken();
  if (!refreshToken) return null;
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        signal: controller.signal,
      });
      const payload = await response.json().catch(() => ({}));
      if (!response.ok || payload.success === false) return null;
      const data = payload.data ?? payload;
      if (!data.token || !data.refreshToken) return null;
      await Promise.all([
        sessionStore.setToken(data.token),
        sessionStore.setRefreshToken(data.refreshToken),
        data.user ? sessionStore.setUser(data.user) : Promise.resolve(),
      ]);
      return data.token;
    } catch {
      return null;
    } finally {
      clearTimeout(timeout);
    }
  })().finally(() => { refreshInFlight = null; });
  return refreshInFlight;
}

export async function apiRequest(path, options = {}) {
  const { method = 'GET', body, token = sessionStore.getToken(), _retried = false } = options;
  const requestMethod = method.toUpperCase();
  const cacheable = shouldCacheApiRead(requestMethod, path);
  const cacheKey = cacheable ? apiCacheKey(path) : null;
  let cached;
  if (cacheable) {
    try { cached = await readMerchantCache(cacheKey); } catch { cached = undefined; }
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), requestMethod === 'GET' ? 8000 : 30000);
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  let response;
  let payload;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined || isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: isFormData ? body : JSON.stringify(body) }),
      signal: controller.signal,
    });
    payload = await response.json().catch(() => ({}));
  } catch (requestError) {
    if (cacheable && cached !== undefined) return cached;
    const error = new Error(requestError?.name === 'AbortError'
      ? 'انتهت مهلة الطلب. تحقق من اتصال الإنترنت وحاول مرة أخرى.'
      : 'تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.');
    error.cause = requestError;
    throw error;
  } finally {
    clearTimeout(timeout);
  }

  if (response.status === 401 && token && !_retried && path !== '/api/auth/refresh') {
    const refreshedToken = await refreshAccessToken();
    if (refreshedToken) return apiRequest(path, { ...options, token: refreshedToken, _retried: true });
  }

  if (!response.ok || payload.success === false) {
    if (cacheable && cached !== undefined && (response.status === 401 || response.status >= 500)) return cached;
    const message = response.status === 401
      ? 'لم يقبل الخادم رمز الجلسة. احتفظنا بتسجيل الدخول والبيانات المحلية؛ أعد الاتصال أو سجّل الدخول لإجراء التعديلات.'
      : (payload.message || `حدث خطأ في الاتصال (${response.status})`);
    const fields = payload.errors?.map?.((item) => item.message).filter(Boolean).join('، ');
    const error = new Error(fields ? `${message}: ${fields}` : message);
    error.status = response.status;
    error.code = payload.code || null;
    throw error;
  }

  const data = payload.data ?? payload;
  if (cacheable) {
    try { await writeMerchantCache(cacheKey, data); } catch (error) { console.warn('[MerchantCache] Could not persist API response.', error); }
  }
  if (path === '/api/auth/me' && data?.id) await sessionStore.setUser(data);
  return data;
}

async function setCachedResponse(path, data) {
  try { await writeMerchantCache(apiCacheKey(path), data); } catch (error) { console.warn('[MerchantCache] Could not update local API data.', error); }
}

async function updateCachedResponse(path, transform) {
  const key = apiCacheKey(path);
  try {
    const current = await readMerchantCache(key);
    if (current !== undefined) await writeMerchantCache(key, transform(current));
  } catch (error) {
    console.warn('[MerchantCache] Could not update local API data.', error);
  }
}

async function updateCachedProductList(companyId, operation, productId, product) {
  if (operation !== 'delete' && !product) return;
  const path = `/api/companies/${encodeURIComponent(companyId)}/products?limit=100`;
  const key = apiCacheKey(path);
  try {
    const cached = await readMerchantCache(key);
    if (cached === undefined) {
      if (operation === 'create' && product) await writeMerchantCache(key, { items: [product] });
      return;
    }
    const items = Array.isArray(cached?.items) ? cached.items : [];
    const nextItems = operation === 'delete'
      ? items.filter((item) => item.id !== productId)
      : [product, ...items.filter((item) => item.id !== product?.id && item.id !== productId)];
    await writeMerchantCache(key, { ...cached, items: nextItems.slice(0, 100) });
  } catch (error) {
    console.warn('[MerchantCache] Could not update cached products.', error);
  }
}

export const authApi = {
  register: (data) => apiRequest('/api/auth/register', { method: 'POST', body: data, token: null }),
  login: (data) => apiRequest('/api/auth/login', { method: 'POST', body: data, token: null }),
  google: (data) => apiRequest('/api/auth/google', { method: 'POST', body: data, token: null }),
  me: () => apiRequest('/api/auth/me'),
  createRefreshToken: () => apiRequest('/api/auth/refresh-token', { method: 'POST', body: {} }),
  logout: (refreshToken) => apiRequest('/api/auth/logout', { method: 'POST', body: { refreshToken }, token: null }),
  companies: () => apiRequest('/api/companies'),
  storeRequest: () => apiRequest('/api/merchant/store-requests/me'),
  submitStoreRequest: async (data) => {
    const result = await apiRequest('/api/merchant/store-requests', { method: 'POST', body: data });
    await setCachedResponse('/api/merchant/store-requests/me', result);
    return result;
  },
  saveStoreRequestProfile: async (data) => {
    const result = await apiRequest('/api/merchant/store-requests/me/profile', { method: 'PUT', body: data });
    await setCachedResponse('/api/merchant/store-requests/me', result);
    return result;
  },
  uploadStoreRequestDocument: async (documentType, file) => {
    const form = new FormData();
    form.append('file', file, file.name);
    const result = await apiRequest(`/api/merchant/store-requests/me/documents/${encodeURIComponent(documentType)}`, { method: 'POST', body: form });
    await setCachedResponse('/api/merchant/store-requests/me', result);
    return result;
  },
  finalizeStoreRequest: async () => {
    const result = await apiRequest('/api/merchant/store-requests/me/submit', { method: 'POST', body: {} });
    await setCachedResponse('/api/merchant/store-requests/me', result);
    return result;
  },
  setCompanyGovernorate: (companyId, governorate) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/governorate`, { method: 'PATCH', body: { governorate } }),
};

export const companyProfileApi = {
  get: (companyId) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/profile`),
  save: async (companyId, data) => {
    const path = `/api/companies/${encodeURIComponent(companyId)}/profile`;
    const result = await apiRequest(path, { method: 'PUT', body: data });
    await setCachedResponse(path, result);
    return result;
  },
  uploadDocument: (companyId, documentType, file) => {
    const form = new FormData();
    form.append('file', file);
    return apiRequest(`/api/companies/${encodeURIComponent(companyId)}/profile/documents/${encodeURIComponent(documentType)}`, { method: 'POST', body: form });
  },
  downloadDocument: async (companyId, documentType) => {
    const response = await fetch(`${API_BASE_URL}/api/companies/${encodeURIComponent(companyId)}/profile/documents/${encodeURIComponent(documentType)}`, {
      headers: { Authorization: `Bearer ${sessionStore.getToken() || ''}` },
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || 'تعذر تنزيل المستند.');
    }
    return response.blob();
  },
};

export const notificationsApi = {
  registerToken: (companyId, data) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/notifications/token`, { method: 'POST', body: data }),
};

export const productsApi = {
  list: (companyId) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/products?limit=100`),
  create: async (companyId, data) => {
    const product = await apiRequest(`/api/companies/${encodeURIComponent(companyId)}/products`, { method: 'POST', body: data });
    await updateCachedProductList(companyId, 'create', product?.id, product);
    return product;
  },
  createWithImages: async (companyId, data, files) => {
    const form = new FormData();
    form.append('product', JSON.stringify(data));
    files.forEach((file) => form.append('images', file, file.name));
    const product = await apiRequest(`/api/companies/${encodeURIComponent(companyId)}/products`, { method: 'POST', body: form });
    await updateCachedProductList(companyId, 'create', product?.id, product);
    return product;
  },
  update: async (companyId, productId, data) => {
    const product = await apiRequest(`/api/companies/${encodeURIComponent(companyId)}/products/${encodeURIComponent(productId)}`, { method: 'PUT', body: data });
    await updateCachedProductList(companyId, 'update', productId, product);
    return product;
  },
  updateWithImages: async (companyId, productId, data, files) => {
    const form = new FormData();
    form.append('product', JSON.stringify(data));
    files.forEach((file) => form.append('images', file, file.name));
    const product = await apiRequest(`/api/companies/${encodeURIComponent(companyId)}/products/${encodeURIComponent(productId)}`, { method: 'PUT', body: form });
    await updateCachedProductList(companyId, 'update', productId, product);
    return product;
  },
  remove: async (companyId, productId) => {
    const result = await apiRequest(`/api/companies/${encodeURIComponent(companyId)}/products/${encodeURIComponent(productId)}`, { method: 'DELETE' });
    await updateCachedProductList(companyId, 'delete', productId);
    return result;
  },
};

export const ordersApi = {
  list: (companyId, { page = 1, limit = 50, status = '' } = {}) => apiRequest(
    `/api/companies/${encodeURIComponent(companyId)}/orders?page=${page}&limit=${limit}${status ? `&status=${encodeURIComponent(status)}` : ''}`,
  ),
  reportPrepared: async (companyId, orderId) => {
    const result = await apiRequest(
      `/api/companies/${encodeURIComponent(companyId)}/orders/${encodeURIComponent(orderId)}/activate-shipping`,
      { method: 'POST', body: {} },
    );
    const listPath = `/api/companies/${encodeURIComponent(companyId)}/orders?page=1&limit=50`;
    await updateCachedResponse(listPath, (cached) => ({
      ...cached,
      items: (Array.isArray(cached?.items) ? cached.items : []).map((item) => item.id === orderId ? {
        ...item,
        shipping_request_status: result.status || 'pending',
        shipping_requested_at: result.requestedAt || item.shipping_requested_at,
      } : item),
    }));
    return result;
  },
};

export const walletApi = {
  get: (companyId) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/wallet`),
};

export function mapBackendProduct(product) {
  const images = Array.isArray(product.images)
    ? product.images.map((image, index) => typeof image === 'string'
      ? { url: image, sortOrder: index }
      : { ...image, url: image.url || image.image_url || '' }).filter((image) => image.url)
    : [];
  return {
    id: product.id,
    sku: product.sku,
    name: product.name || '',
    category: product.category?.name || product.category_name || product.metadata?.categoryLabel || '',
    price: product.price == null ? null : Number(product.price),
    stock: product.stock_quantity == null && product.stock == null ? null : Number(product.stock_quantity ?? product.stock),
    weight: product.weight_grams == null ? null : Number(product.weight_grams) / 1000,
    images,
    image: images[0]?.url || product.image_url || product.metadata?.image || '',
    status: product.status || '',
    rejectionReason: product.rejection_reason || product.rejectionReason || '',
  };
}

export { API_BASE_URL };
