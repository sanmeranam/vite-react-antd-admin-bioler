const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
  // Basic Information
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters'],
    select: false // Don't include password in queries by default
  },
  
  // Profile Information
  avatar: {
    type: String,
    default: null
  },
  phone: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  title: {
    type: String,
    trim: true
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters']
  },
  
  // Multi-tenancy
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: [true, 'Tenant ID is required'],
    index: true
  },
  
  // Role-Based Access Control
  role: {
    type: String,
    enum: ['admin', 'manager', 'user', 'viewer'],
    default: 'user',
    index: true
  },
  permissions: [{
    type: String,
    trim: true
  }],
  
  // Account Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'pending', 'suspended'],
    default: 'pending'
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isTwoFactorEnabled: {
    type: Boolean,
    default: false
  },
  
  // Authentication & Security
  lastLogin: {
    type: Date,
    default: null
  },
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: {
    type: Date
  },
  refreshTokens: [{
    token: String,
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    deviceInfo: String
  }],
  
  // Password Reset
  passwordResetToken: String,
  passwordResetExpires: Date,
  passwordChangedAt: Date,
  
  // Email Verification
  emailVerificationToken: String,
  emailVerificationExpires: Date,
  
  // Two-Factor Authentication
  twoFactorSecret: String,
  twoFactorBackupCodes: [String],
  
  // Invitation System
  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  invitationToken: String,
  invitationExpires: Date,
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Preferences
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'compact'],
      default: 'light'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    notifications: {
      email: { type: Boolean, default: true },
      browser: { type: Boolean, default: true },
      mobile: { type: Boolean, default: true }
    }
  },
  
  // Activity Tracking
  lastActivity: {
    type: Date,
    default: Date.now
  },
  sessionCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes for performance
userSchema.index({ email: 1, tenantId: 1 }, { unique: true })
userSchema.index({ tenantId: 1, role: 1 })
userSchema.index({ tenantId: 1, status: 1 })
userSchema.index({ tenantId: 1, createdAt: -1 })
userSchema.index({ lastActivity: 1 })

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`.trim()
})

// Virtual for account locked status
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now())
})

// Pre-save middleware to hash password
userSchema.pre('save', async function(next) {
  // Only hash password if it's modified
  if (!this.isModified('password')) return next()
  
  try {
    // Hash password with salt rounds from environment
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12
    this.password = await bcrypt.hash(this.password, saltRounds)
    
    // Set password changed timestamp
    if (!this.isNew) {
      this.passwordChangedAt = Date.now() - 1000 // Subtract 1 second to ensure JWT is created after
    }
    
    next()
  } catch (error) {
    next(error)
  }
})

// Instance method to compare password
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false
  return await bcrypt.compare(candidatePassword, this.password)
}

// Instance method to generate password reset token
userSchema.methods.createPasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex')
  
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex')
  
  this.passwordResetExpires = Date.now() + 10 * 60 * 1000 // 10 minutes
  
  return resetToken
}

// Instance method to generate email verification token
userSchema.methods.createEmailVerificationToken = function() {
  const verificationToken = crypto.randomBytes(32).toString('hex')
  
  this.emailVerificationToken = crypto
    .createHash('sha256')
    .update(verificationToken)
    .digest('hex')
  
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  
  return verificationToken
}

// Instance method to generate invitation token
userSchema.methods.createInvitationToken = function() {
  const inviteToken = crypto.randomBytes(32).toString('hex')
  
  this.invitationToken = crypto
    .createHash('sha256')
    .update(inviteToken)
    .digest('hex')
  
  this.invitationExpires = Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  
  return inviteToken
}

// Instance method to handle failed login
userSchema.methods.handleFailedLogin = async function() {
  // Increment login attempts
  this.loginAttempts += 1
  
  // Lock account after 5 failed attempts for 2 hours
  if (this.loginAttempts >= 5) {
    this.lockUntil = Date.now() + 2 * 60 * 60 * 1000 // 2 hours
  }
  
  await this.save({ validateBeforeSave: false })
}

// Instance method to handle successful login
userSchema.methods.handleSuccessfulLogin = async function() {
  // Reset login attempts and lock
  if (this.loginAttempts > 0 || this.lockUntil) {
    this.loginAttempts = 0
    this.lockUntil = undefined
  }
  
  // Update last login and activity
  this.lastLogin = Date.now()
  this.lastActivity = Date.now()
  this.sessionCount += 1
  
  await this.save({ validateBeforeSave: false })
}

// Instance method to check if password was changed after JWT issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10)
    return JWTTimestamp < changedTimestamp
  }
  return false
}

// Instance method to add refresh token
userSchema.methods.addRefreshToken = async function(token, deviceInfo) {
  // Remove expired tokens
  this.refreshTokens = this.refreshTokens.filter(rt => rt.expiresAt > Date.now())
  
  // Add new token
  this.refreshTokens.push({
    token,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    deviceInfo
  })
  
  // Keep only last 5 refresh tokens per user
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5)
  }
  
  await this.save({ validateBeforeSave: false })
}

// Instance method to remove refresh token
userSchema.methods.removeRefreshToken = async function(token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token)
  await this.save({ validateBeforeSave: false })
}

// Instance method to check permissions
userSchema.methods.hasPermission = function(permission) {
  // Admin has all permissions
  if (this.role === 'admin') return true
  
  // Check if user has specific permission
  return this.permissions.includes(permission)
}

// Instance method to check role hierarchy
userSchema.methods.hasRole = function(role) {
  const roleHierarchy = {
    'admin': 4,
    'manager': 3,
    'user': 2,
    'viewer': 1
  }
  
  const userRoleLevel = roleHierarchy[this.role] || 0
  const requiredRoleLevel = roleHierarchy[role] || 0
  
  return userRoleLevel >= requiredRoleLevel
}

// Static method to find user with tenant context
userSchema.statics.findByEmailAndTenant = function(email, tenantId) {
  return this.findOne({ email, tenantId }).select('+password')
}

// Static method to find active users in tenant
userSchema.statics.findActiveTenantUsers = function(tenantId) {
  return this.find({
    tenantId,
    status: 'active',
    isEmailVerified: true
  })
}

// Clean up expired tokens periodically
userSchema.statics.cleanupExpiredTokens = async function() {
  const now = new Date()
  
  await this.updateMany(
    {},
    {
      $pull: {
        refreshTokens: { expiresAt: { $lt: now } }
      },
      $unset: {
        passwordResetToken: '',
        passwordResetExpires: '',
        emailVerificationToken: '',
        emailVerificationExpires: '',
        invitationToken: '',
        invitationExpires: ''
      }
    }
  )
}

module.exports = mongoose.model('User', userSchema) 