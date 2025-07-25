import React from 'react'
import { Row, Col, Card, Typography, Statistic, Space, Button, List, Progress } from 'antd'
import {
  UserOutlined,
  RiseOutlined,
  FallOutlined,
  EyeOutlined,
  TeamOutlined,
  DollarOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'

const { Title, Text } = Typography

const DashboardPage = () => {
  const { user, tenantInfo } = useAuth()

  // Mock data - would come from API in real implementation
  const stats = [
    {
      title: 'Total Users',
      value: 1234,
      prefix: <UserOutlined />,
      suffix: 'users',
      trend: { value: 12, isPositive: true },
    },
    {
      title: 'Active Sessions',
      value: 89,
      prefix: <EyeOutlined />,
      suffix: 'active',
      trend: { value: 8, isPositive: true },
    },
    {
      title: 'Monthly Revenue',
      value: 45678,
      prefix: <DollarOutlined />,
      formatter: (value) => `$${value.toLocaleString()}`,
      trend: { value: 15, isPositive: true },
    },
    {
      title: 'Success Rate',
      value: 98.5,
      prefix: <TrophyOutlined />,
      suffix: '%',
      trend: { value: 2.1, isPositive: true },
    },
  ]

  const recentActivities = [
    {
      id: 1,
      action: 'User registration',
      user: 'John Doe',
      time: '2 minutes ago',
      type: 'success',
    },
    {
      id: 2,
      action: 'System backup completed',
      user: 'System',
      time: '1 hour ago',
      type: 'info',
    },
    {
      id: 3,
      action: 'Failed login attempt',
      user: 'jane@example.com',
      time: '3 hours ago',
      type: 'warning',
    },
    {
      id: 4,
      action: 'Data export completed',
      user: 'Admin',
      time: '5 hours ago',
      type: 'success',
    },
  ]

  const quickActions = [
    { title: 'Add User', icon: <UserOutlined />, action: () => {} },
    { title: 'View Reports', icon: <RiseOutlined />, action: () => {} },
    { title: 'System Settings', icon: <TeamOutlined />, action: () => {} },
    { title: 'Export Data', icon: <DollarOutlined />, action: () => {} },
  ]

  return (
    <div>
      {/* Welcome Section */}
      <div style={{ marginBottom: 24 }}>
        <Title level={2} style={{ marginBottom: 8 }}>
          Welcome back, {user?.firstName}! 👋
        </Title>
        <Text type="secondary">
          Here's what's happening with {tenantInfo?.name || 'your organization'} today.
        </Text>
      </div>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card>
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={stat.prefix}
                suffix={stat.suffix}
                formatter={stat.formatter}
                valueStyle={{ color: '#3f8600' }}
              />
              <div style={{ marginTop: 8 }}>
                <Space>
                  {stat.trend.isPositive ? (
                    <RiseOutlined style={{ color: '#3f8600' }} />
                  ) : (
                    <FallOutlined style={{ color: '#cf1322' }} />
                  )}
                  <Text
                    type={stat.trend.isPositive ? 'success' : 'danger'}
                    style={{ fontSize: 12 }}
                  >
                    {stat.trend.value}% from last month
                  </Text>
                </Space>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        {/* Quick Actions */}
        <Col xs={24} lg={8}>
          <Card title="Quick Actions" style={{ height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              {quickActions.map((action, index) => (
                <Button
                  key={index}
                  type="dashed"
                  block
                  icon={action.icon}
                  onClick={action.action}
                  style={{ textAlign: 'left', height: 48 }}
                >
                  {action.title}
                </Button>
              ))}
            </Space>
          </Card>
        </Col>

        {/* Recent Activities */}
        <Col xs={24} lg={10}>
          <Card title="Recent Activities" style={{ height: '100%' }}>
            <List
              dataSource={recentActivities}
              renderItem={(item) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<ClockCircleOutlined />}
                    title={item.action}
                    description={
                      <Space>
                        <Text type="secondary">{item.user}</Text>
                        <Text type="secondary">•</Text>
                        <Text type="secondary">{item.time}</Text>
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>

        {/* System Health */}
        <Col xs={24} lg={6}>
          <Card title="System Health" style={{ height: '100%' }}>
            <Space direction="vertical" style={{ width: '100%' }} size="large">
              <div>
                <Text strong>CPU Usage</Text>
                <Progress percent={65} size="small" status="active" />
              </div>
              <div>
                <Text strong>Memory</Text>
                <Progress percent={45} size="small" />
              </div>
              <div>
                <Text strong>Storage</Text>
                <Progress percent={80} size="small" status="exception" />
              </div>
              <div>
                <Text strong>Network</Text>
                <Progress percent={30} size="small" />
              </div>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  )
}

export default DashboardPage 