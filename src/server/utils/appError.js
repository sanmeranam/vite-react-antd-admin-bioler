/**
 * Custom error class for operational errors
 * Used to create errors with specific status codes and messages
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true
    
    Error.captureStackTrace(this, this.constructor)
  }
}

module.exports = AppError 