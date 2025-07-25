import React from 'react'
import {
  Card,
  Typography,
  Button,
  Space,
  Breadcrumb,
  Row,
  Col,
  Tag,
  Dropdown,
  Tooltip,
  Divider,
  BackTop,
  FloatButton
} from 'antd'
import {
  ArrowLeftOutlined,
  MoreOutlined,
  ReloadOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
  FullscreenOutlined,
  VerticalAlignTopOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTheme } from '../../contexts/ThemeContext'
import './PageWrapper.css'

const { Title, Text, Paragraph } = Typography

const PageWrapper = ({
  title,
  subtitle,
  description,
  children,
  loading = false,
  
  // Header configuration
  showBackButton = false,
  backPath,
  onBack,
  
  // Breadcrumb
  breadcrumb,
  showBreadcrumb = false,
  
  // Actions
  actions = [],
  primaryAction,
  
  // Page metadata
  tags = [],
  status,
  lastUpdated,
  
  // Layout options
  className,
  contentClassName,
  headerStyle,
  contentStyle,
  padding = 24,
  maxWidth,
  centered = false,
  
  // Additional features
  showSettings = false,
  showHelp = false,
  showFullscreen = false,
  onSettings,
  onHelp,
  onFullscreen,
  
  // Custom components
  extra,
  headerExtra,
  footerExtra,
  
  ...cardProps
}) => {
  const navigate = useNavigate()
  const location = useLocation()
  const { currentTheme } = useTheme()

  // Handle back navigation
  const handleBack = () => {
    if (onBack) {
      onBack()
    } else if (backPath) {
      navigate(backPath)
    } else {
      navigate(-1)
    }
  }

  // Generate breadcrumb from current path if not provided
  const generateBreadcrumb = () => {
    if (breadcrumb) return breadcrumb

    const pathSegments = location.pathname.split('/').filter(Boolean)
    return pathSegments.map((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/')
      const title = segment.charAt(0).toUpperCase() + segment.slice(1)
      
      return {
        title: index === pathSegments.length - 1 ? title : (
          <a onClick={() => navigate(path)}>{title}</a>
        ),
        key: path
      }
    })
  }

  // Additional actions menu
  const additionalActions = []
  
  if (showSettings && onSettings) {
    additionalActions.push({
      key: 'settings',
      label: 'Settings',
      icon: <SettingOutlined />,
      onClick: onSettings
    })
  }
  
  if (showHelp && onHelp) {
    additionalActions.push({
      key: 'help',
      label: 'Help',
      icon: <QuestionCircleOutlined />,
      onClick: onHelp
    })
  }
  
  if (showFullscreen && onFullscreen) {
    additionalActions.push({
      key: 'fullscreen',
      label: 'Fullscreen',
      icon: <FullscreenOutlined />,
      onClick: onFullscreen
    })
  }

  // Render page header
  const renderHeader = () => (
    <div className="page-wrapper-header" style={headerStyle}>
      {/* Breadcrumb */}
      {showBreadcrumb && (
        <Breadcrumb
          items={generateBreadcrumb()}
          style={{ marginBottom: 16 }}
        />
      )}

      <Row justify="space-between" align="top">
        <Col flex="auto">
          <div className="page-wrapper-title-section">
            {/* Back Button */}
            {showBackButton && (
              <Button
                type="text"
                icon={<ArrowLeftOutlined />}
                onClick={handleBack}
                style={{ marginRight: 12, marginTop: 4 }}
              />
            )}

            <div className="page-wrapper-title-content">
              {/* Main Title */}
              <div className="page-wrapper-title-row">
                <Title 
                  level={1} 
                  style={{ margin: 0, fontSize: 28, fontWeight: 600 }}
                >
                  {title}
                </Title>
                
                {/* Status and Tags */}
                {(status || tags.length > 0) && (
                  <Space style={{ marginLeft: 16 }}>
                    {status && (
                      <Tag color={status.color || 'default'} style={{ margin: 0 }}>
                        {status.text || status}
                      </Tag>
                    )}
                    {tags.map((tag, index) => (
                      <Tag key={index} color={tag.color}>
                        {tag.text || tag}
                      </Tag>
                    ))}
                  </Space>
                )}
              </div>

              {/* Subtitle */}
              {subtitle && (
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: 16, 
                    display: 'block', 
                    marginTop: 4,
                    marginBottom: description ? 8 : 0
                  }}
                >
                  {subtitle}
                </Text>
              )}

              {/* Description */}
              {description && (
                <Paragraph 
                  type="secondary" 
                  style={{ 
                    marginBottom: 0,
                    marginTop: 8,
                    maxWidth: 600
                  }}
                >
                  {description}
                </Paragraph>
              )}

              {/* Last Updated */}
              {lastUpdated && (
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: 12, 
                    display: 'block', 
                    marginTop: 8 
                  }}
                >
                  Last updated: {lastUpdated}
                </Text>
              )}
            </div>
          </div>
        </Col>

        {/* Actions */}
        <Col flex="none">
          <Space size="small">
            {/* Custom header extra content */}
            {headerExtra}

            {/* Primary Action */}
            {primaryAction && (
              <Button
                type="primary"
                size="default"
                icon={primaryAction.icon}
                loading={primaryAction.loading}
                onClick={primaryAction.onClick}
                disabled={primaryAction.disabled}
              >
                {primaryAction.label}
              </Button>
            )}

            {/* Regular Actions */}
            {actions.slice(0, 3).map((action, index) => (
              <Button
                key={index}
                type={action.type || 'default'}
                size="default"
                icon={action.icon}
                loading={action.loading}
                onClick={action.onClick}
                disabled={action.disabled}
                danger={action.danger}
              >
                {action.label}
              </Button>
            ))}

            {/* More Actions Dropdown */}
            {(actions.length > 3 || additionalActions.length > 0) && (
              <Dropdown
                menu={{
                  items: [
                    ...actions.slice(3).map((action, index) => ({
                      key: index + 3,
                      label: action.label,
                      icon: action.icon,
                      disabled: action.disabled,
                      danger: action.danger,
                      onClick: action.onClick
                    })),
                    ...(actions.length > 3 && additionalActions.length > 0 ? [{ type: 'divider' }] : []),
                    ...additionalActions
                  ]
                }}
                trigger={['click']}
              >
                <Button size="large" icon={<MoreOutlined />} />
              </Dropdown>
            )}

            {/* Extra content */}
            {extra}
          </Space>
        </Col>
      </Row>
    </div>
  )

  const wrapperClassName = [
    'page-wrapper',
    centered && 'page-wrapper-centered',
    currentTheme === 'dark' && 'dark',
    className
  ].filter(Boolean).join(' ')

  const contentWrapperStyle = {
    maxWidth: maxWidth || (centered ? 1200 : '100%'),
    margin: centered ? '0 auto' : undefined,
    ...contentStyle
  }

  return (
    <div className={wrapperClassName}>
      {/* Header outside the card */}
      <div className="page-wrapper-header-outside" style={{ padding: `0 ${padding}px ${padding}px`, ...headerStyle }}>
        {renderHeader()}
      </div>

      <Card
        loading={loading}
        bordered={false}
        className="page-wrapper-card"
        bodyStyle={{
          padding: 0,
          ...contentWrapperStyle
        }}
        {...cardProps}
      >
        {/* Content */}
        <div 
          className={`page-wrapper-content ${contentClassName || ''}`}
          style={{ 
            padding: `${padding}px`,
            minHeight: 400
          }}
        >
          {children}
        </div>

        {/* Footer Extra */}
        {footerExtra && (
          <>
            <Divider style={{ margin: '24px 0' }} />
            <div style={{ padding: `0 ${padding}px ${padding}px` }}>
              {footerExtra}
            </div>
          </>
        )}
      </Card>

      {/* Floating Action Buttons */}
      <FloatButton.Group
        trigger="hover"
        type="primary"
        style={{ right: 24 }}
        icon={<MoreOutlined />}
      >
        <BackTop>
          <FloatButton 
            icon={<VerticalAlignTopOutlined />} 
            tooltip="Back to top"
          />
        </BackTop>
        
        {onSettings && (
          <FloatButton 
            icon={<SettingOutlined />} 
            tooltip="Settings"
            onClick={onSettings}
          />
        )}
        
        {onHelp && (
          <FloatButton 
            icon={<QuestionCircleOutlined />} 
            tooltip="Help"
            onClick={onHelp}
          />
        )}
      </FloatButton.Group>
    </div>
  )
}

// Utility component for quick page creation
export const SimplePage = ({ title, children, ...props }) => (
  <PageWrapper title={title} showBreadcrumb={false} {...props}>
    {children}
  </PageWrapper>
)

// Component for dashboard-style pages
export const DashboardPage = ({ title, subtitle, widgets, ...props }) => (
  <PageWrapper
    title={title}
    subtitle={subtitle}
    padding={16}
    {...props}
  >
    <Row gutter={[16, 16]}>
      {widgets?.map((widget, index) => (
        <Col key={index} {...widget.col}>
          {widget.component}
        </Col>
      ))}
    </Row>
  </PageWrapper>
)

// Component for form pages
export const FormPage = ({ 
  title, 
  subtitle, 
  children, 
  onSave, 
  onCancel, 
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  saving = false,
  ...props 
}) => (
  <PageWrapper
    title={title}
    subtitle={subtitle}
    maxWidth={800}
    centered
    actions={[
      {
        label: cancelLabel,
        onClick: onCancel
      }
    ]}
    primaryAction={onSave && {
      label: saveLabel,
      loading: saving,
      onClick: onSave
    }}
    {...props}
  >
    {children}
  </PageWrapper>
)

export default PageWrapper 