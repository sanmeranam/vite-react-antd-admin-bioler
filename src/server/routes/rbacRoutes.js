const express = require('express')
const rbacController = require('../controllers/rbacController')
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

// Get all available permissions
router.get(
  '/permissions',
  requirePermission('roles.read'),
  rbacController.getPermissions
)

// Get all roles
router.get(
  '/roles',
  requirePermission('roles.read'),
  rbacController.getRoles
)

// Get role statistics
router.get(
  '/roles/stats',
  requirePermission('roles.read'),
  rbacController.getRoleStats
)

// Get single role
router.get(
  '/roles/:id',
  requirePermission('roles.read'),
  rbacController.getRole
)

// Get users by role
router.get(
  '/roles/:role/users',
  requirePermission('roles.read'),
  rbacController.getUsersByRole
)

// Get role permissions
router.get(
  '/roles/:role/permissions',
  requirePermission('roles.read'),
  rbacController.getRolePermissions
)

// Assign role to user
router.post(
  '/assign-role',
  requirePermission('users.update'),
  auditLog('rbac.assign_role'),
  rbacController.assignRole
)

// Remove role from user
router.delete(
  '/remove-role',
  requirePermission('users.update'),
  auditLog('rbac.remove_role'),
  rbacController.removeRole
)

module.exports = router 