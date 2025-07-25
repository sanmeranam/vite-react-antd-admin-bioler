const express = require('express')
const userController = require('../controllers/userController')
const { 
  authenticate, 
  resolveTenant, 
  requirePermission, 
  ensureTenantScope,
  auditLog
} = require('../middleware/auth')

const router = express.Router()

// All routes require authentication and tenant resolution
router.use(authenticate)
router.use(resolveTenant)
router.use(ensureTenantScope)

// Get all users (with pagination, search, filtering)
router.get(
  '/',
  requirePermission('users.read'),
  auditLog('users.list'),
  userController.getUsers
)

// Get user statistics/analytics
router.get(
  '/stats',
  requirePermission('users.read'),
  userController.getUsers // Same endpoint returns stats
)

// Create new user
router.post(
  '/',
  requirePermission('users.create'),
  auditLog('users.create'),
  userController.createUser
)

// Bulk operations on users
router.patch(
  '/bulk',
  requirePermission('users.update'),
  auditLog('users.bulk_update'),
  userController.bulkUpdateUsers
)

// Get single user by ID
router.get(
  '/:id',
  requirePermission('users.read'),
  userController.getUser
)

// Update user
router.patch(
  '/:id',
  requirePermission('users.update'),
  auditLog('users.update'),
  userController.updateUser
)

// Delete user
router.delete(
  '/:id',
  requirePermission('users.delete'),
  auditLog('users.delete'),
  userController.deleteUser
)

// Resend invitation to user
router.post(
  '/:id/resend-invitation',
  requirePermission('users.create'),
  auditLog('users.resend_invitation'),
  userController.resendInvitation
)

// Get user activity/audit log
router.get(
  '/:id/activity',
  requirePermission('users.read'),
  userController.getUserActivity
)

// Note: Accept invitation route is mounted separately in app.js as a public route

module.exports = router 