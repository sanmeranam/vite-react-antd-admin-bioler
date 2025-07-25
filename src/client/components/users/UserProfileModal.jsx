import React, { useState } from 'react'
import {
  Modal,
  Form,
  Input,
  Avatar,
  Typography,
  Row,
  Col,
  Divider,
  Button,
  Upload,
  message,
  Space,
  Tag,
  Descriptions,
} from 'antd'
import {
  UserOutlined,
  EditOutlined,
  CameraOutlined,
  SaveOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useAuth } from '../../contexts/AuthContext'
import { fileAPI } from '../../services/api'

const { Title, Text } = Typography

const UserProfileModal = ({ visible, onClose, user }) => {
  const { updateProfile } = useAuth()
  const [form] = Form.useForm()
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar)

  const handleEdit = () => {
    form.setFieldsValue({
      firstName: user?.firstName,
      lastName: user?.lastName,
      email: user?.email,
      phone: user?.phone,
      department: user?.department,
      title: user?.title,
    })
    setIsEditing(true)
  }

  const handleCancel = () => {
    setIsEditing(false)
    form.resetFields()
    setAvatarUrl(user?.avatar)
  }

  const handleSave = async () => {
    try {
      const values = await form.validateFields()
      setLoading(true)

      const profileData = {
        ...values,
        avatar: avatarUrl,
      }

      const result = await updateProfile(profileData)
      if (result.success) {
        setIsEditing(false)
        message.success('Profile updated successfully')
      }
    } catch (error) {
      console.error('Profile update error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarUpload = async (file) => {
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fileAPI.upload(file, (progress) => {
        console.log('Upload progress:', progress)
      })

      if (response.success) {
        setAvatarUrl(response.fileUrl)
        message.success('Avatar uploaded successfully')
      }
    } catch (error) {
      message.error('Failed to upload avatar')
    }
    
    return false // Prevent default upload behavior
  }

  const uploadProps = {
    beforeUpload: handleAvatarUpload,
    showUploadList: false,
    accept: 'image/*',
  }

  return (
    <Modal
      title="User Profile"
      open={visible}
      onCancel={onClose}
      width={600}
      footer={null}
      destroyOnClose
    >
      <div style={{ padding: '16px 0' }}>
        {/* Profile Header */}
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <Avatar
              size={100}
              src={avatarUrl}
              icon={<UserOutlined />}
              style={{ border: '3px solid #f0f0f0' }}
            />
            {isEditing && (
              <Upload {...uploadProps}>
                <Button
                  type="primary"
                  shape="circle"
                  icon={<CameraOutlined />}
                  size="small"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                  }}
                />
              </Upload>
            )}
          </div>
          
          <Title level={3} style={{ marginTop: 16, marginBottom: 8 }}>
            {user?.firstName} {user?.lastName}
          </Title>
          
          <Space>
            <Tag color="blue">{user?.role}</Tag>
            <Tag color="green">{user?.status}</Tag>
          </Space>
        </div>

        <Divider />

        {/* Profile Content */}
        {!isEditing ? (
          // View Mode
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4}>Profile Information</Title>
              <Button
                type="primary"
                icon={<EditOutlined />}
                onClick={handleEdit}
              >
                Edit Profile
              </Button>
            </div>

            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Email">
                {user?.email}
              </Descriptions.Item>
              <Descriptions.Item label="Phone">
                {user?.phone || 'Not provided'}
              </Descriptions.Item>
              <Descriptions.Item label="Department">
                {user?.department || 'Not specified'}
              </Descriptions.Item>
              <Descriptions.Item label="Title">
                {user?.title || 'Not specified'}
              </Descriptions.Item>
              <Descriptions.Item label="Last Login">
                {user?.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never'}
              </Descriptions.Item>
              <Descriptions.Item label="Account Created">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Unknown'}
              </Descriptions.Item>
            </Descriptions>
          </div>
        ) : (
          // Edit Mode
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <Title level={4}>Edit Profile</Title>
              <Space>
                <Button
                  icon={<CloseOutlined />}
                  onClick={handleCancel}
                >
                  Cancel
                </Button>
                <Button
                  type="primary"
                  icon={<SaveOutlined />}
                  loading={loading}
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              </Space>
            </div>

            <Form
              form={form}
              layout="vertical"
              requiredMark={false}
            >
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="First Name"
                    name="firstName"
                    rules={[{ required: true, message: 'Please enter your first name' }]}
                  >
                    <Input placeholder="Enter first name" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Last Name"
                    name="lastName"
                    rules={[{ required: true, message: 'Please enter your last name' }]}
                  >
                    <Input placeholder="Enter last name" />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item
                label="Email"
                name="email"
                rules={[
                  { required: true, message: 'Please enter your email' },
                  { type: 'email', message: 'Please enter a valid email' }
                ]}
              >
                <Input placeholder="Enter email address" />
              </Form.Item>

              <Form.Item
                label="Phone"
                name="phone"
              >
                <Input placeholder="Enter phone number" />
              </Form.Item>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    label="Department"
                    name="department"
                  >
                    <Input placeholder="Enter department" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Job Title"
                    name="title"
                  >
                    <Input placeholder="Enter job title" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default UserProfileModal 