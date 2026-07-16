import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

// Attach token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally — but never force-redirect for the login/register
// requests themselves, otherwise a wrong-password 401 wipes the page
// (and the toast) via a full reload before the user can read it.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthEndpoint = url.includes('/api/auth/login') || url.includes('/api/auth/register');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminData');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ── Auth ────────────────────────────────────────────────────────────────────
export const loginAdmin = (data) => api.post('/api/auth/login', data);
export const registerAdmin = (data) => api.post('/api/auth/register', data);
export const getMe = () => api.get('/api/auth/me');
export const getAllAdmins = () => api.get('/api/auth/admins');
export const updateAdminUser = (id, data) => api.put(`/api/auth/admins/${id}`, data);

// ── ContactForms ────────────────────────────────────────────────────────────
export const getContactForms = (params) => api.get('/api/contactForm', { params });
export const getContactForm = (id) => api.get(`/api/contactForm/${id}`);
export const updateContactForm = (id, data) => api.put(`/api/contactForm/${id}`, data);
export const deleteContactForm = (id) => api.delete(`/api/contactForm/${id}`);
export const getStats = () => api.get('/api/contactForm/stats');
export const exportLeads = () => api.get('/api/contactForm/export');

// ── Consultations ───────────────────────────────────────────────────────────
export const getConsultations = (params) => api.get('/api/consultations', { params });
export const getConsultation = (id) => api.get(`/api/consultations/${id}`);
export const updateConsultation = (id, data) => api.put(`/api/consultations/${id}`, data);
export const deleteConsultation = (id) => api.delete(`/api/consultations/${id}`);

export default api;