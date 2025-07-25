import React from 'react'
import { Card, Typography, Row, Col, Space, Switch, Select, Button, Divider } from 'antd'
import { SettingOutlined, ThunderboltOutlined, GlobalOutlined, SaveOutlined } from '@ant-design/icons'
import { useTheme } from '../../contexts/ThemeContext'
import PageWrapper from '../../components/common/PageWrapper'

const { Title, Text } = Typography
const { Option } = Select

const SettingsPage = () => {
  const { currentTheme, switchTheme, availableThemes } = useTheme()

  return (
    <PageWrapper
      title="Settings"
      subtitle="Manage your account and application preferences"
      showBreadcrumb={false}
    >
      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            {/* Appearance Settings */}
            <Card title="Appearance" icon={<ThunderboltOutlined />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>Theme</Text>
                    <br />
                    <Text type="secondary">Choose your preferred theme</Text>
                  </div>
                  <Select
                    value={currentTheme}
                    onChange={switchTheme}
                    style={{ width: 120 }}
                  >
                    {availableThemes.map(theme => (
                      <Option key={theme} value={theme}>
                        {theme.charAt(0).toUpperCase() + theme.slice(1)}
                      </Option>
                    ))}
                  </Select>
                </div>
                
                <Divider />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>Compact Mode</Text>
                    <br />
                    <Text type="secondary">Reduce spacing for better content density</Text>
                  </div>
                  <Switch />
                </div>
              </Space>
            </Card>

            {/* System Settings */}
            <Card title="System" icon={<SettingOutlined />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>Auto-save</Text>
                    <br />
                    <Text type="secondary">Automatically save changes</Text>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Divider />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>Real-time Updates</Text>
                    <br />
                    <Text type="secondary">Receive live updates from the server</Text>
                  </div>
                  <Switch defaultChecked />
                </div>
                
                <Divider />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>Analytics</Text>
                    <br />
                    <Text type="secondary">Help improve our service by sharing usage data</Text>
                  </div>
                  <Switch />
                </div>
              </Space>
            </Card>

            {/* Localization */}
            <Card title="Localization" icon={<GlobalOutlined />}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>Language</Text>
                    <br />
                    <Text type="secondary">Select your preferred language</Text>
                  </div>
                  <Select defaultValue="en" style={{ width: 120 }}>
                    <Option value="en">English</Option>
                    <Option value="es">Español</Option>
                    <Option value="fr">Français</Option>
                    <Option value="de">Deutsch</Option>
                  </Select>
                </div>
                
                <Divider />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>Timezone</Text>
                    <br />
                    <Text type="secondary">Set your local timezone</Text>
                  </div>
                  <Select defaultValue="utc" style={{ width: 200 }}>
                    <Option value="utc">UTC</Option>
                    <Option value="est">Eastern Time</Option>
                    <Option value="pst">Pacific Time</Option>
                    <Option value="cet">Central European Time</Option>
                  </Select>
                </div>
                
                <Divider />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <Text strong>Date Format</Text>
                    <br />
                    <Text type="secondary">Choose your preferred date format</Text>
                  </div>
                  <Select defaultValue="mm/dd/yyyy" style={{ width: 120 }}>
                    <Option value="mm/dd/yyyy">MM/DD/YYYY</Option>
                    <Option value="dd/mm/yyyy">DD/MM/YYYY</Option>
                    <Option value="yyyy-mm-dd">YYYY-MM-DD</Option>
                  </Select>
                </div>
              </Space>
            </Card>
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Card>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" icon={<SaveOutlined />} block>
                  Save All Settings
                </Button>
                <Button block>
                  Reset to Defaults
                </Button>
              </Space>
            </Card>

            <Card title="Help & Support">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Text type="secondary">
                  Need help with settings? Check out our documentation or contact support.
                </Text>
                <Button type="link" block>
                  View Documentation
                </Button>
                <Button type="link" block>
                  Contact Support
                </Button>
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>
    </PageWrapper>
  )
}

export default SettingsPage 