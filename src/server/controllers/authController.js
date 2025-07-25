const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const { promisify } = require('util')
const User = require('../models/User')
const Tenant = require('../models/Tenant')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const sendEmail = require('../utils/email')

// JWT token generation
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  })
}

const signRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  })
}

// Send token response
const createSendToken = async (user, statusCode, req, res) => {
  const token = signToken(user._id)
  const refreshToken = signRefreshToken(user._id)
  
  // Add refresh token to user
  const deviceInfo = req.get('User-Agent') || 'Unknown Device'
  await user.addRefreshToken(refreshToken, deviceInfo)
  
  // Cookie options
  const cookieOptions = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  }
  
  // Set cookies
  res.cookie('jwt', token, cookieOptions)
  res.cookie('refreshToken', refreshToken, {
    ...cookieOptions,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  })
  
  // Remove password from output
  user.password = undefined
  user.refreshTokens = undefined
  
  // Get tenant information
  const tenant = await Tenant.findById(user.tenantId)
  
  // Get user permissions based on role
  const permissions = getUserPermissions(user.role)
  
  res.status(statusCode).json({
    success: true,
    token,
    refreshToken,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      preferences: user.preferences,
      lastLogin: user.lastLogin
    },
    tenant: tenant ? {
      id: tenant._id,
      name: tenant.name,
      companyName: tenant.companyName,
      productName: tenant.productName,
      productVersion: tenant.productVersion,
      branding: tenant.branding
    } : null,
    permissions
  })
}

// Get user permissions based on role
const getUserPermissions = (role) => {
  const rolePermissions = {
    admin: [
      'admin',
      'users.read', 'users.create', 'users.update', 'users.delete',
      'roles.read', 'roles.create', 'roles.update', 'roles.delete',
      'settings.read', 'settings.update',
      'analytics.read', 'analytics.export',
      'integrations.read', 'integrations.create', 'integrations.update', 'integrations.delete',
      'security.read', 'security.audit', 'security.sessions', 'security.policies',
      'dashboard.read', 'profile.read', 'profile.update'
    ],
    manager: [
      'users.read', 'users.create', 'users.update',
      'roles.read',
      'analytics.read',
      'integrations.read',
      'dashboard.read', 'profile.read', 'profile.update'
    ],
    user: [
      'dashboard.read', 'profile.read', 'profile.update'
    ],
    viewer: [
      'dashboard.read', 'profile.read'
    ]
  }
  
  return rolePermissions[role] || []
}

// Register new user
exports.register = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, password, confirmPassword, tenantSlug } = req.body
  
  // Validate password confirmation
  if (password !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400))
  }
  
  // Find tenant
  let tenant
  if (tenantSlug) {
    tenant = await Tenant.findOne({ slug: tenantSlug })
    if (!tenant) {
      return next(new AppError('Invalid tenant', 400))
    }
  } else {
    // For now, create a default tenant if none specified
    // In production, you might want to handle this differently
    tenant = await Tenant.findOne({ slug: 'default' })
    if (!tenant) {
      return next(new AppError('No tenant specified', 400))
    }
  }
  
  // Check if tenant allows user registration
  if (!tenant.settings.allowUserRegistration) {
    return next(new AppError('User registration is not allowed for this tenant', 403))
  }
  
  // Check user limit for tenant
  if (!tenant.checkUsageLimit('users')) {
    return next(new AppError('User limit reached for this tenant', 403))
  }
  
  // Check if user already exists
  const existingUser = await User.findByEmailAndTenant(email, tenant._id)
  if (existingUser) {
    return next(new AppError('User already exists with this email', 400))
  }
  
  // Create new user
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password,
    tenantId: tenant._id,
    status: tenant.settings.requireEmailVerification ? 'pending' : 'active'
  })
  
  // Increment tenant user count
  await tenant.incrementUsage('users')
  
  // Send email verification if required
  if (tenant.settings.requireEmailVerification) {
    const verifyToken = newUser.createEmailVerificationToken()
    await newUser.save({ validateBeforeSave: false })
    
    const verifyURL = `${req.protocol}://${req.get('host')}/api/auth/verify-email/${verifyToken}`
    
    try {
      await sendEmail({
        email: newUser.email,
        subject: 'Email Verification',
        message: `Please verify your email by clicking: ${verifyURL}`
      })
      
      res.status(201).json({
        success: true,
        message: 'User registered successfully. Please check your email to verify your account.'
      })
    } catch (err) {
      newUser.emailVerificationToken = undefined
      newUser.emailVerificationExpires = undefined
      await newUser.save({ validateBeforeSave: false })
      
      return next(new AppError('There was an error sending the email. Please try again later.', 500))
    }
  } else {
    // Auto-activate and log in
    createSendToken(newUser, 201, req, res)
  }
})

