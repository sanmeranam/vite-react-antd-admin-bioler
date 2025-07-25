const User = require('../models/User')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const { authLogger } = require('../utils/logger')

// Define available permissions
const AVAILABLE_PERMISSIONS = [
  // User Management
  'users.read', 'users.create', 'users.update', 'users.delete',
  
  // Role Management
  'roles.read', 'roles.create', 'roles.update', 'roles.delete',
  
  // Dashboard
  'dashboard.read',
  
  // Profile
  'profile.read', 'profile.update',
  
  // Analytics
  'analytics.read', 'analytics.export',
  
  // Integrations
  'integrations.read', 'integrations.create', 'integrations.update', 'integrations.delete',
  'integrations.api_keys', 'integrations.webhooks', 'integrations.third_party',
  
  // Settings
  'settings.read', 'settings.update',
  
  // Security
  'security.read', 'security.audit', 'security.sessions', 'security.policies',
  
  // Admin
  'admin'
]

// Define default role configurations
const DEFAULT_ROLES = {
  admin: {
    name: 'Administrator',
    description: 'Full system access with all permissions',
    permissions: ['admin'], // Admin gets all permissions automatically
    color: 'red',
    priority: 100
  },
  manager: {
    name: 'Manager',
    description: 'Team and user management capabilities',
    permissions: [
      'users.read', 'users.create', 'users.update',
      'roles.read',
      'dashboard.read', 'profile.read', 'profile.update',
      'analytics.read',
      'integrations.read'
    ],
    color: 'blue',
    priority: 75
  },
  user: {
    name: 'User',
    description: 'Standard user with basic access',
    permissions: [
      'dashboard.read', 'profile.read', 'profile.update'
    ],
    color: 'green',
    priority: 50
  },
  viewer: {
    name: 'Viewer',
    description: 'Read-only access to basic features',
    permissions: [
      'dashboard.read', 'profile.read'
    ],
    color: 'orange',
    priority: 25
  }
}

// Get all available permissions
exports.getPermissions = catchAsync(async (req, res, next) => {
  const groupedPermissions = {
    'User Management': AVAILABLE_PERMISSIONS.filter(p => p.startsWith('users.')),
    'Role Management': AVAILABLE_PERMISSIONS.filter(p => p.startsWith('roles.')),
    'Dashboard': AVAILABLE_PERMISSIONS.filter(p => p.startsWith('dashboard.')),
    'Profile': AVAILABLE_PERMISSIONS.filter(p => p.startsWith('profile.')),
    'Analytics': AVAILABLE_PERMISSIONS.filter(p => p.startsWith('analytics.')),
    'Integrations': AVAILABLE_PERMISSIONS.filter(p => p.startsWith('integrations.')),
    'Settings': AVAILABLE_PERMISSIONS.filter(p => p.startsWith('settings.')),
    'Security': AVAILABLE_PERMISSIONS.filter(p => p.startsWith('security.')),
    'System': AVAILABLE_PERMISSIONS.filter(p => p === 'admin')
  }

  res.status(200).json({
    success: true,
    data: {
      permissions: AVAILABLE_PERMISSIONS,
      groupedPermissions,
      total: AVAILABLE_PERMISSIONS.length
    }
  })
})

// Get all roles
exports.getRoles = catchAsync(async (req, res, next) => {
  const roles = Object.keys(DEFAULT_ROLES).map(key => ({
    id: key,
    key,
    ...DEFAULT_ROLES[key],
    permissions: DEFAULT_ROLES[key].permissions,
    userCount: 0 // Would be calculated from database in real implementation
  }))

  // Get actual user counts per role from database
  const roleCounts = await User.aggregate([
    { $match: { tenantId: req.tenant._id } },
    { $group: { _id: '$role', count: { $sum: 1 } } }
  ])

  // Update user counts
  roleCounts.forEach(({ _id: role, count }) => {
    const roleObj = roles.find(r => r.key === role)
    if (roleObj) {
      roleObj.userCount = count
    }
  })

  authLogger.info('Roles retrieved', {
    userId: req.user._id,
    tenantId: req.tenant._id,
    roleCount: roles.length
  })

  res.status(200).json({
    success: true,
    data: {
      roles,
      total: roles.length
    }
  })
})

// Get single role
exports.getRole = catchAsync(async (req, res, next) => {
  const { id } = req.params
  
  if (!DEFAULT_ROLES[id]) {
    return next(new AppError('Role not found', 404))
  }

  const role = {
    id,
    key: id,
    ...DEFAULT_ROLES[id]
  }

  // Get users with this role
  const users = await User.find({
    tenantId: req.tenant._id,
    role: id
  }).select('firstName lastName email avatar status')

  role.users = users
  role.userCount = users.length

  res.status(200).json({
    success: true,
    data: { role }
  })
})

