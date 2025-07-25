import React, { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { message } from 'antd'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tenantInfo, setTenantInfo] = useState(null)
  const [permissions, setPermissions] = useState([])
  const navigate = useNavigate()

  useEffect(() => {
    checkAuthStatus()
  }, [])

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setLoading(false)
        return
      }

      const response = await authAPI.verifyToken()
      if (response.success) {
        setUser(response.user)
        setTenantInfo(response.tenant)
        setPermissions(response.permissions || [])
      } else {
        localStorage.removeItem('token')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      setLoading(true)
      const response = await authAPI.login(credentials)
      
      if (response.success) {
        localStorage.setItem('token', response.token)
        setUser(response.user)
        setTenantInfo(response.tenant)
        setPermissions(response.permissions || [])
        
        message.success('Login successful')
        
        // Redirect based on user role or previous location
        const redirectTo = localStorage.getItem('redirectAfterLogin') || '/dashboard'
        localStorage.removeItem('redirectAfterLogin')
        navigate(redirectTo)
        
        return { success: true }
      } else {
        message.error(response.message || 'Login failed')
        return { success: false, message: response.message }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Login failed'
      message.error(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('token')
      setUser(null)
      setTenantInfo(null)
      setPermissions([])
      navigate('/login')
      message.success('Logged out successfully')
    }
  }

  const register = async (userData) => {
    try {
      setLoading(true)
      const response = await authAPI.register(userData)
      
      if (response.success) {
        message.success('Registration successful')
        return { success: true }
      } else {
        message.error(response.message || 'Registration failed')
        return { success: false, message: response.message }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Registration failed'
      message.error(errorMessage)
      return { success: false, message: errorMessage }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email) => {
    try {
      const response = await authAPI.resetPassword(email)
      if (response.success) {
        message.success('Password reset email sent')
        return { success: true }
      } else {
        message.error(response.message || 'Reset failed')
        return { success: false, message: response.message }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Reset failed'
      message.error(errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  const updateProfile = async (profileData) => {
    try {
      const response = await authAPI.updateProfile(profileData)
      if (response.success) {
        setUser(response.user)
        message.success('Profile updated successfully')
        return { success: true }
      } else {
        message.error(response.message || 'Update failed')
        return { success: false, message: response.message }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Update failed'
      message.error(errorMessage)
      return { success: false, message: errorMessage }
    }
  }

  const hasPermission = (permission) => {
    if (!permissions.length) return false
    return permissions.includes(permission) || permissions.includes('admin')
  }

  const hasRole = (role) => {
    return user?.role === role || user?.role === 'admin'
  }

  const isAuthenticated = !!user

  const value = {
    user,
    tenantInfo,
    permissions,
    loading,
    isAuthenticated,
    login,
    logout,
    register,
    resetPassword,
    updateProfile,
    hasPermission,
    hasRole,
    checkAuthStatus,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 