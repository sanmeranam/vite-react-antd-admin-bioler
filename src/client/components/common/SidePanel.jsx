import React, { useState, useEffect } from 'react'
import {
  Drawer,
  Card,
  Tabs,
  Button,
  Typography,
  Space,
  Divider,
  Row,
  Col,
  Tag,
  Avatar,
  Progress,
  Descriptions,
  Empty,
  Spin,
  Badge,
  Tooltip,
  Dropdown
} from 'antd'
import {
  CloseOutlined,
  ExpandAltOutlined,
  MoreOutlined,
  EditOutlined,
  ShareAltOutlined,
  PrinterOutlined,
  CopyOutlined,
  ExportOutlined
} from '@ant-design/icons'
import { motion, AnimatePresence } from 'framer-motion'
import './SidePanel.css'

const { Title, Text, Paragraph } = Typography
const { TabPane } = Tabs

const SidePanel = ({
  visible,
  onClose,
  title,
  subtitle,
  width = 600,
  placement = 'right',
  loading = false,
  data,
  headerConfig,
  tabs = [],
  actions = [],
  onExpand,
  expandable = true,
  className,
  bodyStyle,
  headerStyle,
  maskClosable = true,
  destroyOnClose = false,
  zIndex = 1000,
  children,
  ...drawerProps
}) => {
  const [activeTab, setActiveTab] = useState(tabs.length > 0 ? tabs[0].key : '')
  const [headerHeight, setHeaderHeight] = useState(200)

  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].key)
    }
  }, [tabs, activeTab])

  // Default header configuration
  const defaultHeaderConfig = {
    showAvatar: true,
    showProgress: false,
    showStats: true,
    showTags: true,
    height: '30%' // 30% of panel height as specified
  }

  const finalHeaderConfig = { ...defaultHeaderConfig, ...headerConfig }

  // Header actions dropdown
  const headerActions = [
    {
      key: 'edit',
      label: 'Edit',
      icon: <EditOutlined />,
      onClick: () => actions.find(a => a.key === 'edit')?.onClick?.(data)
    },
    {
      key: 'share',
      label: 'Share',
      icon: <ShareAltOutlined />,
      onClick: () => actions.find(a => a.key === 'share')?.onClick?.(data)
    },
    {
      key: 'export',
      label: 'Export',
      icon: <ExportOutlined />,
      onClick: () => actions.find(a => a.key === 'export')?.onClick?.(data)
    },
    {
      key: 'print',
      label: 'Print',
      icon: <PrinterOutlined />,
      onClick: () => window.print()
    },
    {
      key: 'copy',
      label: 'Copy Link',
      icon: <CopyOutlined />,
      onClick: () => {
        navigator.clipboard.writeText(window.location.href)
        message.success('Link copied to clipboard')
      }
    }
  ]

  // Filter actions that are provided
  const availableActions = headerActions.filter(action => 
    actions.some(a => a.key === action.key)
  )

  // Render header content
  const renderHeader = () => {
    if (!data) return null

    return (
      <div 
        className="side-panel-header"
        style={{ 
          height: finalHeaderConfig.height,
          ...headerStyle 
        }}
      >
        <div className="side-panel-header-content">
          {/* Primary Info */}
          <div className="side-panel-primary-info">
            {finalHeaderConfig.showAvatar && data.avatar && (
              <Avatar
                size={64}
                src={data.avatar}
                icon={data.avatarIcon}
                style={{ marginBottom: 16 }}
              />
            )}
            
            <Title level={3} style={{ marginBottom: 8 }}>
              {title || data.title || data.name}
            </Title>
            
            {subtitle && (
              <Text type="secondary" style={{ fontSize: 16, display: 'block', marginBottom: 16 }}>
                {subtitle}
              </Text>
            )}

            {/* Tags */}
            {finalHeaderConfig.showTags && data.tags && (
              <Space wrap style={{ marginBottom: 16 }}>
                {data.tags.map((tag, index) => (
                  <Tag key={index} color={tag.color}>
                    {tag.label}
                  </Tag>
                ))}
              </Space>
            )}

            {/* Status Badge */}
            {data.status && (
              <Badge
                status={data.statusType || 'default'}
                text={data.status}
                style={{ marginBottom: 16 }}
              />
            )}
          </div>

          {/* Progress */}
          {finalHeaderConfig.showProgress && data.progress !== undefined && (
            <div style={{ marginBottom: 16 }}>
              <Text strong>Progress</Text>
              <Progress
                percent={data.progress}
                status={data.progressStatus}
                style={{ marginTop: 4 }}
              />
            </div>
          )}

          {/* Stats */}
          {finalHeaderConfig.showStats && data.stats && (
            <Row gutter={16} style={{ marginTop: 16 }}>
              {data.stats.map((stat, index) => (
                <Col span={8} key={index}>
                  <div className="side-panel-stat">
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {stat.label}
                    </Text>
                    <div style={{ fontSize: 20, fontWeight: 'bold', color: stat.color }}>
                      {stat.value}
                    </div>
                  </div>
                </Col>
              ))}
            </Row>
          )}

          {/* Additional header data */}
          {data.headerData && (
            <Descriptions size="small" column={1} style={{ marginTop: 16 }}>
              {Object.entries(data.headerData).map(([key, value]) => (
                <Descriptions.Item key={key} label={key}>
                  {value}
                </Descriptions.Item>
              ))}
            </Descriptions>
          )}
        </div>
      </div>
    )
  }

  // Render tab content
  const renderTabContent = (tab) => {
    if (tab.component) {
      return React.createElement(tab.component, { data, ...tab.props })
    }

    if (tab.render) {
      return tab.render(data)
    }

    if (tab.content) {
      return tab.content
    }

    return <Empty description={`No content for ${tab.label}`} />
  }

  // Handle expand action
  const handleExpand = () => {
    if (onExpand) {
      onExpand(data)
    }
  }

  return (
    <Drawer
      title={
        <div className="side-panel-title-bar">
          <div className="side-panel-title">
            <Title level={4} style={{ margin: 0 }}>
              {title || 'Details'}
            </Title>
            {subtitle && (
              <Text type="secondary">{subtitle}</Text>
            )}
          </div>
          
          <Space>
            {/* Custom Actions */}
            {actions.length > 0 && (
              <Dropdown
                menu={{
                  items: availableActions.map(action => ({
                    key: action.key,
                    label: action.label,
                    icon: action.icon,
                    onClick: action.onClick
                  }))
                }}
                trigger={['click']}
              >
                <Button type="text" icon={<MoreOutlined />} />
              </Dropdown>
            )}

            {/* Expand Button */}
            {expandable && (
              <Tooltip title="Expand to full page">
                <Button
                  type="text"
                  icon={<ExpandAltOutlined />}
                  onClick={handleExpand}
                />
              </Tooltip>
            )}

            {/* Close Button */}
            <Button
              type="text"
              icon={<CloseOutlined />}
              onClick={onClose}
            />
          </Space>
        </div>
      }
      width={width}
      placement={placement}
      onClose={onClose}
      open={visible}
      className={`side-panel ${className || ''}`}
      bodyStyle={{
        padding: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...bodyStyle
      }}
      maskClosable={maskClosable}
      destroyOnClose={destroyOnClose}
      zIndex={zIndex}
      {...drawerProps}
    >
      <Spin spinning={loading}>
        <div className="side-panel-content">
          {/* Header Section (30%) */}
          {renderHeader()}

          <Divider style={{ margin: 0 }} />

          {/* Body Section with Tabs (70%) */}
          <div className="side-panel-body">
            {tabs.length > 0 ? (
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                className="side-panel-tabs"
                size="small"
                style={{ height: '100%' }}
                tabBarStyle={{ paddingLeft: 24, paddingRight: 24 }}
              >
                {tabs.map(tab => (
                  <TabPane
                    tab={
                      <span>
                        {tab.icon && <span style={{ marginRight: 8 }}>{tab.icon}</span>}
                        {tab.label}
                        {tab.badge && (
                          <Badge
                            count={tab.badge}
                            size="small"
                            style={{ marginLeft: 8 }}
                          />
                        )}
                      </span>
                    }
                    key={tab.key}
                  >
                    <div 
                      className="side-panel-tab-content"
                      style={{ 
                        padding: 24,
                        height: 'calc(100% - 46px)',
                        overflow: 'auto'
                      }}
                    >
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={tab.key}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.2 }}
                        >
                          {renderTabContent(tab)}
                        </motion.div>
                      </AnimatePresence>
                    </div>
                  </TabPane>
                ))}
              </Tabs>
            ) : (
              <div style={{ padding: 24, height: '100%', overflow: 'auto' }}>
                {children || <Empty description="No content available" />}
              </div>
            )}
          </div>
        </div>
      </Spin>
    </Drawer>
  )
}

