const User = require('../models/User')
const Tenant = require('../models/Tenant')
const catchAsync = require('../utils/catchAsync')
const AppError = require('../utils/appError')
const sendEmail = require('../utils/email')
const crypto = require('crypto')
const { authLogger } = require('../utils/logger')

// Get all users with filtering, pagination, and search
exports.getUsers = catchAsync(async (req, res, next) => {
  const {
    page = 1,
    limit = 10,
    search,
    role,
    status,
    department,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query

  // Build filter object
  const filter = { tenantId: req.tenant._id }

  if (search) {
    filter.$or = [
      { firstName: { $regex: search, $options: 'i' } },
      { lastName: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { department: { $regex: search, $options: 'i' } }
    ]
  }

  if (role) filter.role = role
  if (status) filter.status = status
  if (department) filter.department = department

  // Build sort object
  const sort = {}
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1

  // Execute query with pagination
  const skip = (page - 1) * limit
  const users = await User.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(parseInt(limit))
    .select('-password -refreshTokens -passwordResetToken -emailVerificationToken')
    .populate('createdBy', 'firstName lastName email')
    .populate('invitedBy', 'firstName lastName email')

  // Get total count for pagination
  const total = await User.countDocuments(filter)

  // Calculate stats
  const stats = await User.aggregate([
    { $match: { tenantId: req.tenant._id } },
    {
      $group: {
        _id: null,
        totalUsers: { $sum: 1 },
        activeUsers: { $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] } },
        pendingUsers: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
        inactiveUsers: { $sum: { $cond: [{ $eq: ['$status', 'inactive'] }, 1, 0] } },
        adminUsers: { $sum: { $cond: [{ $eq: ['$role', 'admin'] }, 1, 0] } },
        managerUsers: { $sum: { $cond: [{ $eq: ['$role', 'manager'] }, 1, 0] } },
        regularUsers: { $sum: { $cond: [{ $eq: ['$role', 'user'] }, 1, 0] } }
      }
    }
  ])

  authLogger.info('Users retrieved', {
    userId: req.user._id,
    tenantId: req.tenant._id,
    filters: filter,
    count: users.length,
    total
  })

  res.status(200).json({
    success: true,
    data: {
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      },
      stats: stats[0] || {
        totalUsers: 0,
        activeUsers: 0,
        pendingUsers: 0,
        inactiveUsers: 0,
        adminUsers: 0,
        managerUsers: 0,
        regularUsers: 0
      }
    }
  })
})

// Get single user by ID
exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findOne({
    _id: req.params.id,
    tenantId: req.tenant._id
  })
    .select('-password -refreshTokens -passwordResetToken -emailVerificationToken')
    .populate('createdBy', 'firstName lastName email')
    .populate('invitedBy', 'firstName lastName email')

  if (!user) {
    return next(new AppError('User not found', 404))
  }

  res.status(200).json({
    success: true,
    data: { user }
  })
})

// Create new user
exports.createUser = catchAsync(async (req, res, next) => {
  const {
    firstName,
    lastName,
    email,
    role = 'user',
    department,
    title,
    phone,
    sendInvitation = true
  } = req.body

  // Check if user already exists
  const existingUser = await User.findByEmailAndTenant(email, req.tenant._id)
  if (existingUser) {
    return next(new AppError('User already exists with this email', 400))
  }

  // Check tenant user limit
  if (!req.tenant.checkUsageLimit('users')) {
    return next(new AppError('User limit reached for this tenant', 403))
  }

  // Validate role permissions
  if (!req.user.hasPermission('users.create')) {
    return next(new AppError('You do not have permission to create users', 403))
  }

  // Only admins can create admin users
  if (role === 'admin' && req.user.role !== 'admin') {
    return next(new AppError('Only admins can create admin users', 403))
  }

  // Generate temporary password
  const temporaryPassword = crypto.randomBytes(12).toString('hex')

  // Create user
  const newUser = await User.create({
    firstName,
    lastName,
    email,
    password: temporaryPassword,
    role,
    department,
    title,
    phone,
    tenantId: req.tenant._id,
    createdBy: req.user._id,
    status: sendInvitation ? 'pending' : 'active'
  })

  // Increment tenant user count
  await req.tenant.incrementUsage('users')

  if (sendInvitation) {
    // Generate invitation token
    const inviteToken = newUser.createInvitationToken()
    await newUser.save({ validateBeforeSave: false })

    // Send invitation email
    const inviteURL = `${req.protocol}://${req.get('host')}/accept-invitation/${inviteToken}`

    try {
      await sendEmail({
        email: newUser.email,
        subject: `Invitation to join ${req.tenant.name}`,
        template: 'invitation',
        data: {
          firstName: newUser.firstName,
          tenantName: req.tenant.name,
          inviteURL,
          inviterName: `${req.user.firstName} ${req.user.lastName}`
        }
      })

      authLogger.info('User invitation sent', {
        userId: req.user._id,
        newUserId: newUser._id,
        tenantId: req.tenant._id,
        email: newUser.email
      })
    } catch (err) {
      authLogger.error('Failed to send invitation email', {
        error: err.message,
        userId: req.user._id,
        newUserId: newUser._id,
        email: newUser.email
      })
    }
  }

  // Remove sensitive data
  newUser.password = undefined
  newUser.refreshTokens = undefined

  authLogger.info('User created', {
    userId: req.user._id,
    newUserId: newUser._id,
    tenantId: req.tenant._id,
    role: newUser.role,
    sendInvitation
  })

  res.status(201).json({
    success: true,
    message: sendInvitation ? 'User created and invitation sent' : 'User created successfully',
    data: { user: newUser }
  })
})

