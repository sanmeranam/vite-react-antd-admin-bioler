const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const pinoHttp = require('pino-http')
const path = require('path')

// Import logger
const { httpLogger } = require('./utils/logger')

// Import routes
const authRoutes = require('./routes/authRoutes')
const userRoutes = require('./routes/userRoutes')
const rbacRoutes = require('./routes/rbacRoutes')
const userController = require('./controllers/userController')
const { resolveTenant } = require('./middleware/auth')

// Import error handling
const AppError = require('./utils/appError')
const globalErrorHandler = require('./middleware/errorHandler')

const app = express()

// Trust proxy (important for deployment behind load balancers)
app.set('trust proxy', 1)

// SECURITY MIDDLEWARE
// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}))

// Enable CORS
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true)
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      process.env.FRONTEND_URL
    ].filter(Boolean)
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Slug']
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// Apply rate limiting to API routes only
app.use('/api', limiter)

// Compression middleware
app.use(compression())

// HTTP request logging middleware
app.use(pinoHttp({
  logger: httpLogger,
  customLogLevel: function (req, res, err) {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn'
    } else if (res.statusCode >= 500 || err) {
      return 'error'
    } else if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent'
    }
    return 'info'
  },
  customSuccessMessage: function (req, res) {
    if (res.statusCode === 404) {
      return 'resource not found'
    }
    return `${req.method} completed`
  },
  customErrorMessage: function (req, res, err) {
    return `${req.method} errored with status ${res.statusCode}`
  }
}))

// Body parsing middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Cookie parsing middleware
app.use(cookieParser())

// Serve static files from React app build
app.use(express.static(path.join(__dirname, '../client/dist')))

// HEALTH CHECK ENDPOINT
app.get('/api/health', async (req, res) => {
  try {
    const dbConnection = require('./utils/database')
    const dbHealth = await dbConnection.healthCheck()
    
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV,
      database: dbHealth,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      }
    })
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Health check failed',
      error: error.message
    })
  }
})

// API ROUTES
// Tenant resolution middleware for all API routes
app.use('/api', resolveTenant)

// Public routes (no auth required)
app.patch('/api/users/accept-invitation/:token', userController.acceptInvitation)

// Mount routes
app.use('/api/auth', authRoutes)
app.use('/api/users', userRoutes)
app.use('/api/rbac', rbacRoutes)

// API route not found handler
app.all('/api/*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404))
})

// Serve React app for all non-API routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'))
})

// GLOBAL ERROR HANDLING MIDDLEWARE
app.use(globalErrorHandler)

module.exports = app