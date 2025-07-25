import React from 'react'
import { Layout, Card, Typography, Space } from 'antd'
import { useTheme } from '../../contexts/ThemeContext'
import './AuthLayout.css'

const { Content } = Layout
const { Title, Text } = Typography

const AuthLayout = ({ children }) => {
  const { getTheme } = useTheme()
  const theme = getTheme()

  return (
    <Layout 
      className="auth-layout"
      style={{
        minHeight: '100vh',
        backgroundColor: theme.token.colorBgLayout,
        backgroundImage: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Content style={{ padding: '24px', width: '100%', maxWidth: '400px' }}>
        {/* Company Branding */}
        <div 
          className="auth-branding"
          style={{
            textAlign: 'center',
            marginBottom: 32,
          }}
        >
          <div 
            className="company-logo"
            style={{
              width: 64,
              height: 64,
              backgroundColor: theme.token.colorPrimary,
              borderRadius: theme.token.borderRadius,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            }}
          >
            <Text 
              style={{ 
                color: 'white',
                fontSize: 24,
                fontWeight: 'bold'
              }}
            >
              B
            </Text>
          </div>
          
          <Title 
            level={2} 
            style={{ 
              color: 'white',
              marginBottom: 8,
              fontWeight: 300
            }}
          >
            Broadcom SaaS Portal
          </Title>
          
          <Text 
            style={{ 
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: 16
            }}
          >
            Enterprise-grade solution for modern teams
          </Text>
        </div>

        {/* Auth Form Card */}
        <Card
          className="auth-card"
          style={{
            backgroundColor: theme.token.colorBgContainer,
            borderRadius: theme.token.borderRadius * 2,
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
            border: 'none',
          }}
          bodyStyle={{ padding: '32px' }}
        >
          {children}
        </Card>

        {/* Footer */}
        <div 
          className="auth-footer"
          style={{
            textAlign: 'center',
            marginTop: 24,
          }}
        >
          <Text 
            style={{ 
              color: 'rgba(255, 255, 255, 0.6)',
              fontSize: 12
            }}
          >
            © 2024 Broadcom Inc. All rights reserved.
          </Text>
        </div>
      </Content>
    </Layout>
  )
}

export default AuthLayout 