// Login user
exports.login = catchAsync(async (req, res, next) => {
  const { email, password, tenantSlug } = req.body
  
  // Check if email and password exist
  if (!email || !password) {
    return next(new AppError('Please provide email and password', 400))
  }
  
  // Find tenant
  let tenant
  if (tenantSlug) {
    tenant = await Tenant.findOne({ slug: tenantSlug })
  } else {
    // Try to infer tenant from domain
    const host = req.get('host')
    tenant = await Tenant.findOne({ domain: host })
    
    if (!tenant) {
      // Fall back to default tenant
      tenant = await Tenant.findOne({ slug: 'default' })
    }
  }
  
  if (!tenant) {
    return next(new AppError('Invalid tenant', 400))
  }
  
  // Check if tenant is active
  if (!tenant.subscriptionActive) {
    return next(new AppError('Tenant subscription is not active', 403))
  }
  
  // Find user with tenant context
  const user = await User.findByEmailAndTenant(email, tenant._id)
  
  if (!user) {
    return next(new AppError('Invalid credentials', 401))
  }
  
  // Check if account is locked
  if (user.isLocked) {
    return next(new AppError('Account is temporarily locked due to multiple failed login attempts', 423))
  }
  
  // Check password
  const isPasswordCorrect = await user.comparePassword(password)
  
  if (!isPasswordCorrect) {
    await user.handleFailedLogin()
    return next(new AppError('Invalid credentials', 401))
  }
  
  // Check if user is active
  if (user.status !== 'active') {
    if (user.status === 'pending') {
      return next(new AppError('Please verify your email before logging in', 401))
    }
    return next(new AppError('Account is not active', 401))
  }
  
  // Handle successful login
  await user.handleSuccessfulLogin()
  
  // Send token
  createSendToken(user, 200, req, res)
})

// Logout user
exports.logout = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken
  
  if (refreshToken && req.user) {
    await req.user.removeRefreshToken(refreshToken)
  }
  
  res.cookie('jwt', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  })
  
  res.cookie('refreshToken', 'loggedout', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  })
  
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  })
})

// Refresh token
exports.refreshToken = catchAsync(async (req, res, next) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken
  
  if (!refreshToken) {
    return next(new AppError('No refresh token provided', 401))
  }
  
  // Verify refresh token
  const decoded = await promisify(jwt.verify)(refreshToken, process.env.JWT_REFRESH_SECRET)
  
  // Find user and check if refresh token exists
  const user = await User.findById(decoded.id)
  if (!user) {
    return next(new AppError('User no longer exists', 401))
  }
  
  const tokenExists = user.refreshTokens.some(rt => rt.token === refreshToken && rt.expiresAt > Date.now())
  if (!tokenExists) {
    return next(new AppError('Invalid refresh token', 401))
  }
  
  // Generate new tokens
  createSendToken(user, 200, req, res)
})

// Verify token middleware
exports.protect = catchAsync(async (req, res, next) => {
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
  
  // Update last activity
  currentUser.lastActivity = Date.now()
  await currentUser.save({ validateBeforeSave: false })
  
  // Grant access to protected route
  req.user = currentUser
  next()
})

// Verify user token (for frontend auth check)
exports.verifyToken = catchAsync(async (req, res, next) => {
  const user = req.user
  const tenant = await Tenant.findById(user.tenantId)
  const permissions = getUserPermissions(user.role)
  
  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      preferences: user.preferences,
      lastLogin: user.lastLogin
    },
    tenant: tenant ? {
      id: tenant._id,
      name: tenant.name,
      companyName: tenant.companyName,
      productName: tenant.productName,
      productVersion: tenant.productVersion,
      branding: tenant.branding
    } : null,
    permissions
  })
})

