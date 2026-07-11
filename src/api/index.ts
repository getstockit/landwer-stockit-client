import axios from 'axios';

// In the browser (dev/preview): use Vite's proxy via relative '/api'.
// In the packaged mobile app (Capacitor): there is no dev server to proxy through,
// so VITE_API_URL must point directly at the server (local IP or Render URL).
const envApiUrl = import.meta.env.VITE_API_URL;
const BASE = envApiUrl ? `${envApiUrl.replace(/\/$/, '')}/api` : '/api';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use(config => {
  const token = localStorage.getItem('ldw_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ldw_token');
      localStorage.removeItem('ldw_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

export const authApi = {
  listUsers:       () => api.get('/auth/users'),
  login:           (userId: string, pin: string) => api.post('/auth/login', { userId, pin }),
  register:        (name: string, pin: string) => api.post('/auth/register', { name, pin }),
  registerManager: (name: string, pin: string, bootstrapCode?: string) => api.post('/auth/register-manager', { name, pin, bootstrapCode }),
  deleteUser:      (id: string) => api.delete(`/auth/users/${id}`),
  pendingUsers:    () => api.get('/auth/pending'),
  approveUser:     (id: string) => api.post(`/auth/users/${id}/approve`),
  rejectUser:      (id: string) => api.post(`/auth/users/${id}/reject`),
};

export const locationApi = {
  getAll: () => api.get('/locations'),
  create: (d: object) => api.post('/locations', d),
  update: (id: string, d: object) => api.put(`/locations/${id}`, d),
  remove: (id: string) => api.delete(`/locations/${id}`),
};

export const supplierApi = {
  getAll: () => api.get('/suppliers'),
  create: (d: object) => api.post('/suppliers', d),
  update: (id: string, d: object) => api.put(`/suppliers/${id}`, d),
  remove: (id: string) => api.delete(`/suppliers/${id}`),
};

export const alertsApi = { supplierReminders: () => api.get('/alerts/supplier-reminders') };

export const productApi = {
  getAll: () => api.get('/products'),
  create: (d: object) => api.post('/products', d),
  update: (id: string, d: object) => api.put(`/products/${id}`, d),
};

export const movementApi = {
  getAll:   (params?: object) => api.get('/movements', { params }),
  stockIn:  (d: object) => api.post('/movements/stock-in', d),
  stockOut: (d: object) => api.post('/movements/stock-out', d),
};

export const barcodeApi = {
  getAll: () => api.get('/barcodes'),
  lookup: (code: string) => api.get(`/barcodes/lookup/${encodeURIComponent(code)}`),
  regenerate: () => api.post('/barcodes/regenerate'),
};

export const deliveryApi = {
  getAll:  () => api.get('/deliveries'),
  analyze: (d: object) => api.post('/deliveries/analyze', d),
  confirm: (d: object) => api.post('/deliveries/confirm', d),
};

export const reportApi = {
  lowStock: () => api.get('/reports/low-stock'),
  current: () => api.get('/reports/current'),
  history: (params?: object) => api.get('/reports/history', { params }),
};
