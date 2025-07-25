# Utilities Documentation

## Logger (Pino)

This project uses [Pino](https://getpino.io/) for high-performance structured logging.

### Configuration

The logger is configured in `utils/logger.js` with different settings for development and production:

#### Development
- Pretty-printed, colorized output
- Includes timestamp in readable format
- Log level: `debug` (default)
- Context-aware formatting

#### Production
- JSON structured output
- Optimized for log aggregation
- Log level: `info` (default)
- Machine-readable format

### Environment Variables

Set the `LOG_LEVEL` environment variable to control logging verbosity:

```bash
# Available levels: fatal, error, warn, info, debug, trace
LOG_LEVEL=debug
```

### Usage

Import context-specific loggers from the logger utility:

```javascript
const { 
  serverLogger, 
  dbLogger, 
  authLogger, 
  socketLogger, 
  errorLogger,
  httpLogger 
} = require('../utils/logger')

// Basic logging
serverLogger.info('Server started successfully')
dbLogger.error({ err: error }, 'Database connection failed')

// Structured logging with context
authLogger.info({
  userId: user.id,
  email: user.email,
  action: 'login'
}, 'User logged in')
```

### Context Loggers

The following pre-configured context loggers are available:

- `serverLogger` - Server startup, shutdown, general server events
- `dbLogger` - Database connections, queries, seeding
- `authLogger` - Authentication, authorization events
- `socketLogger` - WebSocket connections and events
- `errorLogger` - Error handling and exceptions
- `httpLogger` - HTTP request/response logging (via pino-http)

### HTTP Request Logging

HTTP requests are automatically logged using `pino-http` with custom log levels:

- `info` - Successful requests (2xx)
- `warn` - Client errors (4xx)
- `error` - Server errors (5xx)
- `silent` - Redirects (3xx)

### Log Format

#### Development
```
[2024-01-15 10:30:45] INFO [DATABASE]: ✅ MongoDB connected successfully
```

#### Production
```json
{
  "level": "INFO",
  "time": "2024-01-15T10:30:45.123Z",
  "pid": 12345,
  "hostname": "server-01",
  "env": "production",
  "context": "DATABASE",
  "msg": "✅ MongoDB connected successfully"
}
```

### Best Practices

1. **Use structured logging**: Include relevant data as objects
2. **Choose appropriate log levels**: 
   - `fatal` - Application cannot continue
   - `error` - Error conditions
   - `warn` - Warning conditions
   - `info` - General informational messages
   - `debug` - Debug-level messages
   - `trace` - Very detailed debug information

3. **Include context**: Use context-specific loggers for better filtering
4. **Avoid sensitive data**: Don't log passwords, tokens, or PII
5. **Use child loggers**: Create child loggers for specific operations

### Performance

Pino is designed for high performance:
- Asynchronous logging
- JSON serialization
- Minimal overhead
- Built for high-throughput applications

## Database Connection

The database utility provides robust connection handling with retry logic and proper error handling.

### Features

- Automatic retry on connection failure
- Health check endpoint
- Graceful shutdown handling
- Database seeding for development
- Connection event monitoring

### Usage

```javascript
const dbConnection = require('./utils/database')

// Connect to database
await dbConnection.connect()

// Health check
const health = await dbConnection.healthCheck()

// Graceful disconnect
await dbConnection.disconnect()
``` 