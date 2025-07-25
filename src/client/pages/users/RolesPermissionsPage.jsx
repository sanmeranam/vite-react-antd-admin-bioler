import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Row,
  Col,
  Descriptions,
  Modal,
  Select,
  message,
  Tabs,
  List,
  Avatar,
  Statistic,
  Spin
} from 'antd'
import {
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  PlusOutlined,
  EditOutlined,
  SafetyOutlined,
  CrownOutlined,
  EyeOutlined
} from '@ant-design/icons'
import PageWrapper from '../../components/common/PageWrapper'
import { rbacAPI } from '../../services/api'

const { Title, Text } = Typography
const { Option } = Select
const { TabPane } = Tabs

const RolesPermissionsPage = () => {
  const [loading, setLoading] = useState(false)
  const [roles, setRoles] = useState([])
  const [permissions, setPermissions] = useState({})
  const [stats, setStats] = useState({})
  const [selectedRole, setSelectedRole] = useState(null)
  const [roleDetailsModal, setRoleDetailsModal] = useState({
    visible: false,
    role: null,
    loading: false
  })
  const [assignRoleModal, setAssignRoleModal] = useState({
    visible: false,
    users: [],
    loading: false
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [rolesResponse, permissionsResponse, statsResponse] = await Promise.all([
        rbacAPI.getRoles(),
        rbacAPI.getPermissions(),
        rbacAPI.getRoles() // Will get stats from roles endpoint
      ])

      setRoles(rolesResponse.data.roles)
      setPermissions(permissionsResponse.data.groupedPermissions)
      // Extract stats from roles data
      const roleStats = rolesResponse.data.roles.reduce((acc, role) => {
        acc[role.key] = role.userCount
        return acc
      }, {})
      setStats(roleStats)
    } catch (error) {
      message.error('Failed to fetch roles and permissions: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleViewRole = async (role) => {
    setRoleDetailsModal({ visible: true, role, loading: true })
    try {
      const response = await rbacAPI.getRole(role.key)
      setRoleDetailsModal({ visible: true, role: response.data.role, loading: false })
    } catch (error) {
      message.error('Failed to fetch role details')
      setRoleDetailsModal({ visible: false, role: null, loading: false })
    }
  }

  const handleAssignRole = async (userId, roleId) => {
    try {
      await rbacAPI.assignRole(userId, roleId)
      message.success('Role assigned successfully')
      fetchData()
    } catch (error) {
      message.error('Failed to assign role: ' + (error.response?.data?.message || error.message))
    }
  }

  const getRoleIcon = (role) => {
    const icons = {
      admin: <CrownOutlined style={{ color: '#ff4d4f' }} />,
      manager: <TeamOutlined style={{ color: '#1890ff' }} />,
      user: <UserOutlined style={{ color: '#52c41a' }} />,
      viewer: <EyeOutlined style={{ color: '#fa8c16' }} />
    }
    return icons[role] || <UserOutlined />
  }

  const rolesColumns = [
    {
      title: 'Role',
      dataIndex: 'name',
      key: 'name',
      render: (_, record) => (
        <Space>
          {getRoleIcon(record.key)}
          <div>
            <div style={{ fontWeight: 500 }}>{record.name}</div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Users',
      dataIndex: 'userCount',
      key: 'userCount',
      render: (count) => (
        <Statistic
          value={count}
          suffix="users"
          valueStyle={{ fontSize: 14 }}
        />
      ),
    },
    {
      title: 'Permissions',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (permissions, record) => (
        <div>
          {record.key === 'admin' ? (
            <Tag color="red">All Permissions</Tag>
          ) : (
            <Text>{permissions.length} permissions</Text>
          )}
        </div>
      ),
    },
    {
      title: 'Priority',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => (
        <Tag color={priority >= 100 ? 'red' : priority >= 75 ? 'blue' : priority >= 50 ? 'green' : 'orange'}>
          {priority}
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={() => handleViewRole(record)}
          >
            View
          </Button>
        </Space>
      ),
    },
  ]

  return (
    <PageWrapper
      title="Roles & Permissions"
      subtitle="Manage user roles and permissions across the system"
    >
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        {roles.map((role) => (
          <Col key={role.key} xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title={role.name}
                value={role.userCount}
                prefix={getRoleIcon(role.key)}
                suffix="users"
                valueStyle={{ color: role.color === 'red' ? '#ff4d4f' : role.color === 'blue' ? '#1890ff' : role.color === 'green' ? '#52c41a' : '#fa8c16' }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* Main Content */}
      <Tabs defaultActiveKey="roles">
        <TabPane tab="Roles Overview" key="roles">
          <Card>
            <Table
              columns={rolesColumns}
              dataSource={roles}
              rowKey="key"
              loading={loading}
              pagination={false}
            />
          </Card>
        </TabPane>

        <TabPane tab="Permissions Matrix" key="permissions">
          <Card>
            <Row gutter={16}>
              {Object.entries(permissions).map(([category, perms]) => (
                <Col key={category} xs={24} sm={12} md={8} style={{ marginBottom: 16 }}>
                  <Card size="small" title={category}>
                    <Space direction="vertical" style={{ width: '100%' }}>
                      {perms.map((permission) => (
                        <Tag key={permission} color="blue" style={{ margin: 2 }}>
                          {permission}
                        </Tag>
                      ))}
                    </Space>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </TabPane>

        <TabPane tab="Role Details" key="details">
          {selectedRole ? (
            <Card>
              <Descriptions title={selectedRole.name} bordered>
                <Descriptions.Item label="Description">{selectedRole.description}</Descriptions.Item>
                <Descriptions.Item label="Users">{selectedRole.userCount}</Descriptions.Item>
                <Descriptions.Item label="Priority">{selectedRole.priority}</Descriptions.Item>
                <Descriptions.Item label="Permissions" span={3}>
                  <Space wrap>
                    {selectedRole.permissions.map((permission) => (
                      <Tag key={permission} color="blue">
                        {permission}
                      </Tag>
                    ))}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>
          ) : (
            <Card>
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <SafetyOutlined style={{ fontSize: 48, color: '#d9d9d9' }} />
                <div style={{ margin: '16px 0' }}>
                  <Text type="secondary">Select a role from the overview to view details</Text>
                </div>
              </div>
            </Card>
          )}
        </TabPane>
      </Tabs>

      {/* Role Details Modal */}
      <Modal
        title={roleDetailsModal.role?.name}
        open={roleDetailsModal.visible}
        onCancel={() => setRoleDetailsModal({ visible: false, role: null, loading: false })}
        footer={[
          <Button key="close" onClick={() => setRoleDetailsModal({ visible: false, role: null, loading: false })}>
            Close
          </Button>
        ]}
        width={700}
      >
        {roleDetailsModal.loading ? (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <Spin size="large" />
          </div>
        ) : roleDetailsModal.role ? (
          <div>
            <Descriptions bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="Description" span={3}>
                {roleDetailsModal.role.description}
              </Descriptions.Item>
              <Descriptions.Item label="Users">
                {roleDetailsModal.role.userCount}
              </Descriptions.Item>
              <Descriptions.Item label="Priority">
                <Tag color={roleDetailsModal.role.color}>
                  {roleDetailsModal.role.priority}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Color">
                <Tag color={roleDetailsModal.role.color}>
                  {roleDetailsModal.role.color}
                </Tag>
              </Descriptions.Item>
            </Descriptions>

            <Title level={5}>Permissions</Title>
            <Space wrap style={{ marginBottom: 16 }}>
              {roleDetailsModal.role.key === 'admin' ? (
                <Tag color="red" style={{ fontSize: 14 }}>All Permissions</Tag>
              ) : (
                roleDetailsModal.role.permissions.map((permission) => (
                  <Tag key={permission} color="blue">
                    {permission}
                  </Tag>
                ))
              )}
            </Space>

            {roleDetailsModal.role.users && roleDetailsModal.role.users.length > 0 && (
              <>
                <Title level={5}>Users with this role</Title>
                <List
                  dataSource={roleDetailsModal.role.users}
                  renderItem={(user) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={<Avatar src={user.avatar} icon={<UserOutlined />} />}
                        title={`${user.firstName} ${user.lastName}`}
                        description={
                          <Space>
                            <Text type="secondary">{user.email}</Text>
                            <Tag color={user.status === 'active' ? 'green' : 'orange'}>
                              {user.status}
                            </Tag>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </>
            )}
          </div>
        ) : null}
      </Modal>
    </PageWrapper>
  )
}

export default RolesPermissionsPage 