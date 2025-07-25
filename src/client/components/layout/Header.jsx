import React, { useState } from 'react'
import { 
  Layout, 
  Button, 
  Avatar, 
  Dropdown, 
  Badge, 
  Tooltip, 
  Space,
  Typography,
  Popover,
  List,
  Empty,
  Divider
} from 'antd'
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BellOutlined,
  QuestionCircleOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  SunOutlined,
  MoonOutlined,
  BulbOutlined,
  GlobalOutlined
} from '@ant-design/icons'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useNotifications } from '../../hooks/useNotifications'
import UserProfileModal from '../users/UserProfileModal'
import './Header.css'

const { Header: AntHeader } = Layout
const { Text } = Typography

const Header = ({ pageTitle }) => {
  const { collapsed, toggleSidebar, currentTheme, switchTheme, getTheme, mobileMenuOpen, toggleMobileMenu, isMobile } = useTheme()
  const { user, tenantInfo, logout } = useAuth()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [profileModalVisible, setProfileModalVisible] = useState(false)
  const [notificationVisible, setNotificationVisible] = useState(false)
  
  const theme = getTheme()

  // User menu items
  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: 'Profile',
      onClick: () => setProfileModalVisible(true),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: 'Settings',
    },
    {
      type: 'divider',
    },
    {
      key: 'theme',
      icon: currentTheme === 'dark' ? <SunOutlined /> : <MoonOutlined />,
      label: currentTheme === 'dark' ? 'Light Mode' : 'Dark Mode',
      onClick: () => switchTheme(currentTheme === 'dark' ? 'light' : 'dark'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Logout',
      onClick: logout,
      danger: true,
    },
  ]

  // Notification content
  const notificationContent = (
    <div className="notification-popover" style={{ width: 350 }}>
      <div className="notification-header">
        <Text strong>Notifications</Text>
        {unreadCount > 0 && (
          <Button 
            type="link" 
            size="small" 
            onClick={markAllAsRead}
          >
            Mark all as read
          </Button>
        )}
      </div>
      <Divider style={{ margin: '8px 0' }} />
      
      {notifications.length === 0 ? (
        <Empty 
          description="No notifications" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ padding: '20px 0' }}
        />
      ) : (
        <List
          size="small"
          dataSource={notifications.slice(0, 5)}
          renderItem={(notification) => (
            <List.Item
              style={{
                padding: '8px 0',
                cursor: 'pointer',
                backgroundColor: !notification.read ? 'rgba(24, 144, 255, 0.05)' : 'transparent',
              }}
              onClick={() => markAsRead(notification.id)}
            >
              <List.Item.Meta
                title={
                  <Text 
                    strong={!notification.read}
                    style={{ fontSize: 14 }}
                  >
                    {notification.title}
                  </Text>
                }
                description={
                  <Text 
                    type="secondary" 
                    style={{ fontSize: 12 }}
                  >
                    {notification.message}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      )}
      
      {notifications.length > 5 && (
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <Button type="link" size="small">
            View all notifications
          </Button>
        </div>
      )}
    </div>
  )

  // Help content
  const helpContent = (
    <div style={{ width: 250 }}>
      <List
        size="small"
        dataSource={[
          { title: 'User Guide', icon: <BulbOutlined /> },
          { title: 'Keyboard Shortcuts', icon: <GlobalOutlined /> },
          { title: 'API Documentation', icon: <QuestionCircleOutlined /> },
          { title: 'Contact Support', icon: <UserOutlined /> },
        ]}
        renderItem={(item) => (
          <List.Item style={{ cursor: 'pointer', padding: '8px 0' }}>
            <List.Item.Meta
              avatar={item.icon}
              title={<Text style={{ fontSize: 14 }}>{item.title}</Text>}
            />
          </List.Item>
        )}
      />
    </div>
  )

  return (
    <>
      <AntHeader 
        className="main-header"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          left: collapsed ? 80 : 250,
          zIndex: 1000,
          padding: '0 24px',
          backgroundColor: theme.token.colorBgContainer,
          borderBottom: `1px solid ${theme.token.colorBorder}`,
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          transition: 'left 0.3s ease',
        }}
      >
        {/* Left Section */}
        <div className="header-left">
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={isMobile() ? toggleMobileMenu : toggleSidebar}
            style={{
              fontSize: '16px',
              width: 32,
              height: 32,
            }}
          />
          
          <div className="page-title" style={{ marginLeft: 16 }}>
            <Text strong style={{ fontSize: 16, color: theme.token.colorText }}>
              {pageTitle}
            </Text>
          </div>
        </div>

        {/* Center Section - Breadcrumb could go here */}
        <div className="header-center">
          <Text strong style={{ fontSize: 18, color: theme.token.colorPrimary }}>
            {tenantInfo?.name || 'Broadcom'}
          </Text>
        </div>

        {/* Right Section */}
        <div className="header-right">
          <Space size="middle">
            {/* Help */}
            <Popover
              content={helpContent}
              title="Help & Support"
              trigger="click"
              placement="bottomRight"
            >
              <Tooltip title="Help">
                <Button
                  type="text"
                  icon={<QuestionCircleOutlined />}
                  style={{
                    fontSize: '16px',
                    width: 32,
                    height: 32,
                  }}
                />
              </Tooltip>
            </Popover>

            {/* Notifications */}
            <Popover
              content={notificationContent}
              trigger="click"
              open={notificationVisible}
              onOpenChange={setNotificationVisible}
              placement="bottomRight"
            >
              <Tooltip title="Notifications">
                <Badge count={unreadCount} size="small">
                  <Button
                    type="text"
                    icon={<BellOutlined />}
                    style={{
                      fontSize: '16px',
                      width: 32,
                      height: 32,
                    }}
                  />
                </Badge>
              </Tooltip>
            </Popover>

            {/* User Profile */}
            <Dropdown
              menu={{ items: userMenuItems }}
              placement="bottomRight"
              trigger={['click']}
            >
              <div className="user-profile" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                <Avatar 
                  size={32}
                  src={user?.avatar}
                  icon={<UserOutlined />}
                  style={{ marginRight: 8 }}
                />
                <div className="user-info" style={{ display: collapsed ? 'none' : 'block' }}>
                  <Text strong style={{ display: 'block', lineHeight: 1.2 }}>
                    {user?.firstName} {user?.lastName}
                  </Text>
                  <Text 
                    type="secondary" 
                    style={{ fontSize: 12, display: 'block', lineHeight: 1.2 }}
                  >
                    {user?.role}
                  </Text>
                </div>
              </div>
            </Dropdown>
          </Space>
        </div>
      </AntHeader>

      {/* User Profile Modal */}
      <UserProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        user={user}
      />
    </>
  )
}

export default Header 