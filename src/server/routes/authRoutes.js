const express = require('express')
const authController = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')

const router = express.Router()

// Authentication routes
router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/logout', authenticate, authController.logout)
router.post('/refresh', authController.refreshToken)

// Password management
router.post('/forgot-password', authController.forgotPassword)
router.patch('/reset-password/:token', authController.resetPassword)
router.patch('/update-password', authenticate, authController.updatePassword)

// Email verification
router.get('/verify-email/:token', authController.verifyEmail)

// Token verification (for frontend auth checks)
router.get('/verify', authenticate, authController.verifyToken)

// Profile management
router.patch('/profile', authenticate, authController.updateProfile)

module.exports = router 