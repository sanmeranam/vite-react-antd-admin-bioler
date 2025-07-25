/**
 * Catch async errors and pass them to the error handling middleware
 * This eliminates the need for try-catch blocks in async route handlers
 */
module.exports = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
} 