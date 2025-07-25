const AppError = require('../utils/appError')
const { errorLogger } = require('../utils/logger')

/**
 * Handle MongoDB cast errors (invalid ObjectId)
 */
const handleCastErrorDB = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`
  return new AppError(message, 400)
}

/**
 * Handle MongoDB duplicate field errors
 */
const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg?.match(/(["'])(\\?.)*?\1/)?.[0]
  const message = `Duplicate field value: ${value}. Please use another value!`
  return new AppError(message, 400)
}

/**
 * Handle MongoDB validation errors
 */
const handleValidationErrorDB = (err) => {
  const errors = Object.values(err.errors).map(el => el.message)
  const message = `Invalid input data. ${errors.join('. ')}`
  return new AppError(message, 400)
}

/**
 * Handle JWT errors
 */
const handleJWTError = () => 
  new AppError('Invalid token. Please log in again!', 401)

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401)

/**
 * Send error response in development
 */
const sendErrorDev = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    })
  }

  // B) RENDERED WEBSITE
  errorLogger.error({ 
    err, 
    url: req.originalUrl, 
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  }, 'Development error')
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: err.message
  })
}

/**
 * Send error response in production
 */
const sendErrorProd = (err, req, res) => {
  // A) API
  if (req.originalUrl.startsWith('/api')) {
    // A) Operational, trusted error: send message to client
    if (err.isOperational) {
      return res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      })
    }
    
    // B) Programming or other unknown error: don't leak error details
    // 1) Log error
    errorLogger.error({ 
      err, 
      url: req.originalUrl, 
      method: req.method,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      statusCode: err.statusCode
    }, 'Production API error')
    
    // 2) Send generic message
    return res.status(500).json({
      status: 'error',
      message: 'Something went wrong!'
    })
  }

  // B) RENDERED WEBSITE
  // A) Operational, trusted error: send message to client
  if (err.isOperational) {
    return res.status(err.statusCode).render('error', {
      title: 'Something went wrong!',
      msg: err.message
    })
  }
  
  // B) Programming or other unknown error: don't leak error details
  // 1) Log error
  errorLogger.error({ 
    err, 
    url: req.originalUrl, 
    method: req.method,
    userAgent: req.get('User-Agent'),
    ip: req.ip,
    statusCode: err.statusCode
  }, 'Production website error')
  
  // 2) Send generic message
  return res.status(err.statusCode).render('error', {
    title: 'Something went wrong!',
    msg: 'Please try again later.'
  })
}

/**
 * Global error handling middleware
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500
  err.status = err.status || 'error'

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, req, res)
  } else {
    let error = { ...err }
    error.message = err.message

    // MongoDB cast error
    if (error.name === 'CastError') error = handleCastErrorDB(error)
    
    // MongoDB duplicate field error
    if (error.code === 11000) error = handleDuplicateFieldsDB(error)
    
    // MongoDB validation error
    if (error.name === 'ValidationError') error = handleValidationErrorDB(error)
    
    // JWT error
    if (error.name === 'JsonWebTokenError') error = handleJWTError()
    
    // JWT expired error
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError()

    sendErrorProd(error, req, res)
  }
} 