import React, { useState, useEffect } from 'react'
import { notification } from 'antd'
import { getSocket } from '../../services/socketService'
import { useAuth } from '../../contexts/AuthContext'

const NotificationCenter = () => {
  const { user } = useAuth()
  const [api, contextHolder] = notification.useNotification()

  useEffect(() => {
    const socket = getSocket()
    
    if (socket && user) {
      // System-wide notifications
      const handleSystemNotification = (data) => {
        api.info({
          message: data.title || 'System Notification',
          description: data.message,
          duration: data.duration || 4.5,
          placement: 'topRight',
        })
      }

      // Success notifications
      const handleSuccessNotification = (data) => {
        api.success({
          message: data.title || 'Success',
          description: data.message,
          duration: data.duration || 4.5,
          placement: 'topRight',
        })
      }

      // Warning notifications
      const handleWarningNotification = (data) => {
        api.warning({
          message: data.title || 'Warning',
          description: data.message,
          duration: data.duration || 6,
          placement: 'topRight',
        })
      }

      // Error notifications
      const handleErrorNotification = (data) => {
        api.error({
          message: data.title || 'Error',
          description: data.message,
          duration: data.duration || 8,
          placement: 'topRight',
        })
      }

      // Real-time data update notifications
      const handleDataUpdateNotification = (data) => {
        api.info({
          message: 'Data Updated',
          description: `${data.entity} has been updated`,
          duration: 3,
          placement: 'bottomRight',
        })
      }

      // User session notifications
      const handleSessionNotification = (data) => {
        if (data.type === 'warning') {
          api.warning({
            message: 'Session Warning',
            description: data.message,
            duration: 0, // Don't auto-close
            placement: 'topRight',
          })
        } else if (data.type === 'expired') {
          api.error({
            message: 'Session Expired',
            description: 'Your session has expired. Please log in again.',
            duration: 0,
            placement: 'topRight',
          })
        }
      }

      // Activity notifications (for audit trail)
      const handleActivityNotification = (data) => {
        if (data.showToUser) {
          api.info({
            message: 'Activity Update',
            description: data.message,
            duration: 3,
            placement: 'bottomLeft',
          })
        }
      }

      // Maintenance notifications
      const handleMaintenanceNotification = (data) => {
        api.warning({
          message: 'Maintenance Notice',
          description: data.message,
          duration: 0, // Keep visible until dismissed
          placement: 'top',
        })
      }

      // Security alerts
      const handleSecurityAlert = (data) => {
        api.error({
          message: 'Security Alert',
          description: data.message,
          duration: 0,
          placement: 'topRight',
        })
      }

      // Socket event listeners
      socket.on('notification:system', handleSystemNotification)
      socket.on('notification:success', handleSuccessNotification)
      socket.on('notification:warning', handleWarningNotification)
      socket.on('notification:error', handleErrorNotification)
      socket.on('notification:data-update', handleDataUpdateNotification)
      socket.on('notification:session', handleSessionNotification)
      socket.on('notification:activity', handleActivityNotification)
      socket.on('notification:maintenance', handleMaintenanceNotification)
      socket.on('notification:security', handleSecurityAlert)

      return () => {
        socket.off('notification:system', handleSystemNotification)
        socket.off('notification:success', handleSuccessNotification)
        socket.off('notification:warning', handleWarningNotification)
        socket.off('notification:error', handleErrorNotification)
        socket.off('notification:data-update', handleDataUpdateNotification)
        socket.off('notification:session', handleSessionNotification)
        socket.off('notification:activity', handleActivityNotification)
        socket.off('notification:maintenance', handleMaintenanceNotification)
        socket.off('notification:security', handleSecurityAlert)
      }
    }
  }, [user, api])

  return contextHolder
}

export default NotificationCenter 