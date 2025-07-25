import React, { useState, useEffect } from 'react'
import {
  Modal,
  Card,
  Avatar,
  Typography,
  Space,
  Tag,
  Row,
  Col,
  Descriptions,
  Button,
  Tabs,
  Timeline,
  Empty,
  Spin,
  Statistic,
  Alert
} from 'antd'
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  BankOutlined,
  CalendarOutlined,
  EditOutlined,
  MailTwoTone,
  ClockCircleOutlined,
  LoginOutlined,
  UserAddOutlined
} from '@ant-design/icons'
import { userService } from '../../services/userService'

const { Title, Text } = Typography
const { TabPane } = Tabs

const UserDetailsModal = ({
  visible,
  onCancel,
  user,
  onEditUser
}) => {
  const [loading, setLoading] = useState(false)
  const [activity, setActivity] = useState(null)
  const [activeTab, setActiveTab] = useState('details')

  useEffect(() => {
    if (visible && user?._id && activeTab === 'activity') {
      fetchUserActivity()
    }
  }, [visible, user?._id, activeTab])

  const fetchUserActivity = async () => {
    setLoading(true)
    try {
      const response = await userService.getUserActivity(user._id)
      setActivity(response.data)
    } catch (error) {
      console.error('Failed to fetch user activity:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResendInvitation = async () => {
    try {
      await userService.resendInvitation(user._id)
      // Handle success (you might want to show a message)
    } catch (error) {
      console.error('Failed to resend invitation:', error)
    }
  }

  if (!user) return null

  const getRoleColor = (role) => {
    const colors = {
      admin: 'red',
      manager: 'blue',
      user: 'green',
      viewer: 'orange'
    }
    return colors[role] || 'default'
  }

  const getStatusColor = (status) => {
    const colors = {
      active: 'green',
      inactive: 'red',
      pending: 'orange',
      suspended: 'red'
    }
    return colors[status] || 'default'
  }

  const formatDate = (date) => {
    if (!date) return 'Never'
    return new Date(date).toLocaleString()
  }

  return (
    <Modal
      title={null}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Close
        </Button>,
        <Button
          key="edit"
          type="primary"
          icon={<EditOutlined />}
          onClick={() => {
            onEditUser(user)
            onCancel()
          }}
        >
          Edit User
        </Button>
      ]}
      width={800}
      destroyOnClose
    >
      <div style={{ padding: '20px 0' }}>
        {/* User Header */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={16} align="middle">
            <Col>
              <Avatar
                size={80}
                src={user.avatar}
                icon={<UserOutlined />}
                style={{ backgroundColor: '#1890ff' }}
              />
            </Col>
            <Col flex={1}>
              <Space direction="vertical" size="small" style={{ width: '100%' }}>
                <Title level={3} style={{ margin: 0 }}>
                  {user.firstName} {user.lastName}
                </Title>
                <Text type="secondary" style={{ fontSize: 16 }}>
                  {user.email}
                </Text>
                <Space size="middle">
                  <Tag color={getRoleColor(user.role)} style={{ fontSize: 14 }}>
                    {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                  </Tag>
                  <Tag color={getStatusColor(user.status)} style={{ fontSize: 14 }}>
                    {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                  </Tag>
                </Space>
              </Space>
            </Col>
            <Col>
              <Space direction="vertical" align="end">
                {user.status === 'pending' && (
                  <Button
                    type="primary"
                    icon={<MailTwoTone />}
                    onClick={handleResendInvitation}
                    size="small"
                  >
                    Resend Invitation
                  </Button>
                )}
                <Text type="secondary" style={{ fontSize: 12 }}>
                  Created: {formatDate(user.createdAt)}
                </Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* Alert for pending users */}
        {user.status === 'pending' && (
          <Alert
            message="Pending User"
            description="This user has not yet accepted their invitation and set up their account."
            type="warning"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Tabs for different sections */}
        <Tabs activeKey={activeTab} onChange={setActiveTab}>
          <TabPane tab="Details" key="details">
            <Row gutter={16}>
              <Col span={12}>
                <Card title="Personal Information" size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label={<><UserOutlined /> Full Name</>}>
                      {user.firstName} {user.lastName}
                    </Descriptions.Item>
                    <Descriptions.Item label={<><MailOutlined /> Email</>}>
                      {user.email}
                    </Descriptions.Item>
                    {user.phone && (
                      <Descriptions.Item label={<><PhoneOutlined /> Phone</>}>
                        {user.phone}
                      </Descriptions.Item>
                    )}
                    {user.bio && (
                      <Descriptions.Item label="Bio">
                        {user.bio}
                      </Descriptions.Item>
                    )}
                  </Descriptions>
                </Card>
              </Col>
              
              <Col span={12}>
                <Card title="Professional Information" size="small">
                  <Descriptions column={1} size="small">
                    <Descriptions.Item label={<><TeamOutlined /> Role</>}>
                      <Tag color={getRoleColor(user.role)}>
                        {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                      </Tag>
                    </Descriptions.Item>
                    {user.department && (
                      <Descriptions.Item label={<><BankOutlined /> Department</>}>
                        {user.department}
                      </Descriptions.Item>
                    )}
                    {user.title && (
                      <Descriptions.Item label="Job Title">
                        {user.title}
                      </Descriptions.Item>
                    )}
                    <Descriptions.Item label="Status">
                      <Tag color={getStatusColor(user.status)}>
                        {user.status?.charAt(0).toUpperCase() + user.status?.slice(1)}
                      </Tag>
                    </Descriptions.Item>
                  </Descriptions>
                </Card>
              </Col>
            </Row>

            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={24}>
                <Card title="Account Information" size="small">
                  <Row gutter={16}>
                    <Col span={6}>
                      <Statistic
                        title="Last Login"
                        value={user.lastLogin ? formatDate(user.lastLogin) : 'Never'}
                        prefix={<LoginOutlined />}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Account Created"
                        value={formatDate(user.createdAt)}
                        prefix={<UserAddOutlined />}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Email Verified"
                        value={user.isEmailVerified ? 'Yes' : 'No'}
                        valueStyle={{ 
                          color: user.isEmailVerified ? '#3f8600' : '#cf1322' 
                        }}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Session Count"
                        value={user.sessionCount || 0}
                        prefix={<ClockCircleOutlined />}
                      />
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>
          </TabPane>

          <TabPane tab="Activity" key="activity">
            <Card>
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <Spin size="large" />
                </div>
              ) : activity ? (
                <div>
                  <Row gutter={16} style={{ marginBottom: 16 }}>
                    <Col span={6}>
                      <Statistic
                        title="Last Activity"
                        value={activity.user.lastActivity ? formatDate(activity.user.lastActivity) : 'Never'}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Total Sessions"
                        value={activity.user.sessionCount || 0}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Login Attempts"
                        value={activity.user.loginAttempts || 0}
                      />
                    </Col>
                    <Col span={6}>
                      <Statistic
                        title="Last Login"
                        value={activity.user.lastLogin ? formatDate(activity.user.lastLogin) : 'Never'}
                      />
                    </Col>
                  </Row>

                  {activity.activities && activity.activities.length > 0 ? (
                    <Timeline>
                      {activity.activities.map((item, index) => (
                        <Timeline.Item key={index}>
                          <Text strong>{item.action}</Text>
                          <br />
                          <Text type="secondary">{formatDate(item.timestamp)}</Text>
                        </Timeline.Item>
                      ))}
                    </Timeline>
                  ) : (
                    <Empty description="No activity records found" />
                  )}
                </div>
              ) : (
                <Empty description="Failed to load activity data" />
              )}
            </Card>
          </TabPane>

          <TabPane tab="Permissions" key="permissions">
            <Card>
              <Title level={5}>Role Permissions</Title>
              <div style={{ marginBottom: 16 }}>
                <Tag color={getRoleColor(user.role)} style={{ fontSize: 14 }}>
                  {user.role?.charAt(0).toUpperCase() + user.role?.slice(1)}
                </Tag>
              </div>
              
              {user.permissions && user.permissions.length > 0 ? (
                <Space wrap>
                  {user.permissions.map((permission, index) => (
                    <Tag key={index} color="blue">
                      {permission}
                    </Tag>
                  ))}
                </Space>
              ) : (
                <Text type="secondary">
                  Permissions are inherited from the user's role.
                </Text>
              )}
            </Card>
          </TabPane>
        </Tabs>
      </div>
    </Modal>
  )
}

export default UserDetailsModal 