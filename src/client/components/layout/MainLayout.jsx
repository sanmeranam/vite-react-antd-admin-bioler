import React, { useState, useEffect } from 'react'
import { Layout, message } from 'antd'
import { Outlet, useLocation } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import Header from './Header'
import Sidebar from './Sidebar'
import NotificationCenter from '../notifications/NotificationCenter'
import { initializeSocket, disconnectSocket } from '../../services/socketService'
import './MainLayout.css'

const { Content } = Layout

const MainLayout = () => {
  const { collapsed, getTheme, mobileMenuOpen, isMobile } = useTheme()
  const { user, tenantInfo } = useAuth()
  const location = useLocation()
  const [pageTitle, setPageTitle] = useState('')
  
  // Socket connection for real-time updates
  useEffect(() => {
    if (user) {
      initializeSocket(user.id, tenantInfo?.id)
      
      return () => {
        disconnectSocket()
      }
    }
  }, [user, tenantInfo])

  // Update page title based on route
  useEffect(() => {
    const routeTitles = {
      '/dashboard': 'Dashboard',
      '/users': 'User Management',
      '/profile': 'Profile',
      '/settings': 'Settings',
    }
    
    const currentTitle = routeTitles[location.pathname] || 'Dashboard'
    setPageTitle(currentTitle)
    document.title = `${currentTitle} - ${tenantInfo?.name || 'SaaS Portal'}`
  }, [location.pathname, tenantInfo])

  const theme = getTheme()

  return (
    <Layout className="main-layout" style={{ minHeight: '100vh' }}>
      <Sidebar />
      
      <Layout 
        className="main-content-layout"
        style={{ 
          marginLeft: isMobile() ? 0 : (collapsed ? 80 : 250),
          transition: 'margin-left 0.3s ease',
        }}
      >
        <Header pageTitle={pageTitle} />
        
        <Content
          className="main-content"
          style={{
            backgroundColor: theme.token.colorBgLayout,
            minHeight: 'calc(100vh - 64px)',
          }}
        >
          <Outlet />
        </Content>
      </Layout>
      
      <NotificationCenter />
    </Layout>
  )
}

export default MainLayout 