// Update user
exports.updateUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id
  const updateData = req.body

  // Find user
  const user = await User.findOne({
    _id: userId,
    tenantId: req.tenant._id
  })

  if (!user) {
    return next(new AppError('User not found', 404))
  }

  // Check permissions
  if (!req.user.hasPermission('users.update')) {
    return next(new AppError('You do not have permission to update users', 403))
  }

  // Only admins can update admin users or change roles
  if ((user.role === 'admin' || updateData.role === 'admin') && req.user.role !== 'admin') {
    return next(new AppError('Only admins can update admin users or change roles', 403))
  }

  // Prevent self-demotion from admin
  if (user._id.equals(req.user._id) && user.role === 'admin' && updateData.role !== 'admin') {
    return next(new AppError('You cannot change your own admin role', 403))
  }

  // Filter allowed fields
  const allowedFields = ['firstName', 'lastName', 'email', 'role', 'department', 'title', 'phone', 'status', 'bio']
  const filteredBody = {}
  allowedFields.forEach(field => {
    if (updateData[field] !== undefined) {
      filteredBody[field] = updateData[field]
    }
  })

  // Add updatedBy
  filteredBody.updatedBy = req.user._id

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    filteredBody,
    {
      new: true,
      runValidators: true
    }
  ).select('-password -refreshTokens -passwordResetToken -emailVerificationToken')

  authLogger.info('User updated', {
    userId: req.user._id,
    updatedUserId: userId,
    tenantId: req.tenant._id,
    changes: filteredBody
  })

  res.status(200).json({
    success: true,
    message: 'User updated successfully',
    data: { user: updatedUser }
  })
})

// Delete user
exports.deleteUser = catchAsync(async (req, res, next) => {
  const userId = req.params.id

  // Find user
  const user = await User.findOne({
    _id: userId,
    tenantId: req.tenant._id
  })

  if (!user) {
    return next(new AppError('User not found', 404))
  }

  // Check permissions
  if (!req.user.hasPermission('users.delete')) {
    return next(new AppError('You do not have permission to delete users', 403))
  }

  // Prevent self-deletion
  if (user._id.equals(req.user._id)) {
    return next(new AppError('You cannot delete your own account', 403))
  }

  // Only admins can delete admin users
  if (user.role === 'admin' && req.user.role !== 'admin') {
    return next(new AppError('Only admins can delete admin users', 403))
  }

  // Delete user
  await User.findByIdAndDelete(userId)

  // Decrement tenant user count
  await req.tenant.decrementUsage('users')

  authLogger.info('User deleted', {
    userId: req.user._id,
    deletedUserId: userId,
    tenantId: req.tenant._id,
    deletedUserEmail: user.email
  })

  res.status(200).json({
    success: true,
    message: 'User deleted successfully'
  })
})

