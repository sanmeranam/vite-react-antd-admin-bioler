import React, { useState } from 'react'
import { Form, Input, Button, Typography, Space, Result } from 'antd'
import { MailOutlined, ArrowLeftOutlined } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const { Title, Text } = Typography

const ResetPasswordPage = () => {
  const { resetPassword } = useAuth()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const result = await resetPassword(values.email)
      if (result.success) {
        setEmailSent(true)
      }
    } catch (error) {
      console.error('Reset password error:', error)
    } finally {
      setLoading(false)
    }
  }

  if (emailSent) {
    return (
      <Result
        status="success"
        title="Check Your Email"
        subTitle="We've sent password reset instructions to your email address. Please check your inbox and follow the link to reset your password."
        extra={[
          <Button type="primary" key="login">
            <Link to="/login">
              <ArrowLeftOutlined /> Back to Login
            </Link>
          </Button>,
        ]}
      />
    )
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          Reset Password
        </Title>
        <Text type="secondary">
          Enter your email address and we'll send you a link to reset your password
        </Text>
      </div>

      <Form
        form={form}
        name="resetPassword"
        onFinish={handleSubmit}
        layout="vertical"
        size="large"
        requiredMark={false}
      >
        <Form.Item
          name="email"
          label="Email Address"
          rules={[
            { required: true, message: 'Please enter your email' },
            { type: 'email', message: 'Please enter a valid email address' }
          ]}
        >
          <Input
            prefix={<MailOutlined />}
            placeholder="Enter your email"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{ height: 48 }}
          >
            Send Reset Link
          </Button>
        </Form.Item>
      </Form>

      <div style={{ textAlign: 'center', marginTop: 24 }}>
        <Space direction="vertical" size="small">
          <Link to="/login">
            <ArrowLeftOutlined /> Back to Login
          </Link>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Remember your password?{' '}
            <Link to="/login">
              <strong>Sign In</strong>
            </Link>
          </Text>
        </Space>
      </div>
    </div>
  )
}

export default ResetPasswordPage 