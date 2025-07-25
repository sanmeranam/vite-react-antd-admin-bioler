const mongoose = require('mongoose')

const tenantSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: [true, 'Tenant name is required'],
    trim: true,
    maxlength: [100, 'Tenant name cannot exceed 100 characters']
  },
  slug: {
    type: String,
    required: [true, 'Tenant slug is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens']
  },
  domain: {
    type: String,
    unique: true,
    sparse: true, // Allows multiple null values
    lowercase: true,
    trim: true
  },
  
  // Company Information
  companyName: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  industry: {
    type: String,
    trim: true
  },
  companySize: {
    type: String,
    enum: ['1-10', '11-50', '51-200', '201-1000', '1000+'],
    default: '1-10'
  },
  website: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  
  // Contact Information
  contactEmail: {
    type: String,
    required: [true, 'Contact email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  contactPhone: {
    type: String,
    trim: true
  },
  
  // Address
  address: {
    street: String,
    city: String,
    state: String,
    country: String,
    zipCode: String
  },
  
  // Subscription & Billing
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  planStartDate: {
    type: Date,
    default: Date.now
  },
  planEndDate: {
    type: Date
  },
  billingCycle: {
    type: String,
    enum: ['monthly', 'yearly'],
    default: 'monthly'
  },
  
  // Usage Limits
  limits: {
    users: {
      type: Number,
      default: 5
    },
    storage: {
      type: Number,
      default: 1048576000 // 1GB in bytes
    },
    apiCalls: {
      type: Number,
      default: 10000
    },
    customDomain: {
      type: Boolean,
      default: false
    },
    sso: {
      type: Boolean,
      default: false
    },
    advancedReporting: {
      type: Boolean,
      default: false
    }
  },
  
  // Current Usage
  usage: {
    users: {
      type: Number,
      default: 0
    },
    storage: {
      type: Number,
      default: 0
    },
    apiCalls: {
      type: Number,
      default: 0
    },
    lastReset: {
      type: Date,
      default: Date.now
    }
  },
  
  // Branding & Customization
  branding: {
    logo: String,
    favicon: String,
    primaryColor: {
      type: String,
      default: '#1890ff'
    },
    secondaryColor: {
      type: String,
      default: '#f0f0f0'
    },
    customCSS: String,
    emailTemplate: String
  },
  
  // Product Information
  productName: {
    type: String,
    default: 'SaaS Portal'
  },
  productVersion: {
    type: String,
    default: '1.0.0'
  },
  
  // Settings
  settings: {
    allowUserRegistration: {
      type: Boolean,
      default: true
    },
    requireEmailVerification: {
      type: Boolean,
      default: true
    },
    enableTwoFactor: {
      type: Boolean,
      default: false
    },
    sessionTimeout: {
      type: Number,
      default: 24 // hours
    },
    passwordPolicy: {
      minLength: {
        type: Number,
        default: 8
      },
      requireUppercase: {
        type: Boolean,
        default: true
      },
      requireLowercase: {
        type: Boolean,
        default: true
      },
      requireNumbers: {
        type: Boolean,
        default: true
      },
      requireSpecialChars: {
        type: Boolean,
        default: false
      },
      maxAge: {
        type: Number,
        default: 90 // days
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    },
    dateFormat: {
      type: String,
      default: 'MM/DD/YYYY'
    },
    currency: {
      type: String,
      default: 'USD'
    }
  },
  
  // Feature Flags
  features: {
    analytics: {
      type: Boolean,
      default: true
    },
    exportData: {
      type: Boolean,
      default: true
    },
    apiAccess: {
      type: Boolean,
      default: false
    },
    webhooks: {
      type: Boolean,
      default: false
    },
    integrations: {
      type: Boolean,
      default: false
    },
    customReports: {
      type: Boolean,
      default: false
    },
    auditLogs: {
      type: Boolean,
      default: true
    },
    backup: {
      type: Boolean,
      default: false
    }
  },
  
  // Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'trial', 'expired'],
    default: 'trial'
  },
  
  // Database Isolation (for advanced multi-tenancy)
  databaseName: {
    type: String,
    sparse: true,
    unique: true
  },
  
  // Owner Information
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Audit Trail
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Timestamps
  trialStartDate: {
    type: Date,
    default: Date.now
  },
  trialEndDate: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
})

