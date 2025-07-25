import React, { useState, useEffect } from 'react'
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Avatar,
  Typography,
  Input,
  Select,
  Row,
  Col,
  Dropdown,
  Modal,
  message,
  Statistic,
  Spin
} from 'antd'
import {
  UserOutlined,
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  MailOutlined,
  ReloadOutlined
} from '@ant-design/icons'
import PageWrapper from '../../components/common/PageWrapper'
import UserModal from '../../components/users/UserModal'
import UserDetailsModal from '../../components/users/UserDetailsModal'
import { userService } from '../../services/userService'

const { Title } = Typography
const { Search } = Input
const { Option } = Select

const UserManagementPage = () => {
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [stats, setStats] = useState({})
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0
  })
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    status: '',
    department: ''
  })
  const [userModal, setUserModal] = useState({
    visible: false,
    user: null,
    loading: false
  })
  const [userDetailsModal, setUserDetailsModal] = useState({
    visible: false,
    user: null
  })

  // Fetch users data
  const fetchUsers = async (params = {}) => {
    setLoading(true)
    try {
      const response = await userService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        ...filters,
        ...params
      })
      
      setUsers(response.data.users)
      setStats(response.data.stats)
      setPagination(prev => ({
        ...prev,
        ...response.data.pagination
      }))
    } catch (error) {
      message.error('Failed to fetch users: ' + (error.response?.data?.message || error.message))
    } finally {
      setLoading(false)
    }
  }

  // Load users on component mount and when filters/pagination change
  useEffect(() => {
    fetchUsers()
  }, [pagination.page, pagination.limit])

  // Handle search
  const handleSearch = (value) => {
    setFilters(prev => ({ ...prev, search: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchUsers({ search: value, page: 1 })
  }

  // Handle filter change
  const handleFilterChange = (field, value) => {
    const newFilters = { ...filters, [field]: value }
    setFilters(newFilters)
    setPagination(prev => ({ ...prev, page: 1 }))
    fetchUsers({ ...newFilters, page: 1 })
  }

  // Handle user actions
  const handleCreateUser = () => {
    setUserModal({ visible: true, user: null, loading: false })
  }

  const handleEditUser = (user) => {
    setUserModal({ visible: true, user, loading: false })
  }

  const handleViewUser = (user) => {
    setUserDetailsModal({ visible: true, user })
  }

  const handleDeleteUser = (user) => {
    Modal.confirm({
      title: 'Delete User',
      content: `Are you sure you want to delete ${user.firstName} ${user.lastName}?`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await userService.deleteUser(user._id)
          message.success('User deleted successfully')
          fetchUsers()
          setSelectedRowKeys(prev => prev.filter(key => key !== user._id))
        } catch (error) {
          message.error('Failed to delete user: ' + (error.response?.data?.message || error.message))
        }
      },
    })
  }

  const handleResendInvitation = async (user) => {
    try {
      await userService.resendInvitation(user._id)
      message.success('Invitation sent successfully')
    } catch (error) {
      message.error('Failed to send invitation: ' + (error.response?.data?.message || error.message))
    }
  }

  const handleUserSubmit = async (userData) => {
    setUserModal(prev => ({ ...prev, loading: true }))
    try {
      if (userModal.user) {
        // Update existing user
        await userService.updateUser(userModal.user._id, userData)
        message.success('User updated successfully')
      } else {
        // Create new user
        await userService.createUser(userData)
        message.success('User created successfully')
      }
      
      setUserModal({ visible: false, user: null, loading: false })
      
      // Small delay to ensure backend has processed the request
      setTimeout(() => {
        // Reset filters and fetch fresh data to ensure new user is visible
        setFilters({
          search: '',
          role: '',
          status: '',
          department: ''
        })
        setPagination(prev => ({ ...prev, page: 1 }))
        fetchUsers({
          search: '',
          role: '',
          status: '',
          department: '',
          page: 1
        })
      }, 100)
    } catch (error) {
      message.error('Failed to save user: ' + (error.response?.data?.message || error.message))
      setUserModal(prev => ({ ...prev, loading: false }))
    }
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
            <div 
              style={{ 
                fontWeight: 500, 
                cursor: 'pointer', 
                color: '#1890ff' 
              }}
              onClick={() => handleViewUser(record)}
            >
              {record.firstName} {record.lastName}
            </div>
            <div style={{ fontSize: 12, color: '#666' }}>
              {record.email}
            </div>
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
        return <Tag color={colors[role] || 'default'}>{role?.charAt(0).toUpperCase() + role?.slice(1)}</Tag>
      },
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
      render: (department) => department || '-'
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colors = {
          active: 'green',
          inactive: 'red',
          pending: 'orange',
          suspended: 'red'
        }
        return (
          <Tag color={colors[status] || 'default'}>
            {status?.charAt(0).toUpperCase() + status?.slice(1)}
          </Tag>
        )
      },
    },
    {
      title: 'Last Login',
      dataIndex: 'lastLogin',
      key: 'lastLogin',
      render: (date) => date ? new Date(date).toLocaleDateString() : 'Never',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 80,
      render: (_, record) => {
        const menuItems = [
          {
            key: 'view',
            label: 'View Details',
            icon: <UserOutlined />,
            onClick: () => handleViewUser(record)
          },
          {
            key: 'edit',
            label: 'Edit User',
            icon: <EditOutlined />,
            onClick: () => handleEditUser(record)
          }
        ]

        if (record.status === 'pending') {
          menuItems.push({
            key: 'resend',
            label: 'Resend Invitation',
            icon: <MailOutlined />,
            onClick: () => handleResendInvitation(record)
          })
        }

        menuItems.push({
          key: 'delete',
          label: 'Delete User',
          icon: <DeleteOutlined />,
          danger: true,
          onClick: () => handleDeleteUser(record)
        })

        return (
          <Dropdown 
            menu={{ 
              items: menuItems,
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation()
                const item = menuItems.find(item => item.key === key)
                if (item?.onClick) item.onClick()
              }
            }} 
            trigger={['click']}
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        )
      },
    },
  ]

  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
  }

  const handleBulkAction = async (action) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select users first')
      return
    }

    const actionMap = {
      'Activate': 'activate',
      'Deactivate': 'deactivate', 
      'Delete': 'delete'
    }

    Modal.confirm({
      title: `${action} Selected Users`,
      content: `Are you sure you want to ${action.toLowerCase()} ${selectedRowKeys.length} selected users?`,
      okText: action,
      okType: action === 'Delete' ? 'danger' : 'primary',
      onOk: async () => {
        try {
          setLoading(true)
          await userService.bulkUpdateUsers(selectedRowKeys, actionMap[action])
          message.success(`${selectedRowKeys.length} users ${action.toLowerCase()}d successfully`)
          setSelectedRowKeys([])
          fetchUsers()
        } catch (error) {
          message.error(`Failed to ${action.toLowerCase()} users: ` + (error.response?.data?.message || error.message))
        } finally {
          setLoading(false)
        }
      },
    })
  }

  return (
    <PageWrapper
      title="User Management"
      subtitle="Manage users, roles, and permissions"
      primaryAction={{
        label: "Add User",
        icon: <PlusOutlined />,
        onClick: handleCreateUser
      }}
    >
      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Users"
              value={stats.totalUsers || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Active Users"
              value={stats.activeUsers || 0}
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Pending Users"
              value={stats.pendingUsers || 0}
              valueStyle={{ color: '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Admin Users"
              value={stats.adminUsers || 0}
              valueStyle={{ color: '#cf1322' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Filters and Search */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Search
              placeholder="Search users..."
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
          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Filter by status"
              allowClear
              style={{ width: '100%' }}
              value={filters.status || undefined}
              onChange={(value) => handleFilterChange('status', value)}
            >
              <Option value="active">Active</Option>
              <Option value="inactive">Inactive</Option>
              <Option value="pending">Pending</Option>
              <Option value="suspended">Suspended</Option>
            </Select>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Button 
                icon={<ReloadOutlined />}
                onClick={() => fetchUsers()}
                loading={loading}
              >
                Refresh
              </Button>
              <Button icon={<DownloadOutlined />}>
                Export
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* Bulk Actions */}
      {selectedRowKeys.length > 0 && (
        <Card style={{ marginBottom: 16 }}>
          <Space>
            <span>{selectedRowKeys.length} users selected</span>
            <Button
              size="small"
              onClick={() => handleBulkAction('Activate')}
            >
              Activate
            </Button>
            <Button
              size="small"
              onClick={() => handleBulkAction('Deactivate')}
            >
              Deactivate
            </Button>
            <Button
              size="small"
              danger
              onClick={() => handleBulkAction('Delete')}
            >
              Delete
            </Button>
          </Space>
        </Card>
      )}

      {/* Users Table */}
      <Card>
        <Table
          rowSelection={rowSelection}
          columns={columns}
          dataSource={users}
          rowKey="_id"
          loading={loading}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} users`,
            onChange: (page, pageSize) => {
              setPagination(prev => ({ ...prev, page, limit: pageSize }))
            },
            onShowSizeChange: (current, size) => {
              setPagination(prev => ({ ...prev, page: 1, limit: size }))
            }
          }}
        />
      </Card>

      {/* User Modal */}
      <UserModal
        visible={userModal.visible}
        user={userModal.user}
        loading={userModal.loading}
        onCancel={() => setUserModal({ visible: false, user: null, loading: false })}
        onSubmit={handleUserSubmit}
      />

      {/* User Details Modal */}
      <UserDetailsModal
        visible={userDetailsModal.visible}
        user={userDetailsModal.user}
        onCancel={() => setUserDetailsModal({ visible: false, user: null })}
        onEditUser={handleEditUser}
      />
    </PageWrapper>
  )
}

export default UserManagementPage 