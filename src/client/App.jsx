import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import { useAuth } from './contexts/AuthContext'
import { useTheme } from './contexts/ThemeContext'
import MainLayout from './components/layout/MainLayout'
import AuthLayout from './components/layout/AuthLayout'
import LoadingSpinner from './components/common/LoadingSpinner'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Auth Pages
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'

// Main Pages
import DashboardPage from './pages/dashboard/DashboardPage'
import UserManagementPage from './pages/users/UserManagementPage'
import RolesPermissionsPage from './pages/users/RolesPermissionsPage'
import InvitationsPage from './pages/users/InvitationsPage'
import ProfilePage from './pages/profile/ProfilePage'
import SettingsPage from './pages/settings/SettingsPage'
import NotFoundPage from './pages/common/NotFoundPage'

import './App.css'

function App() {
  const { loading, isAuthenticated } = useAuth()
  const { getTheme } = useTheme()

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <ConfigProvider theme={getTheme()}>
      <div className="app">
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={
            !isAuthenticated ? (
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } />
          
          <Route path="/register" element={
            !isAuthenticated ? (
              <AuthLayout>
                <RegisterPage />
              </AuthLayout>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } />
          
          <Route path="/reset-password" element={
            !isAuthenticated ? (
              <AuthLayout>
                <ResetPasswordPage />
              </AuthLayout>
            ) : (
              <Navigate to="/dashboard" replace />
            )
          } />

          {/* Protected App Routes */}
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="users" element={<UserManagementPage />} />
            <Route path="users/roles" element={<RolesPermissionsPage />} />
            <Route path="users/invitations" element={<InvitationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          {/* 404 Route */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>
    </ConfigProvider>
  )
}

export default App
