import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Input,
  Select,
  Row,
  Col,
  Modal,
  message,
  Avatar,
  Tooltip,
  Empty,
  Statistic
} from 'antd'
import {
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  MailOutlined,
  DeleteOutlined,
  ReloadOutlined,
  SendOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons'
import PageWrapper from '../../components/common/PageWrapper'
import UserModal from '../../components/users/UserModal'
import { userService } from '../../services/userService'

const { Title, Text } = Typography
const { Search } = Input
const { Option } = Select

const InvitationsPage = () => {
  const [loading, setLoading] = useState(false)
  const [invitations, setInvitations] = useState([])
  const [stats, setStats] = useState({})
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: 'pending' // Default to show only pending invitations
  })
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [userModal, setUserModal] = useState({
    visible: false,
    user: null,
    loading: false
  })

  useEffect(() => {
    fetchInvitations()
  }, [filters])

  const fetchInvitations = async () => {
    setLoading(true)
    try {
      // Get users with pending status (invitations)
      const response = await userService.getUsers({
        ...filters,
        status: 'pending' // Always filter for pending users (invitations)
      })
      
      setInvitations(response.data.users)
      setStats(response.data.stats)
    } catch (error) {
      message.error('Failed to fetch invitations: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }))
  }

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }))
  }

  const handleResendInvitation = async (user) => {
    try {
      await userService.resendInvitation(user._id)
      message.success(`Invitation resent to ${user.email}`)
    } catch (error) {
      message.error('Failed to resend invitation: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleBulkResend = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select invitations to resend')
      return
    }

    Modal.confirm({
      title: 'Resend Invitations',
      content: `Are you sure you want to resend ${selectedRowKeys.length} invitations?`,
      icon: <SendOutlined />,
      onOk: async () => {
        try {
          setLoading(true)
          const promises = selectedRowKeys.map(id => userService.resendInvitation(id))
          await Promise.all(promises)
          message.success(`${selectedRowKeys.length} invitations resent successfully`)
          setSelectedRowKeys([])
        } catch (error) {
          message.error('Failed to resend some invitations')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  const handleDeleteInvitation = async (user) => {
    Modal.confirm({
      title: 'Delete Invitation',
      content: `Are you sure you want to delete the invitation for ${user.firstName} ${user.lastName}?`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await userService.deleteUser(user._id)
          message.success('Invitation deleted successfully')
          fetchInvitations()
          setSelectedRowKeys(prev => prev.filter(key => key !== user._id))
        } catch (error) {
          message.error('Failed to delete invitation: ' + (error.response?.data?.message || error.message))
        }
      }
    })
  }

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select invitations to delete')
      return
    }

    Modal.confirm({
      title: 'Delete Invitations',
      content: `Are you sure you want to delete ${selectedRowKeys.length} invitations? This action cannot be undone.`,
      icon: <ExclamationCircleOutlined />,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          setLoading(true)
          await userService.bulkUpdateUsers(selectedRowKeys, 'delete')
          message.success(`${selectedRowKeys.length} invitations deleted successfully`)
          setSelectedRowKeys([])
          fetchInvitations()
        } catch (error) {
          message.error('Failed to delete some invitations')
        } finally {
          setLoading(false)
        }
      }
    })
  }

  const handleCreateInvitation = () => {
    setUserModal({ visible: true, user: null, loading: false })
  }

  const handleUserSubmit = async (userData) => {
    setUserModal(prev => ({ ...prev, loading: true }))
    try {
      await userService.createUser({ ...userData, sendInvitation: true })
      message.success('Invitation sent successfully')
      setUserModal({ visible: false, user: null, loading: false })
      fetchInvitations()
    } catch (error) {
      message.error('Failed to send invitation: ' + (error.response?.data?.message || error.message))
      setUserModal(prev => ({ ...prev, loading: false }))
    }
  }

  const getTimeAgo = (date) => {
    const now = new Date()
    const created = new Date(date)
    const diffInHours = Math.floor((now - created) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays}d ago`
    return created.toLocaleDateString()
  }

  const columns = [
    {
      title: 'User',
      dataIndex: 'user',
      key: 'user',
      render: (_, record) => (
        <Space>
          <Avatar
            size={32}
            src={record.avatar}
            icon={<UserOutlined />}
          />
          <div>
            <div style={{ fontWeight: 500 }}>
              {record.firstName} {record.lastName}
            </div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {record.email}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const colors = {
          admin: 'red',
          manager: 'blue',
          user: 'green',
          viewer: 'orange'
        }
        return (
          <Tag color={colors[role] || 'default'}>
            {role?.charAt(0).toUpperCase() + role?.slice(1)}
          </Tag>
        )
      },
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (department) => department || '-'
    },
    {
      title: 'Invited',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => (
        <Tooltip title={new Date(date).toLocaleString()}>
          <Space>
            <ClockCircleOutlined />
            <Text>{getTimeAgo(date)}</Text>
          </Space>
        </Tooltip>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: () => (
        <Tag color="orange" icon={<ClockCircleOutlined />}>
          Pending
        </Tag>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Tooltip title="Resend invitation">
            <Button
              type="text"
              icon={<MailOutlined />}
              onClick={() => handleResendInvitation(record)}
            />
          </Tooltip>
          <Tooltip title="Delete invitation">
            <Button
              type="text"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDeleteInvitation(record)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }

  return (
    <PageWrapper
      title="Invitations"
      subtitle="Manage user invitations and pending accounts"
      primaryAction={{
        label: "Send Invitation",
        icon: <MailOutlined />,
        onClick: handleCreateInvitation
      }}
    >
      {/* Statistics */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Invitations"
              value={invitations.length}
              prefix={<MailOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending"
              value={stats.pendingUsers || 0}
              valueStyle={{ color: '#fa8c16' }}
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="This Week"
              value={invitations.filter(inv => {
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)
                return new Date(inv.createdAt) > weekAgo
              }).length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Expired"
              value={0} // Would need to implement expiration logic
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search invitations..."
              allowClear
              enterButton={<SearchOutlined />}
              size="middle"
              value={filters.search}
              onSearch={handleSearch}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </Col>
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Filter by role"
              allowClear
              style={{ width: '100%' }}
              value={filters.role || undefined}
              onChange={(value) => handleFilterChange('role', value)}
            >
              <Option value="admin">Admin</Option>
              <Option value="manager">Manager</Option>
              <Option value="user">User</Option>
              <Option value="viewer">Viewer</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={12}>
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={fetchInvitations}
                loading={loading}
              >
                Refresh
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Bulk Actions */}
      {selectedRowKeys.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span>{selectedRowKeys.length} invitations selected</span>
            <Button
              icon={<SendOutlined />}
              onClick={handleBulkResend}
            >
              Resend
            </Button>
            <Button
              danger
              icon={<DeleteOutlined />}
              onClick={handleBulkDelete}
            >
              Delete
            </Button>
          </Space>
        </Card>
      )}

      {/* Invitations Table */}
      <Card>
        {invitations.length > 0 ? (
          <Table
            rowSelection={rowSelection}
            columns={columns}
            dataSource={invitations}
            rowKey="_id"
            loading={loading}
            pagination={{
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} invitations`,
            }}
          />
        ) : (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <div>
                <Text type="secondary">No pending invitations found</Text>
                <br />
                <Text type="secondary">Send your first invitation to get started</Text>
              </div>
            }
          >
            <Button type="primary" icon={<MailOutlined />} onClick={handleCreateInvitation}>
              Send Invitation
            </Button>
          </Empty>
        )}
      </Card>

      {/* Create User/Invitation Modal */}
      <UserModal
        visible={userModal.visible}
        user={userModal.user}
        loading={userModal.loading}
        title="Send Invitation"
        onCancel={() => setUserModal({ visible: false, user: null, loading: false })}
        onSubmit={handleUserSubmit}
      />
    </PageWrapper>
  )
}

export default InvitationsPage 