const dotenv = require('dotenv')

// Load environment variables
dotenv.config()

// Import logger
const { serverLogger, errorLogger } = require('./utils/logger')

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  errorLogger.fatal({ err }, 'UNCAUGHT EXCEPTION! 💥 Shutting down...')
  process.exit(1)
})

const http = require('http')
const socketIo = require('socket.io')
const app = require('./app')
const dbConnection = require('./utils/database')

// Connect to database
const startServer = async () => {
  try {
    // Connect to MongoDB
    await dbConnection.connect()
    
    // Seed database in development
    if (process.env.NODE_ENV === 'development') {
      await dbConnection.seedDatabase()
    }
    
    // Create HTTP server
    const server = http.createServer(app)
    
    // Setup Socket.io
    const io = socketIo(server, {
      cors: {
        origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true
      },
      transports: ['websocket', 'polling']
    })
    
    // Socket.io middleware for authentication
    io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          return next(new Error('Authentication error'))
        }
        
        const jwt = require('jsonwebtoken')
        const { promisify } = require('util')
        const User = require('./models/User')
        
        // Verify token
        const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
        const user = await User.findById(decoded.id)
        
        if (!user) {
          return next(new Error('User not found'))
        }
        
        socket.userId = user._id.toString()
        socket.tenantId = user.tenantId.toString()
        socket.user = user
        
        next()
      } catch (error) {
        next(new Error('Authentication error'))
      }
    })
    
    // Socket.io connection handling
    io.on('connection', (socket) => {
      const { socketLogger } = require('./utils/logger')
      socketLogger.info({ 
        userId: socket.userId, 
        email: socket.user.email, 
        socketId: socket.id 
      }, '🔌 User connected')
      
      // Join user-specific room
      socket.join(`user:${socket.userId}`)
      
      // Join tenant-specific room
      socket.join(`tenant:${socket.tenantId}`)
      
      // Handle user-specific events
      socket.on('join:user', (userId) => {
        if (userId === socket.userId) {
          socket.join(`user:${userId}`)
        }
      })
      
      // Handle tenant-specific events
      socket.on('join:tenant', (tenantId) => {
        if (tenantId === socket.tenantId) {
          socket.join(`tenant:${tenantId}`)
        }
      })
      
      // Handle custom room joining
      socket.on('join:room', (roomId) => {
        socket.join(roomId)
        socket.emit('room:joined', roomId)
      })
      
      socket.on('leave:room', (roomId) => {
        socket.leave(roomId)
        socket.emit('room:left', roomId)
      })
      
      // Handle real-time notifications
      socket.on('notification:send', (data) => {
        // Send notification to specific user
        if (data.targetUserId) {
          socket.to(`user:${data.targetUserId}`).emit('notification:new', data)
        }
      })
      
      // Handle typing indicators
      socket.on('typing:start', (roomId) => {
        socket.to(roomId).emit('typing:start', {
          userId: socket.userId,
          userName: socket.user.firstName + ' ' + socket.user.lastName
        })
      })
      
      socket.on('typing:stop', (roomId) => {
        socket.to(roomId).emit('typing:stop', {
          userId: socket.userId
        })
      })
      
      // Handle disconnection
      socket.on('disconnect', (reason) => {
        socketLogger.info({ 
          userId: socket.userId, 
          email: socket.user.email, 
          reason 
        }, '🔌 User disconnected')
      })
    })
    
    // Make io available to other parts of the application
    app.set('socketio', io)
    
    // Start server
    const port = process.env.PORT || 5000
    const serverInstance = server.listen(port, () => {
      serverLogger.info({
        port,
        environment: process.env.NODE_ENV,
        frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000'
      }, '🚀 Server started successfully')
    })
    
    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      errorLogger.fatal({ err }, 'UNHANDLED REJECTION! 💥 Shutting down...')
      serverInstance.close(() => {
        process.exit(1)
      })
    })
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
      serverLogger.info('👋 SIGTERM RECEIVED. Shutting down gracefully')
      serverInstance.close(() => {
        serverLogger.info('💥 Process terminated!')
      })
    })
    
  } catch (error) {
    errorLogger.fatal({ err: error }, '❌ Server startup failed')
    process.exit(1)
  }
}

// Start the server
startServer()