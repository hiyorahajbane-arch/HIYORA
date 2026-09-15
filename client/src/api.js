const BASE = '/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('souk_token');
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(BASE + path, { ...options, headers });
  if (!res.ok) {
    const lang = (() => { try { return localStorage.getItem('souk_lang') || 'ar'; } catch { return 'ar'; } })();
    let fallback = lang === 'fr' ? 'Une erreur inattendue' : lang === 'en' ? 'Unexpected error' : 'حدث خطأ غير متوقع';
    let message = fallback;
    try {
      const body = await res.json();
      message = body.error || message;
    } catch {}
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export const api = {
  products: {
    list: (params) => {
      const qs = new URLSearchParams(params || {}).toString();
      return request(`/products${qs ? `?${qs}` : ''}`);
    },
    categories: () => request('/products/categories'),
    create: (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    remove: (id) => request(`/products/${id}`, { method: 'DELETE' })
  },
  orders: {
    create: (order) => request('/orders', { method: 'POST', body: JSON.stringify(order) }),
    list: (status) => request(`/orders${status ? `?status=${status}` : ''}`),
    setStatus: (id, status) => request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) })
  },
  auth: {
    login: (credentials) => request('/auth/login', { method: 'POST', body: JSON.stringify(credentials) }),
    stats: () => request('/auth/stats')
  },
  _raw: (path) => request(path)
};

export function formatPrice(n) {
  return new Intl.NumberFormat('fr-MA').format(n) + ' DH';
}