// Get users by role
exports.getUsersByRole = catchAsync(async (req, res, next) => {
  const { role } = req.params
  const { page = 1, limit = 10 } = req.query

  if (!DEFAULT_ROLES[role]) {
    return next(new AppError('Role not found', 404))
  }

  const skip = (page - 1) * limit
  const users = await User.find({
    tenantId: req.tenant._id,
    role
  })
    .select('-password -refreshTokens -passwordResetToken -emailVerificationToken')
    .skip(skip)
    .limit(parseInt(limit))
    .sort({ createdAt: -1 })

  const total = await User.countDocuments({
    tenantId: req.tenant._id,
    role
  })

  res.status(200).json({
    success: true,
    data: {
      users,
      role: {
        key: role,
        ...DEFAULT_ROLES[role]
      },
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  })
})

// Assign role to user
exports.assignRole = catchAsync(async (req, res, next) => {
  const { userId, roleId } = req.body

  if (!DEFAULT_ROLES[roleId]) {
    return next(new AppError('Invalid role', 400))
  }

  // Check permissions
  if (!req.user.hasPermission('users.update')) {
    return next(new AppError('You do not have permission to assign roles', 403))
  }

  // Only admins can assign admin role
  if (roleId === 'admin' && req.user.role !== 'admin') {
    return next(new AppError('Only admins can assign admin role', 403))
  }

  // Find user
  const user = await User.findOne({
    _id: userId,
    tenantId: req.tenant._id
  })

  if (!user) {
    return next(new AppError('User not found', 404))
  }

  // Prevent self-demotion from admin
  if (user._id.equals(req.user._id) && user.role === 'admin' && roleId !== 'admin') {
    return next(new AppError('You cannot change your own admin role', 403))
  }

  // Update user role
  user.role = roleId
  user.updatedBy = req.user._id
  await user.save()

  authLogger.info('Role assigned', {
    userId: req.user._id,
    targetUserId: userId,
    tenantId: req.tenant._id,
    oldRole: user.role,
    newRole: roleId
  })

  res.status(200).json({
    success: true,
    message: `Role ${roleId} assigned successfully`,
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    }
  })
})

// Remove role from user (set to default 'user' role)
exports.removeRole = catchAsync(async (req, res, next) => {
  const { userId } = req.body

  // Check permissions
  if (!req.user.hasPermission('users.update')) {
    return next(new AppError('You do not have permission to modify roles', 403))
  }

  // Find user
  const user = await User.findOne({
    _id: userId,
    tenantId: req.tenant._id
  })

  if (!user) {
    return next(new AppError('User not found', 404))
  }

  // Only admins can modify admin users
  if (user.role === 'admin' && req.user.role !== 'admin') {
    return next(new AppError('Only admins can modify admin users', 403))
  }

  // Prevent self-demotion from admin
  if (user._id.equals(req.user._id) && user.role === 'admin') {
    return next(new AppError('You cannot remove your own admin role', 403))
  }

  const oldRole = user.role
  user.role = 'user' // Default role
  user.updatedBy = req.user._id
  await user.save()

  authLogger.info('Role removed', {
    userId: req.user._id,
    targetUserId: userId,
    tenantId: req.tenant._id,
    oldRole,
    newRole: 'user'
  })

  res.status(200).json({
    success: true,
    message: 'Role removed successfully, user set to default role',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role
      }
    }
  })
})

// Get role permissions
exports.getRolePermissions = catchAsync(async (req, res, next) => {
  const { role } = req.params

  if (!DEFAULT_ROLES[role]) {
    return next(new AppError('Role not found', 404))
  }

  const roleConfig = DEFAULT_ROLES[role]
  const permissions = role === 'admin' ? AVAILABLE_PERMISSIONS : roleConfig.permissions

  res.status(200).json({
    success: true,
    data: {
      role: {
        key: role,
        ...roleConfig
      },
      permissions,
      hasAllPermissions: role === 'admin'
    }
  })
})

// Get role statistics
exports.getRoleStats = catchAsync(async (req, res, next) => {
  const stats = await User.aggregate([
    { $match: { tenantId: req.tenant._id } },
    {
      $group: {
        _id: '$role',
        count: { $sum: 1 },
        activeUsers: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
        },
        pendingUsers: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        }
      }
    }
  ])

  const roleStats = Object.keys(DEFAULT_ROLES).map(roleKey => {
    const stat = stats.find(s => s._id === roleKey) || { count: 0, activeUsers: 0, pendingUsers: 0 }
    return {
      role: roleKey,
      name: DEFAULT_ROLES[roleKey].name,
      color: DEFAULT_ROLES[roleKey].color,
      totalUsers: stat.count,
      activeUsers: stat.activeUsers,
      pendingUsers: stat.pendingUsers
    }
  })

  res.status(200).json({
    success: true,
    data: {
      roleStats,
      totalRoles: Object.keys(DEFAULT_ROLES).length,
      totalUsers: stats.reduce((sum, s) => sum + s.count, 0)
    }
  })
}) 