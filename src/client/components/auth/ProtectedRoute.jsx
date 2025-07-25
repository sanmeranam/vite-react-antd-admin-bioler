import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'

const ProtectedRoute = ({ children, requiredPermission, requiredRole }) => {
  const { isAuthenticated, loading, hasPermission, hasRole } = useAuth()
  const location = useLocation()

  if (loading) {
    return <LoadingSpinner message="Verifying authentication..." />
  }

  if (!isAuthenticated) {
    // Store the current location for redirect after login
    localStorage.setItem('redirectAfterLogin', location.pathname)
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check for required permission
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />
  }

  // Check for required role
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />
  }

  return children
}

export default ProtectedRoute 