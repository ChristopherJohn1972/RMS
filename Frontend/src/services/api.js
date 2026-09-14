import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'https://rental-management-api.onrender.com/api';

class ApiService {
  constructor() {
    this.api = axios.create({
      baseURL: BASE_URL,
      timeout: 15000,
      headers: { 'Content-Type': 'application/json' },
    });

    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('rms_access_token');
        if (token) {
          config.headers.Authorization = `Token ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    this.api.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('rms_access_token');
          localStorage.removeItem('rms_user');
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  // ========================
  // AUTH
  // ========================
  auth = {
    login: (credentials) => this.api.post('/auth/login/', credentials),
    register: (data) => this.api.post('/auth/register/', data),
    me: () => this.api.get('/auth/me/'),
    profile: (uid) => this.api.get('/auth/profile/', { params: { uid } }),
    logout: () => {
      localStorage.removeItem('rms_access_token');
      localStorage.removeItem('rms_user');
      return Promise.resolve();
    }
  };

  // ========================
  // PROPERTIES
  // ========================
  properties = {
    getAll: (params) => this.api.get('/v1/properties/', { params }),
    getById: (id) => this.api.get(`/v1/properties/${id}/`),
    create: (data) => this.api.post('/v1/properties/', data),
    update: (id, data) => this.api.put(`/v1/properties/${id}/`, data),
    patch: (id, data) => this.api.patch(`/v1/properties/${id}/`, data),
    delete: (id) => this.api.delete(`/v1/properties/${id}/`),
    getPublic: (params) => this.api.get('/properties/', { params }),
  };

  // ========================
  // UNITS
  // ========================
  units = {
    getAll: (params) => this.api.get('/v1/units/', { params }),
    getById: (id) => this.api.get(`/v1/units/${id}/`),
    create: (data) => this.api.post('/v1/units/', data),
    update: (id, data) => this.api.put(`/v1/units/${id}/`, data),
    delete: (id) => this.api.delete(`/v1/units/${id}/`),
  };

  // ========================
  // DASHBOARD
  // ========================
  dashboard = {
    admin: () => this.api.get('/dashboard/admin/'),
    staff: () => this.api.get('/dashboard/staff/'),
    user: (userId) => this.api.get('/dashboard/user/', { params: { user_id: userId } }),
  };

  // ========================
  // REPORTS
  // ========================
  reports = {
    financial: (params) => this.api.get('/reports/financial/', { params }),
  };

  // ========================
  // MAINTENANCE
  // ========================
  maintenance = {
    getAll: (params) => this.api.get('/v1/maintenance/requests/', { params }),
    getById: (id) => this.api.get(`/v1/maintenance/requests/${id}/`),
    create: (data) => this.api.post('/v1/maintenance/requests/', data),
    update: (id, data) => this.api.put(`/v1/maintenance/requests/${id}/`, data),
    patch: (id, data) => this.api.patch(`/v1/maintenance/requests/${id}/`, data),
    delete: (id) => this.api.delete(`/v1/maintenance/requests/${id}/`),
  };

  // ========================
  // PAYMENTS
  // ========================
  payments = {
    getAll: (params) => this.api.get('/v1/payments/', { params }),
    getById: (id) => this.api.get(`/v1/payments/${id}/`),
    create: (data) => this.api.post('/v1/payments/', data),
    update: (id, data) => this.api.put(`/v1/payments/${id}/`, data),
    patch: (id, data) => this.api.patch(`/v1/payments/${id}/`, data),
    delete: (id) => this.api.delete(`/v1/payments/${id}/`),
    markPaid: (id) => this.api.patch(`/v1/payments/${id}/mark_paid/`),
  };

  // ========================
  // TENANTS
  // ========================
  tenants = {
    getAll: (params) => this.api.get('/v1/tenants/', { params }),
    getById: (uid) => this.api.get('/auth/profile/', { params: { uid } }),
    create: (data) => this.api.post('/auth/register/', data),
    update: (uid, data) => this.api.patch(`/v1/users/${uid}/`, data),
    delete: (uid) => this.api.delete(`/v1/users/${uid}/`),
  };

  // ========================
  // LEASES
  // ========================
  leases = {
    getAll: (params) => this.api.get('/v1/leases/', { params }),
    getById: (id) => this.api.get(`/v1/leases/${id}/`),
    create: (data) => this.api.post('/v1/leases/', data),
    update: (id, data) => this.api.put(`/v1/leases/${id}/`, data),
    delete: (id) => this.api.delete(`/v1/leases/${id}/`),
  };

  // ========================
  // NOTIFICATIONS
  // ========================
  notifications = {
    getAll: (params) => this.api.get('/v1/notifications/', { params }),
    markRead: (id) => this.api.patch(`/v1/notifications/${id}/mark_read/`),
    markAllRead: (userId) => this.api.post('/v1/notifications/mark_all_read/', { user_id: userId }),
    getSettings: () => this.api.get('/v1/notifications/notification_settings/'),
    updateSettings: (data) => this.api.put('/v1/notifications/notification_settings/', data),
    send: (data) => this.api.post('/v1/notifications/send/', data),
  };

  // ========================
  // CHAT
  // ========================
  chat = {
    getConversations: () => this.api.get('/v1/conversations/'),
    createConversation: (userId) => this.api.post('/v1/conversations/', { user_id: userId }),
    getMessages: (conversationId) => this.api.get(`/v1/conversations/${conversationId}/messages/`),
    sendMessage: (conversationId, text) => this.api.post(`/v1/conversations/${conversationId}/messages/`, { text }),
    markRead: (conversationId) => this.api.post(`/v1/conversations/${conversationId}/mark_read/`),
    getTenants: () => this.api.get('/v1/chat/tenants/'),
  };

  // ========================
  // HEALTH
  // ========================
  healthCheck = () => this.api.get('/health/', { timeout: 5000 });
  getInfo = () => this.api.get('/v1/info/');

  // ========================
  // DOCUMENTS
  // ========================
  documents = {
    getAll: (params) => this.api.get('/v1/documents/', { params }),
    upload: (formData) => this.api.post('/v1/documents/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }),
    delete: (id) => this.api.delete(`/v1/documents/${id}/`),
    download: (id) => `${BASE_URL}/v1/documents/${id}/download/?token=${localStorage.getItem('rms_access_token') || ''}`,
  };
}

export default new ApiService();
