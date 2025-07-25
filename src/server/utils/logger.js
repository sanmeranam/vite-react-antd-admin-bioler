const pino = require('pino')

// Create logger configuration based on environment
const createLogger = () => {
  const isDevelopment = process.env.NODE_ENV === 'development'
  
  const baseConfig = {
    level: process.env.LOG_LEVEL || (isDevelopment ? 'debug' : 'info'),
    base: {
      pid: process.pid,
      hostname: require('os').hostname(),
      env: process.env.NODE_ENV || 'development'
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() }
      }
    }
  }

  // Development configuration with pretty printing
  if (isDevelopment) {
    return pino({
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
          messageFormat: '\x1b[36m[{context}]\x1b[0m {msg}',
          customColors: 'info:blue,warn:yellow,error:red,debug:green'
        }
      }
    })
  }

  // Production configuration with JSON output
  return pino(baseConfig)
}

// Create the logger instance
const logger = createLogger()

// Create child loggers for different contexts
const createContextLogger = (context) => {
  return logger.child({ context })
}

// Export logger and utilities
module.exports = {
  logger,
  createContextLogger,
  
  // Specific context loggers
  authLogger: createContextLogger('AUTH'),
  dbLogger: createContextLogger('DATABASE'),
  serverLogger: createContextLogger('SERVER'),
  socketLogger: createContextLogger('SOCKET'),
  errorLogger: createContextLogger('ERROR'),
  httpLogger: createContextLogger('HTTP')
} 