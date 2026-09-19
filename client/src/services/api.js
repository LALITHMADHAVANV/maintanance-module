import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Response interceptor — handle errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ---------- Auth ----------
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// ---------- Machines ----------
export const machinesAPI = {
  getAll: (params) => api.get('/machines', { params }),
  getById: (id) => api.get(`/machines/${id}`),
  create: (data) => api.post('/machines', data),
  update: (id, data) => api.put(`/machines/${id}`, data),
  delete: (id) => api.delete(`/machines/${id}`),
  getIssuePhotos: (id) => api.get(`/machines/${id}/issue-photos`),
};

// ---------- Work Orders ----------
export const workOrdersAPI = {
  getAll: (params) => api.get('/workorders', { params }),
  getById: (id) => api.get(`/workorders/${id}`),
  create: (data) => api.post('/workorders', data),
  update: (id, data) => api.put(`/workorders/${id}`, data),
  updateStatus: (id, status) => api.patch(`/workorders/${id}/status`, { status }),
  delete: (id) => api.delete(`/workorders/${id}`),
};

// ---------- Messages ----------
export const messagesAPI = {
  sendWithImage: (formData) => api.post('/messages/send-with-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getInbox: (params) => api.get('/messages/inbox', { params }),
  getSent: (params) => api.get('/messages/sent', { params }),
  getById: (id) => api.get(`/messages/message/${id}`),
  markRead: (id) => api.patch(`/messages/${id}/read`),
  delete: (id) => api.delete(`/messages/${id}`),
  getMachinePhotos: (machineId) => api.get(`/messages/machine/${machineId}/issue-photos`),
};

// ---------- Specialists ----------
export const specialistsAPI = {
  findSpecialist: (data) => api.post('/messages/find-specialist', data),
  getAll: () => api.get('/specialists'),
  updateSkills: (id, data) => api.put(`/specialists/${id}/skills`, data),
};

export const sparePartsAPI = {
  getAll: (params) => api.get('/spareparts', { params }),
  create: (data) => api.post('/spareparts', data),
  update: (id, data) => api.put(`/spareparts/${id}`, data),
  restock: (id, data) => api.post(`/spareparts/${id}/restock`, data),
  getRestockHistory: (id) => api.get(`/spareparts/${id}/restock-history`),
  getLowStock: () => api.get('/spareparts/low-stock'),
};

// ---------- Notifications ----------
export const notificationsAPI = {
  getAll: () => api.get('/notifications'),
  getUnread: () => api.get('/notifications/unread'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  sendAlert: (data) => api.post('/notifications/alert', data),
};

// ---------- Analytics ----------
export const analyticsAPI = {
  getDowntime: (params) => api.get('/analytics/downtime', { params }),
  getCost: (params) => api.get('/analytics/cost', { params }),
  getPerformance: (params) => api.get('/analytics/performance', { params }),
  getReports: (params) => api.get('/analytics/reports', { params }),
};

export default api;
