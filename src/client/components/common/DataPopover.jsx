import React, { useState } from 'react'
import {
  Popover,
  Card,
  Typography,
  Space,
  Tag,
  Avatar,
  Button,
  Divider,
  Row,
  Col,
  Descriptions,
  Image,
  Tooltip,
  Badge,
  Progress,
  Statistic
} from 'antd'
import {
  EyeOutlined,
  EditOutlined,
  CopyOutlined,
  ShareAltOutlined,
  MoreOutlined,
  UserOutlined,
  CalendarOutlined,
  TagOutlined,
  LinkOutlined
} from '@ant-design/icons'
import { motion } from 'framer-motion'
import './DataPopover.css'

const { Title, Text, Paragraph } = Typography

const DataPopover = ({
  children,
  data,
  title,
  headerData,
  bodyData,
  actions = [],
  
  // Display options
  showHeader = true,
  showBody = true,
  showActions = false,
  maxWidth = 400,
  
  // Header configuration
  headerConfig = {},
  
  // Trigger configuration
  trigger = 'hover',
  placement = 'top',
  
  // Content customization
  renderHeader,
  renderBody,
  renderFooter,
  
  // Interaction
  onVisibleChange,
  
  // Loading state
  loading = false,
  
  ...popoverProps
}) => {
  const [visible, setVisible] = useState(false)

  const defaultHeaderConfig = {
    showAvatar: true,
    showTitle: true,
    showSubtitle: true,
    showStatus: true,
    showTags: true,
    avatarSize: 48
  }

  const finalHeaderConfig = { ...defaultHeaderConfig, ...headerConfig }

  const handleVisibleChange = (newVisible) => {
    setVisible(newVisible)
    if (onVisibleChange) {
      onVisibleChange(newVisible)
    }
  }

  // Default header renderer
  const defaultRenderHeader = () => {
    if (!data) return null

    return (
      <div className="data-popover-header">
        <Row gutter={12} align="middle">
          {/* Avatar */}
          {finalHeaderConfig.showAvatar && (data.avatar || data.icon) && (
            <Col>
              <Avatar
                size={finalHeaderConfig.avatarSize}
                src={data.avatar}
                icon={data.icon || <UserOutlined />}
                style={{ backgroundColor: data.avatarColor }}
              />
            </Col>
          )}

          {/* Title and Details */}
          <Col flex="auto">
            {/* Title */}
            {finalHeaderConfig.showTitle && (data.title || data.name) && (
              <Title level={5} style={{ margin: 0, marginBottom: 4 }}>
                {data.title || data.name}
              </Title>
            )}

            {/* Subtitle */}
            {finalHeaderConfig.showSubtitle && data.subtitle && (
              <Text type="secondary" style={{ display: 'block', fontSize: 12 }}>
                {data.subtitle}
              </Text>
            )}

            {/* Status */}
            {finalHeaderConfig.showStatus && data.status && (
              <Badge
                status={data.statusType || 'default'}
                text={data.status}
                style={{ marginTop: 4 }}
              />
            )}
          </Col>

          {/* Status Indicator */}
          {data.online !== undefined && (
            <Col>
              <Badge
                status={data.online ? 'success' : 'default'}
                text={data.online ? 'Online' : 'Offline'}
              />
            </Col>
          )}
        </Row>

        {/* Tags */}
        {finalHeaderConfig.showTags && data.tags && data.tags.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Space size={4} wrap>
              {data.tags.slice(0, 3).map((tag, index) => (
                <Tag
                  key={index}
                  size="small"
                  color={tag.color}
                  icon={tag.icon}
                >
                  {tag.label || tag}
                </Tag>
              ))}
              {data.tags.length > 3 && (
                <Tag size="small">+{data.tags.length - 3} more</Tag>
              )}
            </Space>
          </div>
        )}

        {/* Header Data */}
        {headerData && (
          <div style={{ marginTop: 8 }}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              {Object.entries(headerData).map(([key, value]) => (
                <Row key={key} justify="space-between">
                  <Col>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {key}:
                    </Text>
                  </Col>
                  <Col>
                    <Text style={{ fontSize: 12 }}>{value}</Text>
                  </Col>
                </Row>
              ))}
            </Space>
          </div>
        )}
      </div>
    )
  }

  // Default body renderer
  const defaultRenderBody = () => {
    if (!bodyData && !data) return null

    const displayData = bodyData || data

    // Handle different data types
    if (Array.isArray(displayData)) {
      return (
        <div className="data-popover-body">
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            {displayData.map((item, index) => (
              <div key={index} className="data-popover-list-item">
                {typeof item === 'object' ? (
                  <Row justify="space-between">
                    <Col>
                      <Text>{item.label || item.name}</Text>
                    </Col>
                    <Col>
                      <Text type="secondary">{item.value}</Text>
                    </Col>
                  </Row>
                ) : (
                  <Text>{item}</Text>
                )}
              </div>
            ))}
          </Space>
        </div>
      )
    }

    if (typeof displayData === 'object') {
      // Special handling for specific data types
      if (displayData.description) {
        return (
          <div className="data-popover-body">
            <Paragraph
              style={{ margin: 0, fontSize: 13 }}
              ellipsis={{ rows: 3, expandable: true, symbol: 'more' }}
            >
              {displayData.description}
            </Paragraph>
          </div>
        )
      }

      // Statistics display
      if (displayData.stats) {
        return (
          <div className="data-popover-body">
            <Row gutter={16}>
              {Object.entries(displayData.stats).map(([key, value]) => (
                <Col span={12} key={key}>
                  <Statistic
                    title={key}
                    value={value}
                    valueStyle={{ fontSize: 16 }}
                  />
                </Col>
              ))}
            </Row>
          </div>
        )
      }

      // Progress display
      if (displayData.progress !== undefined) {
        return (
          <div className="data-popover-body">
            <Progress
              percent={displayData.progress}
              status={displayData.progressStatus}
              size="small"
            />
            {displayData.progressText && (
              <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                {displayData.progressText}
              </Text>
            )}
          </div>
        )
      }

      // General object display
      return (
        <div className="data-popover-body">
          <Descriptions size="small" column={1} colon={false}>
            {Object.entries(displayData)
              .filter(([key]) => !['title', 'name', 'avatar', 'icon', 'status', 'tags'].includes(key))
              .slice(0, 8) // Limit to prevent overflow
              .map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </Descriptions.Item>
              ))}
          </Descriptions>
        </div>
      )
    }

    // Simple text display
    return (
      <div className="data-popover-body">
        <Text>{String(displayData)}</Text>
      </div>
    )
  }

  // Render actions
  const renderActions = () => {
    if (!showActions || actions.length === 0) return null

    return (
      <div className="data-popover-actions">
        <Space size={4}>
          {actions.slice(0, 4).map((action, index) => (
            <Tooltip key={index} title={action.tooltip}>
              <Button
                type="text"
                size="small"
                icon={action.icon}
                onClick={action.onClick}
                disabled={action.disabled}
              >
                {action.label}
              </Button>
            </Tooltip>
          ))}
          {actions.length > 4 && (
            <Button type="text" size="small" icon={<MoreOutlined />} />
          )}
        </Space>
      </div>
    )
  }

  // Compose content
  const content = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className="data-popover-content"
      style={{ maxWidth }}
    >
      {/* Header */}
      {showHeader && (
        <>
          {renderHeader ? renderHeader(data) : defaultRenderHeader()}
          {(showBody || showActions) && <Divider style={{ margin: '12px 0' }} />}
        </>
      )}

      {/* Body */}
      {showBody && (
        <>
          {renderBody ? renderBody(data) : defaultRenderBody()}
          {showActions && <Divider style={{ margin: '12px 0' }} />}
        </>
      )}

      {/* Actions */}
      {renderActions()}

      {/* Footer */}
      {renderFooter && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          {renderFooter(data)}
        </>
      )}
    </motion.div>
  )

  return (
    <Popover
      content={content}
      title={title}
      trigger={trigger}
      placement={placement}
      open={visible}
      onOpenChange={handleVisibleChange}
      overlayClassName="data-popover-overlay"
      {...popoverProps}
    >
      {children}
    </Popover>
  )
}

