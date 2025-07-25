import React, { useState } from 'react'
import { Form, Input, Button, Typography, Space, Divider, message } from 'antd'
import { UserOutlined, LockOutlined, EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

const { Title, Text } = Typography

const LoginPage = () => {
  const { login } = useAuth()
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values) => {
    setLoading(true)
    try {
      const result = await login(values)
      if (!result.success) {
        message.error(result.message || 'Login failed')
      }
    } catch (error) {
      message.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <Title level={3} style={{ marginBottom: 8 }}>
          Welcome Back
        </Title>
        <Text type="secondary">
          Sign in to your account to continue
        </Text>
      </div>

      <Form
        form={form}
        name="login"
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
            prefix={<UserOutlined />}
            placeholder="Enter your email"
            autoComplete="email"
          />
        </Form.Item>

        <Form.Item
          name="password"
          label="Password"
          rules={[
            { required: true, message: 'Please enter your password' },
            { min: 6, message: 'Password must be at least 6 characters' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined />}
            placeholder="Enter your password"
            autoComplete="current-password"
            iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
          />
        </Form.Item>

        <Form.Item style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              {/* We can add remember me checkbox here if needed */}
            </Form.Item>
            <Link to="/reset-password">
              <Text type="secondary">Forgot password?</Text>
            </Link>
          </div>
        </Form.Item>

        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            block
            style={{ height: 48 }}
          >
            Sign In
          </Button>
        </Form.Item>
      </Form>

      <Divider>
        <Text type="secondary">New to our platform?</Text>
      </Divider>

      <div style={{ textAlign: 'center' }}>
        <Space direction="vertical" size="small">
          <Text type="secondary">
            Don't have an account?{' '}
            <Link to="/register">
              <strong>Create Account</strong>
            </Link>
          </Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            By signing in, you agree to our Terms of Service and Privacy Policy
          </Text>
        </Space>
      </div>
    </div>
  )
}

export default LoginPage 