// Bulk operations
exports.bulkUpdateUsers = catchAsync(async (req, res, next) => {
  const { userIds, action, data } = req.body

  if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
    return next(new AppError('User IDs are required', 400))
  }

  if (!action) {
    return next(new AppError('Action is required', 400))
  }

  // Check permissions
  if (!req.user.hasPermission('users.update')) {
    return next(new AppError('You do not have permission to update users', 403))
  }

  const filter = {
    _id: { $in: userIds },
    tenantId: req.tenant._id
  }

  let updateData = {}
  let message = ''

  switch (action) {
    case 'activate':
      updateData = { status: 'active' }
      message = 'Users activated successfully'
      break
    case 'deactivate':
      updateData = { status: 'inactive' }
      message = 'Users deactivated successfully'
      break
    case 'delete':
      if (!req.user.hasPermission('users.delete')) {
        return next(new AppError('You do not have permission to delete users', 403))
      }
      
      // Prevent self-deletion
      if (userIds.includes(req.user._id.toString())) {
        return next(new AppError('You cannot delete your own account', 403))
      }
      
      // Check for admin users (only admins can delete admins)
      if (req.user.role !== 'admin') {
        const adminUsers = await User.find({
          _id: { $in: userIds },
          tenantId: req.tenant._id,
          role: 'admin'
        })
        
        if (adminUsers.length > 0) {
          return next(new AppError('Only admins can delete admin users', 403))
        }
      }
      
      const deletedUsers = await User.deleteMany(filter)
      
      // Decrement tenant user count
      await req.tenant.decrementUsage('users', deletedUsers.deletedCount)
      
      authLogger.info('Bulk delete users', {
        userId: req.user._id,
        tenantId: req.tenant._id,
        deletedCount: deletedUsers.deletedCount,
        userIds
      })
      
      return res.status(200).json({
        success: true,
        message: `${deletedUsers.deletedCount} users deleted successfully`,
        data: { deletedCount: deletedUsers.deletedCount }
      })
    case 'updateRole':
      if (!data.role) {
        return next(new AppError('Role is required for role update', 400))
      }
      
      // Only admins can change roles to/from admin
      if ((data.role === 'admin' || req.user.role !== 'admin')) {
        const adminUsers = await User.find({
          _id: { $in: userIds },
          tenantId: req.tenant._id,
          role: 'admin'
        })
        
        if (adminUsers.length > 0 && req.user.role !== 'admin') {
          return next(new AppError('Only admins can change admin roles', 403))
        }
      }
      
      updateData = { role: data.role }
      message = `Users role updated to ${data.role} successfully`
      break
    default:
      return next(new AppError('Invalid action', 400))
  }

  if (action !== 'delete') {
    updateData.updatedBy = req.user._id
    
    const result = await User.updateMany(filter, updateData)
    
    authLogger.info('Bulk update users', {
      userId: req.user._id,
      tenantId: req.tenant._id,
      action,
      updatedCount: result.modifiedCount,
      userIds
    })
    
    res.status(200).json({
      success: true,
      message,
      data: { updatedCount: result.modifiedCount }
    })
  }
})

// Resend invitation
exports.resendInvitation = catchAsync(async (req, res, next) => {
  const userId = req.params.id

  const user = await User.findOne({
    _id: userId,
    tenantId: req.tenant._id
  })

  if (!user) {
    return next(new AppError('User not found', 404))
  }

  if (user.status !== 'pending') {
    return next(new AppError('User is not in pending status', 400))
  }

  // Generate new invitation token
  const inviteToken = user.createInvitationToken()
  await user.save({ validateBeforeSave: false })

  // Send invitation email
  const inviteURL = `${req.protocol}://${req.get('host')}/accept-invitation/${inviteToken}`

  try {
    await sendEmail({
      email: user.email,
      subject: `Invitation to join ${req.tenant.name}`,
      template: 'invitation',
      data: {
        firstName: user.firstName,
        tenantName: req.tenant.name,
        inviteURL,
        inviterName: `${req.user.firstName} ${req.user.lastName}`
      }
    })

    authLogger.info('Invitation resent', {
      userId: req.user._id,
      invitedUserId: userId,
      tenantId: req.tenant._id
    })

    res.status(200).json({
      success: true,
      message: 'Invitation sent successfully'
    })
  } catch (err) {
    authLogger.error('Failed to resend invitation', {
      error: err.message,
      userId: req.user._id,
      invitedUserId: userId
    })
    
    return next(new AppError('Failed to send invitation email', 500))
  }
})

// Accept invitation
exports.acceptInvitation = catchAsync(async (req, res, next) => {
  const { token } = req.params
  const { password, confirmPassword } = req.body

  if (password !== confirmPassword) {
    return next(new AppError('Passwords do not match', 400))
  }

  // Hash token and find user
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex')

  const user = await User.findOne({
    invitationToken: hashedToken,
    invitationExpires: { $gt: Date.now() }
  })

  if (!user) {
    return next(new AppError('Token is invalid or has expired', 400))
  }

  // Set password and activate user
  user.password = password
  user.status = 'active'
  user.isEmailVerified = true
  user.invitationToken = undefined
  user.invitationExpires = undefined
  await user.save()

  authLogger.info('Invitation accepted', {
    userId: user._id,
    tenantId: user.tenantId
  })

  res.status(200).json({
    success: true,
    message: 'Invitation accepted successfully. You can now log in.'
  })
})

// Get user activity/audit log
exports.getUserActivity = catchAsync(async (req, res, next) => {
  const userId = req.params.id
  const { page = 1, limit = 20 } = req.query

  // Check if user exists in tenant
  const user = await User.findOne({
    _id: userId,
    tenantId: req.tenant._id
  })

  if (!user) {
    return next(new AppError('User not found', 404))
  }

  // For now, return basic user info
  // In a full implementation, you'd have an audit log collection
  const activity = {
    user: {
      id: user._id,
      name: user.fullName,
      email: user.email,
      lastLogin: user.lastLogin,
      lastActivity: user.lastActivity,
      sessionCount: user.sessionCount,
      loginAttempts: user.loginAttempts
    },
    sessions: [], // Would come from session tracking
    activities: [] // Would come from audit log
  }

  res.status(200).json({
    success: true,
    data: activity
  })
}) 