// Pre-built tab components
export const DetailsTab = ({ data }) => (
  <div>
    {data ? (
      <Descriptions column={1} size="small">
        {Object.entries(data).map(([key, value]) => (
          <Descriptions.Item key={key} label={key}>
            {typeof value === 'object' ? JSON.stringify(value) : value}
          </Descriptions.Item>
        ))}
      </Descriptions>
    ) : (
      <Empty description="No details available" />
    )}
  </div>
)

export const ActivityTab = ({ data }) => (
  <div>
    {data?.activities ? (
      <div className="activity-timeline">
        {data.activities.map((activity, index) => (
          <div key={index} className="activity-item">
            <div className="activity-meta">
              <Text type="secondary">{activity.timestamp}</Text>
            </div>
            <div className="activity-content">
              <Text strong>{activity.action}</Text>
              <Paragraph>{activity.description}</Paragraph>
            </div>
          </div>
        ))}
      </div>
    ) : (
      <Empty description="No activity found" />
    )}
  </div>
)

export const NotesTab = ({ data, onAddNote }) => (
  <div>
    {data?.notes ? (
      <div className="notes-list">
        {data.notes.map((note, index) => (
          <Card key={index} size="small" style={{ marginBottom: 16 }}>
            <Paragraph>{note.content}</Paragraph>
            <Text type="secondary">
              by {note.author} on {note.createdAt}
            </Text>
          </Card>
        ))}
      </div>
    ) : (
      <Empty description="No notes found" />
    )}
  </div>
)

export default SidePanel 