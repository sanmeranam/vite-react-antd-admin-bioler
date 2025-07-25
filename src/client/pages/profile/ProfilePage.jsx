import React from 'react'
import { Card, Typography, Row, Col, Space, Button, Divider } from 'antd'
import { EditOutlined, SecurityScanOutlined, BellOutlined, KeyOutlined } from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import UserProfileModal from '../../components/users/UserProfileModal'

const { Title } = Typography

const ProfilePage = () => {
  const { user } = useAuth()
  const [profileModalVisible, setProfileModalVisible] = React.useState(false)

  return (
    <div>
      <Title level={2} style={{ marginBottom: 24 }}>
        Profile Settings
      </Title>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Profile Information */}
            <Card
              title="Profile Information"
              extra={
                <Button
                  type="primary"
                  icon={<EditOutlined />}
                  onClick={() => setProfileModalVisible(true)}
                >
                  Edit Profile
                </Button>
              }
            >
              <p>Manage your personal information and account settings.</p>
            </Card>

            {/* Security Settings */}
            <Card
              title="Security Settings"
              extra={
                <Button icon={<SecurityScanOutlined />}>
                  Manage Security
                </Button>
              }
            >
              <p>Update your password and manage two-factor authentication.</p>
              <Divider />
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button icon={<KeyOutlined />} block>
                  Change Password
                </Button>
                <Button icon={<SecurityScanOutlined />} block>
                  Setup Two-Factor Authentication
                </Button>
              </Space>
            </Card>

            {/* Notification Preferences */}
            <Card
              title="Notification Preferences"
              extra={
                <Button icon={<BellOutlined />}>
                  Configure
                </Button>
              }
            >
              <p>Customize how and when you receive notifications.</p>
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Account Overview">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <strong>Account Type:</strong> {user?.role}
              </div>
              <div>
                <strong>Member Since:</strong>{' '}
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </div>
              <div>
                <strong>Last Login:</strong>{' '}
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'N/A'}
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <UserProfileModal
        visible={profileModalVisible}
        onClose={() => setProfileModalVisible(false)}
        user={user}
      />
    </div>
  )
}

export default ProfilePage 