// Indexes (removed duplicate unique indexes since they're already defined in the schema)
tenantSchema.index({ status: 1 })
tenantSchema.index({ plan: 1 })
tenantSchema.index({ owner: 1 })

// Virtual for trial status
tenantSchema.virtual('isTrialActive').get(function() {
  return this.status === 'trial' && this.trialEndDate > Date.now()
})

// Virtual for days remaining in trial
tenantSchema.virtual('trialDaysRemaining').get(function() {
  if (this.status !== 'trial') return 0
  const now = new Date()
  const trialEnd = new Date(this.trialEndDate)
  const diffTime = trialEnd - now
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.max(0, diffDays)
})

// Virtual for subscription status
tenantSchema.virtual('subscriptionActive').get(function() {
  if (this.status === 'trial') return this.isTrialActive
  return this.status === 'active' && (!this.planEndDate || this.planEndDate > Date.now())
})

// Instance method to check feature access
tenantSchema.methods.hasFeature = function(feature) {
  // Check if feature exists and is enabled
  if (this.features && this.features[feature] !== undefined) {
    return this.features[feature]
  }
  
  // Default based on plan
  const planFeatures = {
    free: {
      analytics: true,
      exportData: false,
      apiAccess: false,
      webhooks: false,
      integrations: false,
      customReports: false,
      auditLogs: false,
      backup: false
    },
    basic: {
      analytics: true,
      exportData: true,
      apiAccess: false,
      webhooks: false,
      integrations: true,
      customReports: false,
      auditLogs: true,
      backup: false
    },
    premium: {
      analytics: true,
      exportData: true,
      apiAccess: true,
      webhooks: true,
      integrations: true,
      customReports: true,
      auditLogs: true,
      backup: true
    },
    enterprise: {
      analytics: true,
      exportData: true,
      apiAccess: true,
      webhooks: true,
      integrations: true,
      customReports: true,
      auditLogs: true,
      backup: true
    }
  }
  
  return planFeatures[this.plan]?.[feature] || false
}

// Instance method to check usage limits
tenantSchema.methods.checkUsageLimit = function(resource) {
  if (!this.limits[resource]) return true
  return this.usage[resource] < this.limits[resource]
}

// Instance method to increment usage
tenantSchema.methods.incrementUsage = async function(resource, amount = 1) {
  if (!this.usage[resource]) this.usage[resource] = 0
  this.usage[resource] += amount
  await this.save({ validateBeforeSave: false })
}

// Instance method to decrement usage
tenantSchema.methods.decrementUsage = async function(resource, amount = 1) {
  if (!this.usage[resource]) this.usage[resource] = 0
  this.usage[resource] = Math.max(0, this.usage[resource] - amount)
  await this.save({ validateBeforeSave: false })
}

// Instance method to reset usage (for monthly/yearly cycles)
tenantSchema.methods.resetUsage = async function() {
  this.usage.apiCalls = 0
  this.usage.lastReset = new Date()
  await this.save({ validateBeforeSave: false })
}

// Static method to find by domain or slug
tenantSchema.statics.findByDomainOrSlug = function(identifier) {
  return this.findOne({
    $or: [
      { domain: identifier },
      { slug: identifier }
    ]
  }).populate('owner', 'firstName lastName email')
}

// Static method to find active tenants
tenantSchema.statics.findActive = function() {
  return this.find({
    status: { $in: ['active', 'trial'] }
  })
}

// Pre-save middleware to generate database name for advanced multi-tenancy
tenantSchema.pre('save', function(next) {
  if (this.isNew && !this.databaseName) {
    this.databaseName = `tenant_${this.slug}`
  }
  next()
})

module.exports = mongoose.model('Tenant', tenantSchema) 