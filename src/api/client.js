const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://tagerbackend.ahn90073.workers.dev').replace(/\/$/, '');
const TOKEN_KEY = 'taget_api_token';
const COMPANY_KEY = 'taget_company';
const DEMO_USER_KEY = 'taget_demo_user';

export const sessionStore = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  getCompany: () => {
    try { return JSON.parse(localStorage.getItem(COMPANY_KEY) || 'null'); } catch { return null; }
  },
  setCompany: (company) => localStorage.setItem(COMPANY_KEY, JSON.stringify(company)),
  clearCompany: () => localStorage.removeItem(COMPANY_KEY),
  getDemoUser: () => {
    try { return JSON.parse(localStorage.getItem(DEMO_USER_KEY) || 'null'); } catch { return null; }
  },
  setDemoUser: (user) => localStorage.setItem(DEMO_USER_KEY, JSON.stringify(user)),
  clearDemoUser: () => localStorage.removeItem(DEMO_USER_KEY),
  clear: () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(COMPANY_KEY); localStorage.removeItem(DEMO_USER_KEY); },
};

export async function apiRequest(path, { method = 'GET', body, token = sessionStore.getToken() } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
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
  } catch (error) {
    if (error?.name === 'AbortError') {
      throw new Error('انتهت مهلة الطلب. تحقق من اتصال الإنترنت وحاول مرة أخرى.');
    }
    throw new Error('تعذر الاتصال بالخادم. تحقق من الإنترنت وحاول مرة أخرى.');
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok || payload.success === false) {
    if (response.status === 401 && token) {
      sessionStore.clear();
      if (typeof window !== 'undefined') window.dispatchEvent(new Event('tager:auth-expired'));
      const error = new Error('انتهت الجلسة أو لم يعد رمز الدخول صالحًا. سجّل الدخول مرة أخرى.');
      error.status = 401;
      throw error;
    }
    const message = payload.message || `حدث خطأ في الاتصال (${response.status})`;
    const fields = payload.errors?.map?.((item) => item.message).filter(Boolean).join('، ');
    const error = new Error(fields ? `${message}: ${fields}` : message);
    error.status = response.status;
    error.code = payload.code || null;
    throw error;
  }
  return payload.data ?? payload;
}

export const authApi = {
  register: (data) => apiRequest('/api/auth/register', { method: 'POST', body: data, token: null }),
  login: (data) => apiRequest('/api/auth/login', { method: 'POST', body: data, token: null }),
  google: (data) => apiRequest('/api/auth/google', { method: 'POST', body: data, token: null }),
  me: () => apiRequest('/api/auth/me'),
  companies: () => apiRequest('/api/companies'),
  storeRequest: () => apiRequest('/api/merchant/store-requests/me'),
  submitStoreRequest: (data) => apiRequest('/api/merchant/store-requests', { method: 'POST', body: data }),
  setCompanyGovernorate: (companyId, governorate) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/governorate`, { method: 'PATCH', body: { governorate } }),
};

export const companyProfileApi = {
  get: (companyId) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/profile`),
  save: (companyId, data) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/profile`, { method: 'PUT', body: data }),
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

export const productsApi = {
  list: (companyId) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/products?limit=100`),
  create: (companyId, data) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/products`, { method: 'POST', body: data }),
  createWithImages: (companyId, data, files) => {
    const form = new FormData();
    form.append('product', JSON.stringify(data));
    files.forEach((file) => form.append('images', file, file.name));
    return apiRequest(`/api/companies/${encodeURIComponent(companyId)}/products`, { method: 'POST', body: form });
  },
  update: (companyId, productId, data) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/products/${encodeURIComponent(productId)}`, { method: 'PUT', body: data }),
  remove: (companyId, productId) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/products/${encodeURIComponent(productId)}`, { method: 'DELETE' }),
};

export const ordersApi = {
  list: (companyId, { page = 1, limit = 50, status = '' } = {}) => apiRequest(
    `/api/companies/${encodeURIComponent(companyId)}/orders?page=${page}&limit=${limit}${status ? `&status=${encodeURIComponent(status)}` : ''}`,
  ),
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
