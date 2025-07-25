import React, { useState, useEffect } from 'react'
import {
  Modal,
  Form,
  Input,
  Select,
  Switch,
  Row,
  Col,
  Space,
  Button,
  Alert,
  Typography,
  Divider,
  Flex
} from 'antd'
import {
  UserOutlined,
  MailOutlined,
  PhoneOutlined,
  TeamOutlined,
  BankOutlined
} from '@ant-design/icons'

const { Option } = Select
const { Text } = Typography
const { TextArea } = Input

const UserModal = ({
  visible,
  onCancel,
  onSubmit,
  user = null,
  loading = false,
  title
}) => {
  const [form] = Form.useForm()
  const [sendInvitation, setSendInvitation] = useState(true)

  const isEdit = !!user

  useEffect(() => {
    if (visible) {
      if (isEdit && user) {
        form.setFieldsValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          role: user.role,
          department: user.department,
          title: user.title,
          phone: user.phone,
          bio: user.bio,
          status: user.status
        })
        setSendInvitation(false) // Don't show invitation option for edit
      } else {
        form.resetFields()
        setSendInvitation(true)
      }
    }
  }, [visible, isEdit, user, form])

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      
      // Add sendInvitation flag for new users
      if (!isEdit) {
        values.sendInvitation = sendInvitation
      }
      
      await onSubmit(values)
      form.resetFields()
    } catch (error) {
      console.error('Form validation failed:', error)
    }
  }

  const roleOptions = [
    { value: 'admin', label: 'Admin', description: 'Full system access' },
    { value: 'manager', label: 'Manager', description: 'Team and user management' },
    { value: 'user', label: 'User', description: 'Standard user access' },
    { value: 'viewer', label: 'Viewer', description: 'Read-only access' }
  ]

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'pending', label: 'Pending' },
    { value: 'suspended', label: 'Suspended' }
  ]

  return (
    <Modal
      title={title || (isEdit ? 'Edit User' : 'Create New User')}
      open={visible}
      onCancel={onCancel}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleSubmit}
        >
          {isEdit ? 'Update User' : 'Create User'}
        </Button>
      ]}
      width={600}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        name="userForm"
        initialValues={{
          role: 'user',
          status: 'active'
        }}
      >
        {/* Basic Information */}
        <div style={{ marginBottom: 16 }}>
          <Text strong>Basic Information</Text>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="firstName"
              label="First Name"
              rules={[
                { required: true, message: 'Please enter first name' },
                { max: 50, message: 'First name cannot exceed 50 characters' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter first name"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="lastName"
              label="Last Name"
              rules={[
                { required: true, message: 'Please enter last name' },
                { max: 50, message: 'Last name cannot exceed 50 characters' }
              ]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="Enter last name"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { required: true, message: 'Please enter email address' },
            { type: 'email', message: 'Please enter a valid email address' }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Enter email address"
            disabled={isEdit} // Don't allow email changes for existing users
          />
        </Form.Item>

        <Divider />

        {/* Role and Status */}
        <div style={{ marginBottom: 16 }}>
          <Text strong>Role & Access</Text>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="role"
              label="Role"
              rules={[{ required: true, message: 'Please select a role' }]}
            >
              <Select placeholder="Select role">
                {roleOptions.map(role => (
                  <Option key={role.value} value={role.value}>
                    <Flex vertical gap={0}>
                      <span>{role.label}</span>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {role.description}
                      </Text>
                    </Flex>
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            {isEdit && (
              <Form.Item
                name="status"
                label="Status"
                rules={[{ required: true, message: 'Please select status' }]}
              >
                <Select placeholder="Select status">
                  {statusOptions.map(status => (
                    <Option key={status.value} value={status.value}>
                      {status.label}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            )}
          </Col>
        </Row>

        <Divider />

        {/* Professional Information */}
        <div style={{ marginBottom: 16 }}>
          <Text strong>Professional Information</Text>
        </div>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="department"
              label="Department"
            >
              <Input
                prefix={<BankOutlined />}
                placeholder="Enter department"
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="title"
              label="Job Title"
            >
              <Input
                prefix={<TeamOutlined />}
                placeholder="Enter job title"
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="phone"
          label="Phone Number"
        >
          <Input
            prefix={<PhoneOutlined />}
            placeholder="Enter phone number"
          />
        </Form.Item>

        <Form.Item
          name="bio"
          label="Bio"
          rules={[
            { max: 500, message: 'Bio cannot exceed 500 characters' }
          ]}
        >
          <TextArea
            rows={3}
            placeholder="Enter bio (optional)"
            showCount
            maxLength={500}
          />
        </Form.Item>

        {/* Invitation Settings (only for new users) */}
        {!isEdit && (
          <>
            <Divider />
            <div style={{ marginBottom: 16 }}>
              <Text strong>Invitation Settings</Text>
            </div>
            
            <Form.Item>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Space>
                  <Switch
                    checked={sendInvitation}
                    onChange={setSendInvitation}
                  />
                  <Text>Send invitation email</Text>
                </Space>
                
                {sendInvitation ? (
                  <Alert
                    message="The user will receive an invitation email to set up their account."
                    type="info"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                ) : (
                  <Alert
                    message="The user will be created with a temporary password and activated immediately."
                    type="warning"
                    showIcon
                    style={{ marginTop: 8 }}
                  />
                )}
              </Space>
            </Form.Item>
          </>
        )}
      </Form>
    </Modal>
  )
}

export default UserModal 