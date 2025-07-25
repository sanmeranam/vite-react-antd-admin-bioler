import React from 'react'
import { Spin, Layout, Typography } from 'antd'
import { LoadingOutlined } from '@ant-design/icons'

const { Content } = Layout
const { Text } = Typography

const LoadingSpinner = ({ size = 'large', message = 'Loading...', fullscreen = true }) => {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 48 : 24 }} spin />

  const spinnerContent = (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
      }}
    >
      <Spin indicator={antIcon} size={size} />
      <Text type="secondary" style={{ fontSize: 16 }}>
        {message}
      </Text>
    </div>
  )

  if (fullscreen) {
    return (
      <Layout
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f5f5',
        }}
      >
        <Content>
          {spinnerContent}
        </Content>
      </Layout>
    )
  }

  return (
    <div
      style={{
        padding: '24px',
        textAlign: 'center',
      }}
    >
      {spinnerContent}
    </div>
  )
}

export default LoadingSpinner 