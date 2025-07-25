const mongoose = require('mongoose')
const { dbLogger } = require('./logger')

/**
 * Database connection utility with retry logic and proper error handling
 */
class DatabaseConnection {
  constructor() {
    this.isConnected = false
    this.retryAttempts = 0
    this.maxRetries = 5
    this.retryDelay = 5000 // 5 seconds
  }

  async connect() {
    try {
      // MongoDB connection options
      const options = {
        maxPoolSize: 10, // Maintain up to 10 socket connections
        serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
        socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        family: 4, // Use IPv4, skip trying IPv6
        retryWrites: true,
        w: 'majority'
      }

      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/saas-portal', options)
      
      this.isConnected = true
      this.retryAttempts = 0
      
      dbLogger.info('✅ MongoDB connected successfully')
      
      // Set up event listeners
      this.setupEventListeners()
      
      return true
    } catch (error) {
      dbLogger.error({ err: error }, '❌ MongoDB connection failed')
      
      this.retryAttempts++
      
      if (this.retryAttempts <= this.maxRetries) {
        dbLogger.info({
          retryAttempts: this.retryAttempts,
          maxRetries: this.maxRetries,
          retryDelay: this.retryDelay
        }, `🔄 Retrying connection in ${this.retryDelay / 1000} seconds...`)
        
        setTimeout(() => {
          this.connect()
        }, this.retryDelay)
      } else {
        dbLogger.fatal('💀 Max retry attempts reached. Exiting...')
        process.exit(1)
      }
      
      return false
    }
  }

  setupEventListeners() {
    // Connection successful
    mongoose.connection.on('connected', () => {
      dbLogger.info('🔗 Mongoose connected to MongoDB')
      this.isConnected = true
    })

    // Connection error
    mongoose.connection.on('error', (err) => {
      dbLogger.error({ err }, '❌ Mongoose connection error')
      this.isConnected = false
    })

    // Connection disconnected
    mongoose.connection.on('disconnected', () => {
      dbLogger.info('🔌 Mongoose disconnected from MongoDB')
      this.isConnected = false
    })

    // Application termination
    process.on('SIGINT', async () => {
      await this.disconnect()
      process.exit(0)
    })

    // Unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      dbLogger.error({ err }, '❌ Unhandled Promise Rejection')
      this.disconnect().then(() => {
        process.exit(1)
      })
    })
  }

  async disconnect() {
    try {
      await mongoose.connection.close()
      dbLogger.info('👋 MongoDB connection closed gracefully')
      this.isConnected = false
    } catch (error) {
      dbLogger.error({ err: error }, '❌ Error closing MongoDB connection')
    }
  }

  // Health check method
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', error: 'Database not connected' }
      }

      // Ping the database
      await mongoose.connection.db.admin().ping()
      
      return {
        status: 'connected',
        database: mongoose.connection.db.databaseName,
        host: mongoose.connection.host,
        port: mongoose.connection.port,
        readyState: mongoose.connection.readyState
      }
    } catch (error) {
      return {
        status: 'error',
        error: error.message
      }
    }
  }

  // Create default tenant and admin user for development
  async createDefaultData() {
    try {
      const Tenant = require('../models/Tenant')
      const User = require('../models/User')

      // Check if default tenant exists
      let defaultTenant = await Tenant.findOne({ slug: 'default' })
      
      if (!defaultTenant) {
        dbLogger.info('🏗️  Creating default tenant...')
        
        // Create default tenant
        defaultTenant = await Tenant.create({
          name: 'Default Organization',
          slug: 'default',
          companyName: 'Broadcom Inc.',
          contactEmail: 'admin@broadcom.com',
          productName: 'SaaS Portal',
          productVersion: '1.0.0',
          plan: 'enterprise',
          status: 'active',
          // Temporarily set owner - will update after creating admin user
          owner: new mongoose.Types.ObjectId()
        })
      }

      // Check if admin user exists
      let adminUser = await User.findOne({ 
        email: 'admin@broadcom.com',
        tenantId: defaultTenant._id
      })

      if (!adminUser) {
        dbLogger.info('👤 Creating default admin user...')
        
        // Create admin user
        adminUser = await User.create({
          firstName: 'System',
          lastName: 'Administrator',
          email: 'admin@broadcom.com',
          password: 'Password123!',
          role: 'admin',
          status: 'active',
          isEmailVerified: true,
          tenantId: defaultTenant._id
        })

        // Update tenant owner
        defaultTenant.owner = adminUser._id
        await defaultTenant.save()

        dbLogger.info({
          email: 'admin@broadcom.com',
          password: 'Password123!',
          role: 'admin'
        }, '✅ Default admin user created')
      }

      return { tenant: defaultTenant, user: adminUser }
    } catch (error) {
      dbLogger.error({ err: error }, '❌ Error creating default data')
      throw error
    }
  }

  // Database seeding method
  async seedDatabase() {
    try {
      dbLogger.info('🌱 Seeding database...')
      
      await this.createDefaultData()
      
      // Add more seeding logic here if needed
      // - Sample users
      // - Sample data
      // - Test tenants
      
      dbLogger.info('✅ Database seeding completed')
    } catch (error) {
      dbLogger.error({ err: error }, '❌ Database seeding failed')
      throw error
    }
  }
}

// Create and export singleton instance
const dbConnection = new DatabaseConnection()

module.exports = dbConnection 