// Forgot password
exports.forgotPassword = catchAsync(async (req, res, next) => {
  const { email, tenantSlug } = req.body
  
  // Find tenant
  let tenant
  if (tenantSlug) {
    tenant = await Tenant.findOne({ slug: tenantSlug })
  } else {
    const host = req.get('host')
    tenant = await Tenant.findOne({ domain: host }) || await Tenant.findOne({ slug: 'default' })
  }
  
  if (!tenant) {
    return next(new AppError('Invalid tenant', 400))
  }
  
  // Find user
  const user = await User.findByEmailAndTenant(email, tenant._id)
  if (!user) {
    return next(new AppError('There is no user with that email address.', 404))
  }
  
  // Generate reset token
  const resetToken = user.createPasswordResetToken()
  await user.save({ validateBeforeSave: false })
  
  // Send reset email
  const resetURL = `${req.protocol}://${req.get('host')}/reset-password/${resetToken}`
  
  try {
    await sendEmail({
      email: user.email,
      subject: 'Your password reset token (valid for 10 min)',
      message: `Forgot your password? Submit a PATCH request with your new password to: ${resetURL}\nIf you didn't forget your password, please ignore this email!`
    })
    
    res.status(200).json({
      success: true,
      message: 'Token sent to email!'
    })
  } catch (err) {
    user.passwordResetToken = undefined
    user.passwordResetExpires = undefined
    await user.save({ validateBeforeSave: false })
    
    return next(new AppError('There was an error sending the email. Try again later.', 500))
  }
})

// Reset password
exports.resetPassword = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')
  
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  })
  
  // If token has not expired, and there is user, set the new password
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400))
  }
  
  user.password = req.body.password
  user.passwordResetToken = undefined
  user.passwordResetExpires = undefined
  await user.save()
  
  // Log the user in, send JWT
  createSendToken(user, 200, req, res)
})

// Update password
exports.updatePassword = catchAsync(async (req, res, next) => {
  // Get user from collection
  const user = await User.findById(req.user.id).select('+password')
  
  // Check if POSTed current password is correct
  if (!(await user.comparePassword(req.body.passwordCurrent))) {
    return next(new AppError('Your current password is wrong.', 401))
  }
  
  // If so, update password
  user.password = req.body.password
  await user.save()
  
  // Log user in, send JWT
  createSendToken(user, 200, req, res)
})

// Email verification
exports.verifyEmail = catchAsync(async (req, res, next) => {
  // Get user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex')
  
  const user = await User.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpires: { $gt: Date.now() }
  })
  
  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400))
  }
  
  // Activate user
  user.isEmailVerified = true
  user.status = 'active'
  user.emailVerificationToken = undefined
  user.emailVerificationExpires = undefined
  await user.save({ validateBeforeSave: false })
  
  res.status(200).json({
    success: true,
    message: 'Email verified successfully'
  })
})

// Update profile
exports.updateProfile = catchAsync(async (req, res, next) => {
  // Create error if user POSTs password data
  if (req.body.password || req.body.passwordConfirm) {
    return next(new AppError('This route is not for password updates. Please use /updatePassword.', 400))
  }
  
  // Filtered out unwanted fields names that are not allowed to be updated
  const filteredBody = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    phone: req.body.phone,
    department: req.body.department,
    title: req.body.title,
    bio: req.body.bio,
    avatar: req.body.avatar,
    preferences: req.body.preferences
  }
  
  // Remove undefined values
  Object.keys(filteredBody).forEach(key => {
    if (filteredBody[key] === undefined) {
      delete filteredBody[key]
    }
  })
  
  // Update user document
  const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  })
  
  res.status(200).json({
    success: true,
    user: {
      id: updatedUser._id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
      role: updatedUser.role,
      status: updatedUser.status,
      avatar: updatedUser.avatar,
      preferences: updatedUser.preferences,
      lastLogin: updatedUser.lastLogin
    }
  })
}) 