import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { dashboardAPI } from '../services/api'
import { getSocket } from '../services/socketService'

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([])
  const queryClient = useQueryClient()

  // Fetch notifications from API
  const { data: notificationsData, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => dashboardAPI.getNotifications({ limit: 50 }),
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => dashboardAPI.markNotificationRead(notificationId),
    onSuccess: (_, notificationId) => {
      setNotifications(prev =>
        prev.map(notification =>
          notification.id === notificationId
            ? { ...notification, read: true }
            : notification
        )
      )
      queryClient.invalidateQueries(['notifications'])
    },
  })

  // Mark all notifications as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: () => dashboardAPI.markAllNotificationsRead(),
    onSuccess: () => {
      setNotifications(prev =>
        prev.map(notification => ({ ...notification, read: true }))
      )
      queryClient.invalidateQueries(['notifications'])
    },
  })

  // Update notifications when data changes
  useEffect(() => {
    if (notificationsData?.notifications) {
      setNotifications(notificationsData.notifications)
    }
  }, [notificationsData])

  // Set up real-time notifications via socket
  useEffect(() => {
    const socket = getSocket()
    
    if (socket) {
      const handleNewNotification = (notification) => {
        setNotifications(prev => [notification, ...prev])
        
        // Show browser notification if permission granted
        if (Notification.permission === 'granted') {
          new Notification(notification.title, {
            body: notification.message,
            icon: '/favicon.ico',
            tag: notification.id,
          })
        }
      }

      const handleNotificationUpdate = (updatedNotification) => {
        setNotifications(prev =>
          prev.map(notification =>
            notification.id === updatedNotification.id
              ? updatedNotification
              : notification
          )
        )
      }

      socket.on('notification:new', handleNewNotification)
      socket.on('notification:updated', handleNotificationUpdate)

      return () => {
        socket.off('notification:new', handleNewNotification)
        socket.off('notification:updated', handleNotificationUpdate)
      }
    }
  }, [])

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const markAsRead = useCallback((notificationId) => {
    markAsReadMutation.mutate(notificationId)
  }, [markAsReadMutation])

  const markAllAsRead = useCallback(() => {
    markAllAsReadMutation.mutate()
  }, [markAllAsReadMutation])

  const unreadCount = notifications.filter(notification => !notification.read).length

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    isMarkingAsRead: markAsReadMutation.isLoading,
    isMarkingAllAsRead: markAllAsReadMutation.isLoading,
  }
} 