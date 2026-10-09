const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'https://tagerbackend.ahn90073.workers.dev').replace(/\/$/, '');
const TOKEN_KEY = 'taget_api_token';
const COMPANY_KEY = 'taget_company';

export const sessionStore = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token) => localStorage.setItem(TOKEN_KEY, token),
  getCompany: () => {
    try { return JSON.parse(localStorage.getItem(COMPANY_KEY) || 'null'); } catch { return null; }
  },
  setCompany: (company) => localStorage.setItem(COMPANY_KEY, JSON.stringify(company)),
  clear: () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(COMPANY_KEY); },
};

export async function apiRequest(path, { method = 'GET', body, token = sessionStore.getToken() } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  let response;
  let payload;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: {
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
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
      throw new Error('انتهت الجلسة أو لم يعد رمز الدخول صالحًا. سجّل الدخول مرة أخرى.');
    }
    const message = payload.message || `حدث خطأ في الاتصال (${response.status})`;
    const fields = payload.errors?.map?.((item) => item.message).filter(Boolean).join('، ');
    throw new Error(fields ? `${message}: ${fields}` : message);
  }
  return payload.data ?? payload;
}

export const authApi = {
  register: (data) => apiRequest('/api/auth/register', { method: 'POST', body: data, token: null }),
  login: (data) => apiRequest('/api/auth/login', { method: 'POST', body: data, token: null }),
  me: () => apiRequest('/api/auth/me'),
  companies: () => apiRequest('/api/companies'),
  createCompany: (data) => apiRequest('/api/companies', { method: 'POST', body: data }),
};

export const productsApi = {
  list: (companyId) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/products?limit=100`),
  create: (companyId, data) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/products`, { method: 'POST', body: data }),
  update: (companyId, productId, data) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/products/${encodeURIComponent(productId)}`, { method: 'PUT', body: data }),
  remove: (companyId, productId) => apiRequest(`/api/companies/${encodeURIComponent(companyId)}/products/${encodeURIComponent(productId)}`, { method: 'DELETE' }),
};

export function mapBackendProduct(product) {
  return {
    id: product.id,
    sku: product.sku,
    name: product.name || '',
    category: product.category?.name || product.category_name || product.metadata?.categoryLabel || 'عام',
    price: Number(product.price || 0),
    stock: Number(product.stock_quantity ?? product.stock ?? 0),
    weight: Number(product.weight_grams || 0) / 1000,
    image: product.metadata?.image || product.image_url || '',
    status: product.status || 'pending',
    rejectionReason: product.rejection_reason || product.rejectionReason || '',
  };
}

export function makeCompanySlug(name) {
  const slug = String(name || 'merchant').normalize('NFKD').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '').slice(0, 42);
  return `${slug || 'merchant'}-${Math.random().toString(36).slice(2, 7)}`;
}

export { API_BASE_URL };
