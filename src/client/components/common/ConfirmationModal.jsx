import React, { useState } from 'react'
import { Modal, Button, Typography, Space, Input, Checkbox, Alert } from 'antd'
import {
  ExclamationCircleOutlined,
  DeleteOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  StopOutlined
} from '@ant-design/icons'

const { Text, Title } = Typography
const { TextArea } = Input

const ConfirmationModal = ({
  visible,
  onConfirm,
  onCancel,
  title,
  content,
  type = 'warning', // warning, danger, info, success
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  loading = false,
  
  // Advanced options
  requireConfirmation = false,
  confirmationText = '',
  requireReason = false,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Please provide a reason...',
  
  // Destructive action options
  destructive = false,
  itemName = '',
  itemType = 'item',
  
  // Custom validation
  validator,
  validationMessage,
  
  // Additional options
  width = 420,
  centered = true,
  maskClosable = false,
  autoFocusButton = 'cancel',
  
  // Callbacks
  onBeforeConfirm,
  onAfterConfirm,
  onAfterCancel,
  
  ...modalProps
}) => {
  const [confirmationValue, setConfirmationValue] = useState('')
  const [reason, setReason] = useState('')
  const [acknowledged, setAcknowledged] = useState(false)
  const [validationError, setValidationError] = useState('')

  // Reset state when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      setConfirmationValue('')
      setReason('')
      setAcknowledged(false)
      setValidationError('')
    }
  }, [visible])

  // Icon mapping
  const iconMap = {
    warning: <ExclamationCircleOutlined style={{ color: '#faad14' }} />,
    danger: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
    delete: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
    info: <InfoCircleOutlined style={{ color: '#1890ff' }} />,
    success: <CheckCircleOutlined style={{ color: '#52c41a' }} />,
    stop: <StopOutlined style={{ color: '#ff4d4f' }} />
  }

  // Color mapping
  const colorMap = {
    warning: '#faad14',
    danger: '#ff4d4f',
    delete: '#ff4d4f',
    info: '#1890ff',
    success: '#52c41a',
    stop: '#ff4d4f'
  }

  // Validation logic
  const validateForm = () => {
    // Custom validation
    if (validator) {
      const result = validator({ confirmationValue, reason, acknowledged })
      if (result !== true) {
        setValidationError(result || validationMessage || 'Validation failed')
        return false
      }
    }

    // Required confirmation text
    if (requireConfirmation && confirmationValue !== confirmationText) {
      setValidationError(`Please type "${confirmationText}" to confirm`)
      return false
    }

    // Required reason
    if (requireReason && !reason.trim()) {
      setValidationError('Reason is required')
      return false
    }

    // Destructive action acknowledgment
    if (destructive && !acknowledged) {
      setValidationError('Please acknowledge the consequences of this action')
      return false
    }

    setValidationError('')
    return true
  }

  // Handle confirm
  const handleConfirm = async () => {
    if (!validateForm()) return

    try {
      if (onBeforeConfirm) {
        const shouldContinue = await onBeforeConfirm({ 
          confirmationValue, 
          reason, 
          acknowledged 
        })
        if (shouldContinue === false) return
      }

      await onConfirm({ 
        confirmationValue, 
        reason: reason.trim(), 
        acknowledged 
      })

      if (onAfterConfirm) {
        onAfterConfirm()
      }
    } catch (error) {
      console.error('Confirmation error:', error)
      // You might want to show an error message here
    }
  }

  // Handle cancel
  const handleCancel = () => {
    onCancel()
    if (onAfterCancel) {
      onAfterCancel()
    }
  }

  // Check if confirm button should be disabled
  const isConfirmDisabled = () => {
    if (loading) return true
    
    if (requireConfirmation && confirmationValue !== confirmationText) return true
    if (requireReason && !reason.trim()) return true
    if (destructive && !acknowledged) return true
    
    return false
  }

  // Generate title
  const getTitle = () => {
    if (title) return title
    
    if (destructive) {
      return `Delete ${itemName || itemType}`
    }
    
    const titleMap = {
      warning: 'Confirm Action',
      danger: 'Dangerous Action',
      delete: 'Delete Confirmation',
      info: 'Information',
      success: 'Confirm Success',
      stop: 'Stop Action'
    }
    
    return titleMap[type] || 'Confirmation'
  }

  // Generate content
  const getContent = () => {
    if (content) return content
    
    if (destructive && itemName) {
      return `Are you sure you want to delete "${itemName}"? This action cannot be undone.`
    }
    
    return 'Are you sure you want to proceed with this action?'
  }

  return (
    <Modal
      title={
        <Space>
          {iconMap[type]}
          <Title level={4} style={{ margin: 0, color: colorMap[type] }}>
            {getTitle()}
          </Title>
        </Space>
      }
      open={visible}
      onCancel={handleCancel}
      width={width}
      centered={centered}
      maskClosable={maskClosable}
      destroyOnClose
      footer={[
        <Button 
          key="cancel" 
          onClick={handleCancel}
          autoFocus={autoFocusButton === 'cancel'}
        >
          {cancelText}
        </Button>,
        <Button
          key="confirm"
          type={type === 'danger' || type === 'delete' ? 'primary' : 'primary'}
          danger={type === 'danger' || type === 'delete' || destructive}
          loading={loading}
          onClick={handleConfirm}
          disabled={isConfirmDisabled()}
          autoFocus={autoFocusButton === 'confirm'}
        >
          {confirmText}
        </Button>
      ]}
      {...modalProps}
    >
      <div style={{ paddingTop: 16 }}>
        {/* Main content */}
        <Text style={{ fontSize: 16, lineHeight: 1.6 }}>
          {getContent()}
        </Text>

        {/* Warning for destructive actions */}
        {destructive && (
          <Alert
            message="This action is irreversible"
            description="Once deleted, this data cannot be recovered. Please make sure you have backups if needed."
            type="warning"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}

        {/* Confirmation text input */}
        {requireConfirmation && (
          <div style={{ marginTop: 16 }}>
            <Text strong>
              Type <Text code>{confirmationText}</Text> to confirm:
            </Text>
            <Input
              value={confirmationValue}
              onChange={(e) => setConfirmationValue(e.target.value)}
              placeholder={`Type "${confirmationText}" here`}
              style={{ marginTop: 8 }}
              status={validationError && confirmationValue !== confirmationText ? 'error' : ''}
            />
          </div>
        )}

        {/* Reason input */}
        {requireReason && (
          <div style={{ marginTop: 16 }}>
            <Text strong>{reasonLabel}:</Text>
            <TextArea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={reasonPlaceholder}
              rows={3}
              style={{ marginTop: 8 }}
              status={validationError && !reason.trim() ? 'error' : ''}
            />
          </div>
        )}

        {/* Acknowledgment checkbox */}
        {destructive && (
          <div style={{ marginTop: 16 }}>
            <Checkbox
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
            >
              I understand the consequences of this action and want to proceed
            </Checkbox>
          </div>
        )}

        {/* Validation error */}
        {validationError && (
          <Alert
            message={validationError}
            type="error"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </div>
    </Modal>
  )
}

// Utility function to show confirmation modal
export const showConfirmationModal = (config) => {
  return new Promise((resolve, reject) => {
    const modal = Modal.confirm({
      ...config,
      onOk: (close) => {
        resolve(true)
        close()
      },
      onCancel: () => {
        resolve(false)
      }
    })
  })
}

// Quick confirmation utilities
export const confirmDelete = (itemName, itemType = 'item') => {
  return showConfirmationModal({
    title: `Delete ${itemType}`,
    content: `Are you sure you want to delete "${itemName}"? This action cannot be undone.`,
    type: 'danger',
    confirmText: 'Delete',
    destructive: true
  })
}

export const confirmAction = (action, description) => {
  return showConfirmationModal({
    title: `Confirm ${action}`,
    content: description,
    type: 'warning',
    confirmText: action
  })
}

export const confirmDestructive = (config) => {
  return showConfirmationModal({
    ...config,
    type: 'danger',
    destructive: true,
    requireConfirmation: true,
    confirmationText: 'DELETE'
  })
}

export default ConfirmationModal 