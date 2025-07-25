import axios from 'axios'
import { message } from 'antd'

// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
      message.error('Session expired. Please login again.')
    } else if (error.response?.status === 403) {
      message.error('Access denied. Insufficient permissions.')
    } else if (error.response?.status >= 500) {
      message.error('Server error. Please try again later.')
    }
    
    return Promise.reject(error)
  }
)

// Authentication API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  verifyToken: () => api.get('/auth/verify'),
  resetPassword: (email) => api.post('/auth/reset-password', { email }),
  updateProfile: (profileData) => api.put('/auth/profile', profileData),
  refreshToken: () => api.post('/auth/refresh'),
}

// User Management API
export const userAPI = {
  getUsers: (params) => api.get('/users', { params }),
  getUser: (id) => api.get(`/users/${id}`),
  createUser: (userData) => api.post('/users', userData),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
  bulkUpdate: (data) => api.put('/users/bulk', data),
  exportUsers: (format, filters) => api.post('/users/export', { format, filters }),
  inviteUser: (inviteData) => api.post('/users/invite', inviteData),
  resendInvite: (id) => api.post(`/users/${id}/resend-invite`),
}

// Tenant API
export const tenantAPI = {
  getTenants: (params) => api.get('/tenants', { params }),
  getTenant: (id) => api.get(`/tenants/${id}`),
  createTenant: (tenantData) => api.post('/tenants', tenantData),
  updateTenant: (id, tenantData) => api.put(`/tenants/${id}`, tenantData),
  deleteTenant: (id) => api.delete(`/tenants/${id}`),
  getTenantSettings: () => api.get('/tenants/settings'),
  updateTenantSettings: (settings) => api.put('/tenants/settings', settings),
}

// Roles and Permissions API
export const rbacAPI = {
  getRoles: () => api.get('/rbac/roles'),
  getRole: (id) => api.get(`/rbac/roles/${id}`),
  createRole: (roleData) => api.post('/rbac/roles', roleData),
  updateRole: (id, roleData) => api.put(`/rbac/roles/${id}`, roleData),
  deleteRole: (id) => api.delete(`/rbac/roles/${id}`),
  getPermissions: () => api.get('/rbac/permissions'),
  assignRole: (userId, roleId) => api.post('/rbac/assign-role', { userId, roleId }),
  removeRole: (userId, roleId) => api.delete('/rbac/remove-role', { data: { userId, roleId } }),
}

// Dashboard API
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getChartData: (chartType, params) => api.get(`/dashboard/charts/${chartType}`, { params }),
  getActivities: (params) => api.get('/dashboard/activities', { params }),
  getNotifications: (params) => api.get('/dashboard/notifications', { params }),
  markNotificationRead: (id) => api.put(`/dashboard/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/dashboard/notifications/mark-all-read'),
}

// File Upload API
export const fileAPI = {
  upload: (file, onProgress) => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    })
  },
  uploadMultiple: (files, onProgress) => {
    const formData = new FormData()
    files.forEach(file => formData.append('files', file))
    
    return api.post('/files/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: onProgress,
    })
  },
  delete: (fileId) => api.delete(`/files/${fileId}`),
  getFile: (fileId) => api.get(`/files/${fileId}`),
  getFiles: (params) => api.get('/files', { params }),
}

// Export API
export const exportAPI = {
  exportData: (type, format, filters) => {
    return api.post('/export', { type, format, filters }, {
      responseType: 'blob'
    })
  },
  getExportHistory: () => api.get('/export/history'),
  downloadExport: (exportId) => api.get(`/export/${exportId}/download`, {
    responseType: 'blob'
  }),
}

// Settings API
export const settingsAPI = {
  getSettings: () => api.get('/settings'),
  updateSettings: (settings) => api.put('/settings', settings),
  getSystemSettings: () => api.get('/settings/system'),
  updateSystemSettings: (settings) => api.put('/settings/system', settings),
  resetSettings: () => api.post('/settings/reset'),
}

// Third Party API
export const thirdPartyAPI = {
  getApiKeys: () => api.get('/third-party/api-keys'),
  createApiKey: (data) => api.post('/third-party/api-keys', data),
  updateApiKey: (id, data) => api.put(`/third-party/api-keys/${id}`, data),
  deleteApiKey: (id) => api.delete(`/third-party/api-keys/${id}`),
  getWebhooks: () => api.get('/third-party/webhooks'),
  createWebhook: (data) => api.post('/third-party/webhooks', data),
  updateWebhook: (id, data) => api.put(`/third-party/webhooks/${id}`, data),
  deleteWebhook: (id) => api.delete(`/third-party/webhooks/${id}`),
  testWebhook: (id) => api.post(`/third-party/webhooks/${id}/test`),
}

// Generic API function for custom endpoints
export const customAPI = {
  get: (endpoint, params) => api.get(endpoint, { params }),
  post: (endpoint, data) => api.post(endpoint, data),
  put: (endpoint, data) => api.put(endpoint, data),
  delete: (endpoint) => api.delete(endpoint),
  patch: (endpoint, data) => api.patch(endpoint, data),
}

export default api 