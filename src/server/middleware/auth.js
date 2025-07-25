const jwt = require('jsonwebtoken')
const { promisify } = require('util')
const User = require('../models/User')
const Tenant = require('../models/Tenant')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')

// Tenant resolution middleware
exports.resolveTenant = catchAsync(async (req, res, next) => {
  let tenant = null
  
  // Try to get tenant from various sources
  const tenantSlug = req.headers['x-tenant-slug'] || req.params.tenantSlug || req.body.tenantSlug
  const host = req.get('host')
  
  if (tenantSlug) {
    tenant = await Tenant.findOne({ slug: tenantSlug })
  } else if (host) {
    // Try to find by custom domain
    tenant = await Tenant.findOne({ domain: host })
  }
  
  // Fall back to default tenant if none found
  if (!tenant) {
    tenant = await Tenant.findOne({ slug: 'default' })
  }
  
  if (!tenant) {
    return next(new AppError('No tenant found', 400))
  }
  
  // Check if tenant is active
  if (!tenant.subscriptionActive) {
    return next(new AppError('Tenant subscription is not active', 403))
  }
  
  // Attach tenant to request
  req.tenant = tenant
  next()
})

// Authentication middleware
exports.authenticate = catchAsync(async (req, res, next) => {
  // Get token from header or cookie
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt
  }
  
  if (!token) {
    return next(new AppError('You are not logged in! Please log in to get access.', 401))
  }
  
  // Verify token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
  
  // Check if user still exists
  const currentUser = await User.findById(decoded.id)
  if (!currentUser) {
    return next(new AppError('The user belonging to this token does no longer exist.', 401))
  }
  
  // Check if user changed password after the token was issued
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(new AppError('User recently changed password! Please log in again.', 401))
  }
  
  // Check if user is active
  if (currentUser.status !== 'active') {
    return next(new AppError('Your account is not active', 401))
  }
  
  // Check if user belongs to the current tenant
  if (req.tenant && !currentUser.tenantId.equals(req.tenant._id)) {
    return next(new AppError('Access denied for this tenant', 403))
  }
  
  // Update last activity
  currentUser.lastActivity = Date.now()
  await currentUser.save({ validateBeforeSave: false })
  
  // Grant access to protected route
  req.user = currentUser
  next()
})

// Optional authentication (doesn't fail if no token)
exports.optionalAuth = catchAsync(async (req, res, next) => {
  let token
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt
  }
  
  if (token && token !== 'loggedout') {
    try {
      const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
      const currentUser = await User.findById(decoded.id)
      
      if (currentUser && 
          !currentUser.changedPasswordAfter(decoded.iat) &&
          currentUser.status === 'active') {
        req.user = currentUser
      }
    } catch (err) {
      // Ignore token errors for optional auth
    }
  }
  
  next()
})

// Role-based authorization
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You are not logged in', 401))
    }
    
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403))
    }
    
    next()
  }
}

// Permission-based authorization
exports.requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You are not logged in', 401))
    }
    
    if (!req.user.hasPermission(permission)) {
      return next(new AppError(`You do not have permission: ${permission}`, 403))
    }
    
    next()
  }
}

// Multiple permissions (user must have ALL)
exports.requirePermissions = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You are not logged in', 401))
    }
    
    for (const permission of permissions) {
      if (!req.user.hasPermission(permission)) {
        return next(new AppError(`You do not have permission: ${permission}`, 403))
      }
    }
    
    next()
  }
}

// At least one permission (user must have ANY)
exports.requireAnyPermission = (...permissions) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You are not logged in', 401))
    }
    
    const hasAnyPermission = permissions.some(permission => req.user.hasPermission(permission))
    
    if (!hasAnyPermission) {
      return next(new AppError(`You do not have any of the required permissions: ${permissions.join(', ')}`, 403))
    }
    
    next()
  }
}

// Own resource access (user can only access their own data)
exports.restrictToOwn = (userIdField = 'userId') => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AppError('You are not logged in', 401))
    }
    
    // Admins can access any resource
    if (req.user.role === 'admin') {
      return next()
    }
    
    // Get user ID from request (params, body, or query)
    const resourceUserId = req.params[userIdField] || req.body[userIdField] || req.query[userIdField]
    
    if (resourceUserId && resourceUserId !== req.user._id.toString()) {
      return next(new AppError('You can only access your own data', 403))
    }
    
    // If no user ID specified, add current user's ID to the request
    if (!resourceUserId) {
      req.params[userIdField] = req.user._id.toString()
      req.body[userIdField] = req.user._id
      req.query[userIdField] = req.user._id.toString()
    }
    
    next()
  }
}

// Tenant isolation middleware (ensures all queries are scoped to tenant)
exports.ensureTenantScope = (req, res, next) => {
  if (!req.tenant) {
    return next(new AppError('Tenant context required', 400))
  }
  
  // Add tenant filter to query parameters
  if (!req.query.tenantId) {
    req.query.tenantId = req.tenant._id
  }
  
  // Add tenant to body for create/update operations
  if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
    if (!req.body.tenantId) {
      req.body.tenantId = req.tenant._id
    }
  }
  
  next()
}

// Check if user has access to specific tenant
exports.checkTenantAccess = catchAsync(async (req, res, next) => {
  const tenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId
  
  if (!tenantId) {
    return next(new AppError('Tenant ID required', 400))
  }
  
  // Admins can access any tenant
  if (req.user.role === 'admin') {
    return next()
  }
  
  // Check if user belongs to the tenant
  if (!req.user.tenantId.equals(tenantId)) {
    return next(new AppError('Access denied for this tenant', 403))
  }
  
  next()
})

// Rate limiting per user
exports.userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map()
  
  return (req, res, next) => {
    if (!req.user) {
      return next()
    }
    
    const userId = req.user._id.toString()
    const now = Date.now()
    const windowStart = now - windowMs
    
    // Clean up old entries
    if (requests.has(userId)) {
      const userRequests = requests.get(userId).filter(time => time > windowStart)
      requests.set(userId, userRequests)
    } else {
      requests.set(userId, [])
    }
    
    const userRequests = requests.get(userId)
    
    if (userRequests.length >= maxRequests) {
      return next(new AppError('Too many requests, please try again later', 429))
    }
    
    userRequests.push(now)
    next()
  }
}

// Check feature access for tenant
exports.requireFeature = (feature) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return next(new AppError('Tenant context required', 400))
    }
    
    if (!req.tenant.hasFeature(feature)) {
      return next(new AppError(`Feature '${feature}' is not available for your plan`, 403))
    }
    
    next()
  }
}

// Check usage limits
exports.checkUsageLimit = (resource) => {
  return (req, res, next) => {
    if (!req.tenant) {
      return next(new AppError('Tenant context required', 400))
    }
    
    if (!req.tenant.checkUsageLimit(resource)) {
      return next(new AppError(`${resource} limit exceeded for your plan`, 403))
    }
    
    next()
  }
}

// Audit logging middleware
exports.auditLog = (action) => {
  return (req, res, next) => {
    // Store audit information for later logging
    req.auditData = {
      action,
      userId: req.user?._id,
      tenantId: req.tenant?._id,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date()
    }
    
    next()
  }
} 