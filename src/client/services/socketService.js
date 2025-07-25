import { io } from 'socket.io-client'

let socket = null

export const initializeSocket = (userId, tenantId) => {
  if (socket) {
    disconnectSocket()
  }

  const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin
  
  socket = io(socketUrl, {
    auth: {
      token: localStorage.getItem('token'),
      userId,
      tenantId,
    },
    transports: ['websocket', 'polling'],
    timeout: 20000,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
    maxReconnectionAttempts: 5,
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
    
    // Join user-specific room
    socket.emit('join:user', userId)
    
    // Join tenant-specific room if tenantId exists
    if (tenantId) {
      socket.emit('join:tenant', tenantId)
    }
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error)
  })

  socket.on('reconnect', (attemptNumber) => {
    console.log('Socket reconnected after', attemptNumber, 'attempts')
  })

  socket.on('reconnect_error', (error) => {
    console.error('Socket reconnection error:', error)
  })

  socket.on('reconnect_failed', () => {
    console.error('Socket reconnection failed')
  })

  // Global event handlers
  socket.on('notification:new', (notification) => {
    console.log('New notification received:', notification)
  })

  socket.on('user:activity', (activity) => {
    console.log('User activity update:', activity)
  })

  socket.on('system:message', (message) => {
    console.log('System message:', message)
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = () => socket

export const emitEvent = (event, data) => {
  if (socket && socket.connected) {
    socket.emit(event, data)
  } else {
    console.warn('Socket not connected. Event not sent:', event)
  }
}

export const onEvent = (event, callback) => {
  if (socket) {
    socket.on(event, callback)
  }
}

export const offEvent = (event, callback) => {
  if (socket) {
    socket.off(event, callback)
  }
}

// Predefined events for common use cases
export const socketEvents = {
  // Notifications
  sendNotification: (notification) => emitEvent('notification:send', notification),
  broadcastNotification: (notification) => emitEvent('notification:broadcast', notification),
  
  // User Activity
  updateUserStatus: (status) => emitEvent('user:status', status),
  joinRoom: (roomId) => emitEvent('room:join', roomId),
  leaveRoom: (roomId) => emitEvent('room:leave', roomId),
  
  // Real-time Data Updates
  subscribeToUpdates: (dataType) => emitEvent('subscribe:updates', dataType),
  unsubscribeFromUpdates: (dataType) => emitEvent('unsubscribe:updates', dataType),
  
  // Chat/Messaging
  sendMessage: (message) => emitEvent('message:send', message),
  typingStart: (roomId) => emitEvent('typing:start', roomId),
  typingStop: (roomId) => emitEvent('typing:stop', roomId),
  
  // File Operations
  fileUploadProgress: (progress) => emitEvent('file:upload:progress', progress),
  fileProcessingUpdate: (update) => emitEvent('file:processing:update', update),
} 