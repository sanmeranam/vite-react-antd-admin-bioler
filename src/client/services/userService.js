import api from './api'

// User management API service
export const userService = {
  // Get all users with filtering and pagination
  async getUsers(params = {}) {
    const queryParams = new URLSearchParams()
    
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        queryParams.append(key, params[key])
      }
    })
    
    const response = await api.get(`/users?${queryParams.toString()}`)
    return response.data
  },

  // Get single user by ID
  async getUser(id) {
    const response = await api.get(`/users/${id}`)
    return response.data
  },

  // Create new user
  async createUser(userData) {
    const response = await api.post('/users', userData)
    return response.data
  },

  // Update user
  async updateUser(id, userData) {
    const response = await api.patch(`/users/${id}`, userData)
    return response.data
  },

  // Delete user
  async deleteUser(id) {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  // Bulk operations
  async bulkUpdateUsers(userIds, action, data = {}) {
    const response = await api.patch('/users/bulk', {
      userIds,
      action,
      data
    })
    return response.data
  },

  // Resend invitation
  async resendInvitation(id) {
    const response = await api.post(`/users/${id}/resend-invitation`)
    return response.data
  },

  // Get user activity
  async getUserActivity(id, params = {}) {
    const queryParams = new URLSearchParams(params)
    const response = await api.get(`/users/${id}/activity?${queryParams.toString()}`)
    return response.data
  },

  // Accept invitation (public endpoint)
  async acceptInvitation(token, passwordData) {
    const response = await api.patch(`/users/accept-invitation/${token}`, passwordData)
    return response.data
  },

  // Get user statistics
  async getUserStats() {
    const response = await api.get('/users/stats')
    return response.data
  }
}

export default userService 