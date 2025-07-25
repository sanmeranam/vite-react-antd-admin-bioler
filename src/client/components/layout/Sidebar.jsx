import React, { useState, useMemo } from 'react'
import { Layout, Menu, Avatar, Typography, Space, Tag, Divider } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  DashboardOutlined,
  UserOutlined,
  SettingOutlined,
  TeamOutlined,
  SecurityScanOutlined,
  FileTextOutlined,
  ApiOutlined,
  BarChartOutlined,
  DatabaseOutlined,
  CloudOutlined,
  BugOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import './Sidebar.css'

const { Sider } = Layout
const { Text } = Typography

const Sidebar = () => {
  const { collapsed, getTheme, mobileMenuOpen, closeMobileMenu, isMobile } = useTheme()
  const { user, tenantInfo, hasPermission } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  const theme = getTheme()

  // Dynamic menu based on user permissions
  const menuItems = useMemo(() => {
    const items = [
      {
        key: '/dashboard',
        icon: <DashboardOutlined />,
        label: 'Dashboard',
        permission: 'dashboard.read',
      },
      {
        key: 'users',
        icon: <TeamOutlined />,
        label: 'User Management',
        permission: 'users.read',
        children: [
          {
            key: '/users',
            label: 'All Users',
            permission: 'users.read',
          },
          {
            key: '/users/roles',
            label: 'Roles & Permissions',
            permission: 'roles.read',
          },
          {
            key: '/users/invitations',
            label: 'Invitations',
            permission: 'users.invite',
          },
        ],
      },
      {
        key: 'analytics',
        icon: <BarChartOutlined />,
        label: 'Analytics',
        permission: 'analytics.read',
        children: [
          {
            key: '/analytics/overview',
            label: 'Overview',
            permission: 'analytics.read',
          },
          {
            key: '/analytics/reports',
            label: 'Reports',
            permission: 'analytics.read',
          },
          {
            key: '/analytics/exports',
            label: 'Data Exports',
            permission: 'analytics.export',
          },
        ],
      },
      {
        key: 'integrations',
        icon: <ApiOutlined />,
        label: 'Integrations',
        permission: 'integrations.read',
        children: [
          {
            key: '/integrations/api-keys',
            label: 'API Keys',
            permission: 'integrations.api_keys',
          },
          {
            key: '/integrations/webhooks',
            label: 'Webhooks',
            permission: 'integrations.webhooks',
          },
          {
            key: '/integrations/third-party',
            label: 'Third Party',
            permission: 'integrations.third_party',
          },
        ],
      },
      {
        key: 'security',
        icon: <SecurityScanOutlined />,
        label: 'Security',
        permission: 'security.read',
        children: [
          {
            key: '/security/audit-logs',
            label: 'Audit Logs',
            permission: 'security.audit',
          },
          {
            key: '/security/sessions',
            label: 'Active Sessions',
            permission: 'security.sessions',
          },
          {
            key: '/security/policies',
            label: 'Security Policies',
            permission: 'security.policies',
          },
        ],
      },
      {
        key: '/profile',
        icon: <UserOutlined />,
        label: 'Profile',
        permission: 'profile.read',
      },
      {
        key: '/settings',
        icon: <SettingOutlined />,
        label: 'Settings',
        permission: 'settings.read',
      },
    ]

    // Filter items based on permissions
    return items.filter(item => {
      if (item.permission && !hasPermission(item.permission)) {
        return false
      }
      
      if (item.children) {
        item.children = item.children.filter(child => 
          !child.permission || hasPermission(child.permission)
        )
        return item.children.length > 0
      }
      
      return true
    })
  }, [hasPermission])

  const handleMenuClick = ({ key }) => {
    if (key.startsWith('/')) {
      navigate(key)
      // Close mobile menu when navigating
      if (isMobile() && mobileMenuOpen) {
        closeMobileMenu()
      }
    }
  }

  const getSelectedKeys = () => {
    const pathname = location.pathname
    
    // Find exact match first
    if (menuItems.some(item => item.key === pathname)) {
      return [pathname]
    }
    
    // Find parent match for nested routes
    for (const item of menuItems) {
      if (item.children) {
        const match = item.children.find(child => child.key === pathname)
        if (match) {
          return [pathname]
        }
      }
    }
    
    return [pathname]
  }

  const getOpenKeys = () => {
    const pathname = location.pathname
    const openKeys = []
    
    for (const item of menuItems) {
      if (item.children) {
        const hasActiveChild = item.children.some(child => child.key === pathname)
        if (hasActiveChild) {
          openKeys.push(item.key)
        }
      }
    }
    
    return openKeys
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isMobile() && mobileMenuOpen && (
        <div 
          className="sidebar-backdrop show"
          onClick={closeMobileMenu}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 1000,
          }}
        />
      )}
      
      <Sider
        className={`main-sidebar ${theme.token.colorBgSidebar === '#ffffff' ? 'light-mode' : 'dark-mode'} ${isMobile() && mobileMenuOpen ? 'open' : ''}`}
        collapsed={collapsed}
        width={250}
        collapsedWidth={80}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 1001,
        backgroundColor: theme.token.colorBgSidebar,
        borderRight: `1px solid ${theme.token.colorBorder}`,
      }}
    >
      {/* Product Header */}
      <div 
        className="sidebar-header"
        style={{
          height: 64,
          padding: collapsed ? '16px 8px' : '16px 24px',
          backgroundColor: theme.token.colorBgSidebar,
          borderBottom: `1px solid ${theme.token.colorBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        {collapsed ? (
          <Avatar 
            size={32}
            style={{ 
              backgroundColor: theme.token.colorPrimary,
              color: theme.token.colorBgContainer,
              fontWeight: 'bold'
            }}
          >
            {tenantInfo?.name?.charAt(0) || 'B'}
          </Avatar>
        ) : (
          <Space direction="vertical" size={0}>
                          <Text 
                strong 
                style={{ 
                  color: theme.token.colorTextSidebar,
                  fontSize: 16,
                  lineHeight: 1.2
                }}
              >
                {tenantInfo?.productName || 'SaaS Portal'}
              </Text>
              <Text 
                style={{ 
                  color: theme.token.colorTextSidebar,
                  fontSize: 12,
                  opacity: 0.7,
                  lineHeight: 1.2
                }}
              >
                v{tenantInfo?.productVersion || '1.0.0'}
              </Text>
          </Space>
        )}
      </div>

      {/* User Info Section */}
      {!collapsed && (
        <div 
          className="sidebar-user-info"
          style={{
            padding: '16px 24px',
            backgroundColor: theme.token.colorBgSidebar === '#ffffff' 
              ? 'rgba(0, 0, 0, 0.03)' 
              : 'rgba(255, 255, 255, 0.05)',
            borderBottom: `1px solid ${theme.token.colorBorder}`,
          }}
        >
          <Space>
            <Avatar 
              size={40}
              src={user?.avatar}
              icon={<UserOutlined />}
              style={{ flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
                              <Text 
                  strong 
                  style={{ 
                    color: theme.token.colorTextSidebar,
                    display: 'block',
                    fontSize: 14,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}
                >
                  {user?.firstName} {user?.lastName}
                </Text>
              <Space size={4} style={{ marginTop: 4 }}>
                <Tag 
                  size="small"
                  color="blue"
                  style={{ margin: 0, fontSize: 10 }}
                >
                  {user?.role}
                </Tag>
                {tenantInfo?.name && (
                  <Tag 
                    size="small"
                    color="green"
                    style={{ margin: 0, fontSize: 10 }}
                  >
                    {tenantInfo.name}
                  </Tag>
                )}
              </Space>
            </div>
          </Space>
        </div>
      )}

      {/* Navigation Menu */}
      <div className="sidebar-menu" style={{ flex: 1, paddingTop: 8 }}>
        <Menu
          mode="inline"
          theme={theme.token.colorBgSidebar === '#ffffff' ? 'light' : 'dark'}
          selectedKeys={getSelectedKeys()}
          defaultOpenKeys={getOpenKeys()}
          onClick={handleMenuClick}
          items={menuItems}
          style={{
            backgroundColor: 'transparent',
            border: 'none',
          }}
        />
      </div>

      {/* Footer Info */}
      {!collapsed && (
        <div 
          className="sidebar-footer"
          style={{
            padding: '16px 24px',
            borderTop: `1px solid ${theme.token.colorBorder}`,
            backgroundColor: theme.token.colorBgSidebar === '#ffffff' 
              ? 'rgba(0, 0, 0, 0.01)' 
              : 'rgba(255, 255, 255, 0.02)',
          }}
        >
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text 
              style={{ 
                color: theme.token.colorTextSidebar,
                fontSize: 11,
                opacity: 0.6
              }}
            >
              © 2024 {tenantInfo?.companyName || 'Broadcom Inc.'}
            </Text>
            <Text 
              style={{ 
                color: theme.token.colorTextSidebar,
                fontSize: 11,
                opacity: 0.6
              }}
            >
              All rights reserved
            </Text>
          </Space>
        </div>
      )}
    </Sider>
    </>
  )
}

export default Sidebar 