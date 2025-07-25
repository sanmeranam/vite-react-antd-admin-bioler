import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react'
import {
  Table,
  Card,
  Button,
  Input,
  Select,
  Space,
  Dropdown,
  Modal,
  Tooltip,
  Checkbox,
  Tag,
  Typography,
  Row,
  Col,
  Drawer,
  Badge,
  Popover,
  message,
  DatePicker,
  InputNumber
} from 'antd'
import {
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  ExpandOutlined,
  CompressOutlined,
  ReloadOutlined,
  SettingOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ClearOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined
} from '@ant-design/icons'
import { exportAPI } from '../../services/api'
import './DataTable.css'

const { Search } = Input
const { Option } = Select
const { Text, Title } = Typography
const { RangePicker } = DatePicker

const DataTable = forwardRef((props, ref) => {
  const {
    columns = [],
    dataSource = [],
    loading = false,
    pagination = true,
    rowSelection: externalRowSelection,
    title,
    subtitle,
    actions = [],
    bulkActions = [],
    exportConfig,
    searchConfig,
    filterConfig,
    onRefresh,
    onRowClick,
    expandable,
    className,
    size = 'middle',
    scroll,
    bordered = true,
    showHeader = true,
    tableLayout,
    rowKey = 'id',
    ...tableProps
  } = props

  // State management
  const [selectedRowKeys, setSelectedRowKeys] = useState([])
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [filters, setFilters] = useState({})
  const [sortOrder, setSortOrder] = useState({})
  const [columnVisibility, setColumnVisibility] = useState({})
  const [quickViewData, setQuickViewData] = useState(null)
  const [quickViewVisible, setQuickViewVisible] = useState(false)
  const [advancedFiltersVisible, setAdvancedFiltersVisible] = useState(false)

  const tableRef = useRef()

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    clearSelection: () => setSelectedRowKeys([]),
    getSelectedRows: () => selectedRowKeys,
    exportData: handleExport,
    refresh: onRefresh,
    clearFilters: clearAllFilters
  }))

  // Row selection configuration
  const rowSelection = externalRowSelection || (bulkActions.length > 0 ? {
    selectedRowKeys,
    onChange: setSelectedRowKeys,
    onSelectAll: (selected, selectedRows, changeRows) => {
      console.log('Select all:', selected, selectedRows, changeRows)
    },
    onSelect: (record, selected, selectedRows, nativeEvent) => {
      console.log('Row select:', record, selected, selectedRows)
    },
    getCheckboxProps: (record) => ({
      disabled: record.disabled,
      name: record.name,
    }),
  } : undefined)

  // Enhanced columns with sorting and filtering
  const enhancedColumns = columns.map((col) => {
    const enhanced = { ...col }

    // Add search functionality
    if (col.searchable) {
      enhanced.filterDropdown = ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
        <div style={{ padding: 8 }}>
          <Input
            placeholder={`Search ${col.title}`}
            value={selectedKeys[0]}
            onChange={e => setSelectedKeys(e.target.value ? [e.target.value] : [])}
            onPressEnter={() => confirm()}
            style={{ marginBottom: 8, display: 'block' }}
          />
          <Space>
            <Button
              type="primary"
              onClick={() => confirm()}
              icon={<SearchOutlined />}
              size="small"
            >
              Search
            </Button>
            <Button
              onClick={() => clearFilters()}
              size="small"
            >
              Reset
            </Button>
          </Space>
        </div>
      )
      enhanced.filterIcon = (filtered) => (
        <SearchOutlined style={{ color: filtered ? '#1890ff' : undefined }} />
      )
    }

    // Add default sorting
    if (col.sortable) {
      enhanced.sorter = col.sorter || true
      enhanced.showSorterTooltip = false
    }

    // Add quick view functionality
    if (col.quickView) {
      const originalRender = enhanced.render
      enhanced.render = (text, record, index) => {
        const content = originalRender ? originalRender(text, record, index) : text
        return (
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => handleQuickView(record)}
          >
            {content}
          </div>
        )
      }
    }

    return enhanced
  })

  // Add actions column if actions are provided
  if (actions.length > 0) {
    enhancedColumns.push({
      title: 'Actions',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {actions.slice(0, 2).map((action, index) => (
            <Tooltip key={index} title={action.tooltip}>
              <Button
                type="text"
                size="small"
                icon={action.icon}
                onClick={(e) => {
                  e.stopPropagation()
                  action.onClick(record)
                }}
                disabled={action.disabled && action.disabled(record)}
              />
            </Tooltip>
          ))}
          {actions.length > 2 && (
            <Dropdown
              menu={{
                items: actions.slice(2).map((action, index) => ({
                  key: index + 2,
                  label: action.label,
                  icon: action.icon,
                  disabled: action.disabled && action.disabled(record),
                  onClick: () => action.onClick(record)
                }))
              }}
              trigger={['click']}
            >
              <Button type="text" size="small" icon={<MoreOutlined />} />
            </Dropdown>
          )}
        </Space>
      ),
    })
  }

  // Filter dataSource based on search and filters
  const filteredDataSource = dataSource.filter((item) => {
    // Apply search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase()
      const matchSearch = columns.some((col) => {
        if (col.searchable && col.dataIndex) {
          const value = item[col.dataIndex]
          return value && value.toString().toLowerCase().includes(searchLower)
        }
        return false
      })
      if (!matchSearch) return false
    }

    // Apply custom filters
    return Object.entries(filters).every(([key, value]) => {
      if (!value || value.length === 0) return true
      const itemValue = item[key]
      if (Array.isArray(value)) {
        return value.includes(itemValue)
      }
      return itemValue === value
    })
  })

  // Handle export functionality
  const handleExport = async (format = 'csv') => {
    try {
      const exportData = selectedRowKeys.length > 0
        ? filteredDataSource.filter(item => selectedRowKeys.includes(item[rowKey]))
        : filteredDataSource

      if (exportConfig && exportConfig.onExport) {
        await exportConfig.onExport(exportData, format)
      } else {
        // Default export logic
        const blob = await exportAPI.exportData('table', format, {
          data: exportData,
          columns: columns.filter(col => col.dataIndex),
          title: title || 'Data Export'
        })
        
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `${title || 'data'}_${new Date().toISOString().split('T')[0]}.${format}`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        window.URL.revokeObjectURL(url)
      }

      message.success(`Data exported as ${format.toUpperCase()}`)
    } catch (error) {
      message.error('Export failed')
      console.error('Export error:', error)
    }
  }

  // Handle quick view
  const handleQuickView = (record) => {
    setQuickViewData(record)
    setQuickViewVisible(true)
  }

  // Clear all filters
  const clearAllFilters = () => {
    setSearchText('')
    setFilters({})
    setSortOrder({})
  }

  // Bulk action handlers
  const handleBulkAction = (action) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select items first')
      return
    }

    Modal.confirm({
      title: action.confirmTitle || `${action.label} ${selectedRowKeys.length} items?`,
      content: action.confirmMessage || `Are you sure you want to ${action.label.toLowerCase()} the selected items?`,
      onOk: () => {
        const selectedRows = filteredDataSource.filter(item => 
          selectedRowKeys.includes(item[rowKey])
        )
        action.onClick(selectedRows, selectedRowKeys)
      }
    })
  }

  // Column visibility toggle
  const toggleColumnVisibility = (columnKey) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }))
  }

  // Visible columns based on visibility settings
  const visibleColumns = enhancedColumns.filter(col => 
    columnVisibility[col.key || col.dataIndex] !== false
  )

  // Toolbar component
  const TableToolbar = () => (
    <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
      <Col>
        <Space size="middle">
          {title && (
            <div>
              <Title level={4} style={{ margin: 0 }}>{title}</Title>
              {subtitle && <Text type="secondary">{subtitle}</Text>}
            </div>
          )}
          {selectedRowKeys.length > 0 && (
            <Tag color="blue">
              {selectedRowKeys.length} selected
            </Tag>
          )}
        </Space>
      </Col>
      
      <Col>
        <Space size="small">
          {/* Search */}
          {searchConfig !== false && (
            <Search
              placeholder="Search table..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: 200 }}
              allowClear
            />
          )}

          {/* Advanced Filters */}
          {filterConfig && filterConfig.length > 0 && (
            <Button
              icon={<FilterOutlined />}
              onClick={() => setAdvancedFiltersVisible(true)}
            >
              Filters
            </Button>
          )}

          {/* Bulk Actions */}
          {bulkActions.length > 0 && selectedRowKeys.length > 0 && (
            <Dropdown
              menu={{
                items: bulkActions.map((action, index) => ({
                  key: index,
                  label: action.label,
                  icon: action.icon,
                  onClick: () => handleBulkAction(action)
                }))
              }}
            >
              <Button>
                Bulk Actions <MoreOutlined />
              </Button>
            </Dropdown>
          )}

          {/* Export */}
          {exportConfig !== false && (
            <Dropdown
              menu={{
                items: [
                  { key: 'csv', label: 'Export as CSV', onClick: () => handleExport('csv') },
                  { key: 'excel', label: 'Export as Excel', onClick: () => handleExport('xlsx') },
                  { key: 'pdf', label: 'Export as PDF', onClick: () => handleExport('pdf') }
                ]
              }}
            >
              <Button icon={<DownloadOutlined />}>
                Export
              </Button>
            </Dropdown>
          )}

          {/* Refresh */}
          {onRefresh && (
            <Button
              icon={<ReloadOutlined />}
              onClick={onRefresh}
              loading={loading}
            >
              Refresh
            </Button>
          )}

          {/* Column Settings */}
          <Dropdown
            overlay={
              <div style={{ padding: 8, minWidth: 150 }}>
                {enhancedColumns.map(col => (
                  <div key={col.key || col.dataIndex} style={{ padding: '4px 0' }}>
                    <Checkbox
                      checked={columnVisibility[col.key || col.dataIndex] !== false}
                      onChange={() => toggleColumnVisibility(col.key || col.dataIndex)}
                    >
                      {col.title}
                    </Checkbox>
                  </div>
                ))}
              </div>
            }
            trigger={['click']}
          >
            <Button icon={<SettingOutlined />} />
          </Dropdown>

          {/* Fullscreen Toggle */}
          <Button
            icon={isFullscreen ? <CompressOutlined /> : <ExpandOutlined />}
            onClick={() => setIsFullscreen(!isFullscreen)}
          />

          {/* Clear Filters */}
          {(searchText || Object.keys(filters).length > 0) && (
            <Button
              icon={<ClearOutlined />}
              onClick={clearAllFilters}
            >
              Clear
            </Button>
          )}
        </Space>
      </Col>
    </Row>
  )

  const tableComponent = (
    <div className={`data-table-wrapper ${className || ''} ${isFullscreen ? 'fullscreen' : ''}`}>
      <Card 
        bordered={false}
        bodyStyle={{ padding: isFullscreen ? 24 : 16 }}
        className="data-table-card"
      >
        <TableToolbar />
        
        <Table
          ref={tableRef}
          columns={visibleColumns}
          dataSource={filteredDataSource}
          loading={loading}
          pagination={pagination ? {
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} items`,
            ...pagination
          } : false}
          rowSelection={rowSelection}
          onRow={(record) => ({
            onClick: () => onRowClick && onRowClick(record),
            style: { cursor: onRowClick ? 'pointer' : 'default' }
          })}
          size={size}
          scroll={scroll}
          bordered={bordered}
          showHeader={showHeader}
          tableLayout={tableLayout}
          rowKey={rowKey}
          expandable={expandable}
          {...tableProps}
        />
      </Card>

      {/* Advanced Filters Drawer */}
      <Drawer
        title="Advanced Filters"
        placement="right"
        onClose={() => setAdvancedFiltersVisible(false)}
        open={advancedFiltersVisible}
        width={320}
      >
        {filterConfig && filterConfig.map((filter, index) => (
          <div key={index} style={{ marginBottom: 16 }}>
            <Text strong>{filter.label}</Text>
            {filter.type === 'select' && (
              <Select
                style={{ width: '100%', marginTop: 8 }}
                placeholder={`Select ${filter.label}`}
                allowClear
                mode={filter.multiple ? 'multiple' : undefined}
                value={filters[filter.key]}
                onChange={(value) => setFilters(prev => ({ ...prev, [filter.key]: value }))}
              >
                {filter.options.map(option => (
                  <Option key={option.value} value={option.value}>
                    {option.label}
                  </Option>
                ))}
              </Select>
            )}
            {filter.type === 'date' && (
              <RangePicker
                style={{ width: '100%', marginTop: 8 }}
                value={filters[filter.key]}
                onChange={(dates) => setFilters(prev => ({ ...prev, [filter.key]: dates }))}
              />
            )}
            {filter.type === 'number' && (
              <InputNumber
                style={{ width: '100%', marginTop: 8 }}
                placeholder={`Enter ${filter.label}`}
                value={filters[filter.key]}
                onChange={(value) => setFilters(prev => ({ ...prev, [filter.key]: value }))}
              />
            )}
          </div>
        ))}
      </Drawer>

      {/* Quick View Modal */}
      <Modal
        title="Quick View"
        open={quickViewVisible}
        onCancel={() => setQuickViewVisible(false)}
        footer={null}
        width={600}
      >
        {quickViewData && (
          <div>
            {Object.entries(quickViewData).map(([key, value]) => (
              <Row key={key} style={{ marginBottom: 8 }}>
                <Col span={8}>
                  <Text strong>{key}:</Text>
                </Col>
                <Col span={16}>
                  <Text>{value}</Text>
                </Col>
              </Row>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )

  return isFullscreen ? (
    <div className="data-table-fullscreen-overlay">
      {tableComponent}
    </div>
  ) : tableComponent
})

DataTable.displayName = 'DataTable'

export default DataTable 