// Quick data popover utilities
export const UserPopover = ({ user, children, ...props }) => (
  <DataPopover
    data={user}
    headerConfig={{
      showAvatar: true,
      showTitle: true,
      showSubtitle: true,
      showStatus: true
    }}
    bodyData={{
      Email: user?.email,
      Role: user?.role,
      Department: user?.department,
      'Last Seen': user?.lastSeen
    }}
    actions={[
      {
        icon: <EyeOutlined />,
        tooltip: 'View Profile',
        onClick: () => console.log('View profile', user)
      },
      {
        icon: <EditOutlined />,
        tooltip: 'Edit User',
        onClick: () => console.log('Edit user', user)
      }
    ]}
    {...props}
  >
    {children}
  </DataPopover>
)

export const ItemPopover = ({ item, children, ...props }) => (
  <DataPopover
    data={item}
    showActions
    actions={[
      {
        icon: <EyeOutlined />,
        tooltip: 'View Details',
        onClick: () => console.log('View item', item)
      },
      {
        icon: <CopyOutlined />,
        tooltip: 'Copy',
        onClick: () => console.log('Copy item', item)
      },
      {
        icon: <ShareAltOutlined />,
        tooltip: 'Share',
        onClick: () => console.log('Share item', item)
      }
    ]}
    {...props}
  >
    {children}
  </DataPopover>
)

export const QuickInfoPopover = ({ title, info, children, ...props }) => (
  <DataPopover
    title={title}
    showHeader={false}
    bodyData={info}
    maxWidth={300}
    {...props}
  >
    {children}
  </DataPopover>
)

export default DataPopover 