const nodemailer = require('nodemailer')
const { logger } = require('./logger')

/**
 * Email service for sending transactional emails
 * Supports SMTP configuration and HTML templates
 */
class EmailService {
  constructor() {
    this.transporter = this.createTransporter()
  }

  createTransporter() {
    // if (process.env.NODE_ENV === 'production') {
    //   // Production email configuration
    //   return nodemailer.createTransporter({
    //     host: process.env.SMTP_HOST,
    //     port: process.env.SMTP_PORT || 587,
    //     secure: process.env.SMTP_SECURE === 'true',
    //     auth: {
    //       user: process.env.SMTP_USER,
    //       pass: process.env.SMTP_PASS
    //     }
    //   })
    // } else {
    //   // Development configuration (mock transporter)
    //   return nodemailer.createTransporter({
    //     streamTransport: true,
    //     newline: 'unix',
    //     buffer: true
    //   })
    // }
  }

  async sendEmail(options) {
    try {
      // Define email options
      const mailOptions = {
        from: process.env.EMAIL_FROM || 'SaaS Portal <noreply@saas-portal.com>',
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html || this.generateHtmlTemplate(options.subject, options.message)
      }

      // Send the email
      const info = await this.transporter.sendMail(mailOptions)
      
      const emailLogger = logger.child({ context: 'EMAIL' })
      emailLogger.info({ 
        messageId: info.messageId,
        to: options.email,
        subject: options.subject
      }, 'Email sent successfully')
      
      if (process.env.NODE_ENV === 'development') {
        emailLogger.debug({ content: info.message.toString() }, 'Email content')
      }
      
      return info
    } catch (error) {
      const emailLogger = logger.child({ context: 'EMAIL' })
      emailLogger.error({ 
        err: error,
        to: options.email,
        subject: options.subject 
      }, 'Email sending failed')
      
      // In development, don't throw error for email failures
      if (process.env.NODE_ENV === 'development') {
        emailLogger.debug({ options }, 'Email would have been sent in production')
        return { messageId: 'dev-' + Date.now() }
      }
      throw new Error('Email could not be sent')
    }
  }

  generateHtmlTemplate(subject, message) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background-color: #f4f4f4;
            margin: 0;
            padding: 0;
          }
          .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .email-content {
            background-color: #ffffff;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background-color: #1890ff;
            color: white;
            width: 60px;
            height: 60px;
            border-radius: 8px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
          }
          .title {
            color: #1890ff;
            margin: 0;
            font-size: 24px;
            font-weight: 300;
          }
          .message {
            font-size: 16px;
            line-height: 1.6;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 14px;
          }
          .button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #1890ff;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            margin: 20px 0;
            font-weight: 500;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="email-content">
            <div class="header">
              <div class="logo">B</div>
              <h1 class="title">Broadcom SaaS Portal</h1>
            </div>
            
            <div class="message">
              ${message.replace(/\n/g, '<br>')}
            </div>
            
            <div class="footer">
              <p>© 2024 Broadcom Inc. All rights reserved.</p>
              <p>This is an automated message, please do not reply.</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `
  }

  // Pre-defined email templates
  async sendWelcomeEmail(user, tenant) {
    const subject = `Welcome to ${tenant.productName}!`
    const message = `
      Hello ${user.firstName},
      
      Welcome to ${tenant.productName}! We're excited to have you on board.
      
      Your account has been successfully created and you can now start exploring all the features available to you.
      
      If you have any questions or need assistance, don't hesitate to reach out to our support team.
      
      Best regards,
      The ${tenant.companyName} Team
    `
    
    return this.sendEmail({
      email: user.email,
      subject,
      message
    })
  }

  async sendPasswordResetEmail(user, resetUrl) {
    const subject = 'Password Reset Request'
    const message = `
      Hello ${user.firstName},
      
      You requested a password reset for your account.
      
      Please click the link below to reset your password:
      ${resetUrl}
      
      This link will expire in 10 minutes for security reasons.
      
      If you didn't request this password reset, please ignore this email.
      
      Best regards,
      Security Team
    `
    
    return this.sendEmail({
      email: user.email,
      subject,
      message
    })
  }

  async sendEmailVerification(user, verificationUrl) {
    const subject = 'Please verify your email address'
    const message = `
      Hello ${user.firstName},
      
      Thank you for signing up! Please verify your email address by clicking the link below:
      
      ${verificationUrl}
      
      This link will expire in 24 hours.
      
      If you didn't create this account, please ignore this email.
      
      Best regards,
      The Team
    `
    
    return this.sendEmail({
      email: user.email,
      subject,
      message
    })
  }

  async sendUserInvitation(inviterUser, invitedEmail, tenant, invitationUrl) {
    const subject = `You've been invited to join ${tenant.productName}`
    const message = `
      Hello,
      
      ${inviterUser.firstName} ${inviterUser.lastName} has invited you to join ${tenant.productName}.
      
      Click the link below to accept the invitation and create your account:
      ${invitationUrl}
      
      This invitation will expire in 7 days.
      
      Best regards,
      The ${tenant.companyName} Team
    `
    
    return this.sendEmail({
      email: invitedEmail,
      subject,
      message
    })
  }
}

// Create and export singleton instance
const emailService = new EmailService()

// Export the main send function for backwards compatibility
module.exports = (options) => emailService.sendEmail(options)

// Export the service instance for advanced usage
module.exports.emailService = emailService 