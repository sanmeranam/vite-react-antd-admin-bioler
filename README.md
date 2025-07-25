# Enterprise SaaS Portal

A comprehensive, enterprise-grade SaaS application built with React, Node.js, and MongoDB. This boilerplate provides a solid foundation for multi-tenant SaaS applications with advanced features including real-time notifications, RBAC, theming, and more.

<img width="759" height="412" alt="Screenshot 2025-07-25 at 11 42 25 AM" src="https://github.com/user-attachments/assets/48f757ec-9a43-410d-8aa9-cade4f6dcbb8" />


## 🚀 Features

### Frontend (React 19 + Vite)
- **Modern UI/UX**: Enterprise-grade design with Ant Design components
- **Responsive Layout**: Works seamlessly across all device sizes
- **Theme System**: Light/Dark/Compact themes with custom theme support
- **Real-time Updates**: Socket.io integration for live notifications
- **Authentication**: Complete auth flow with JWT and session management
- **Route Protection**: RBAC-based route and component access control
- **State Management**: Zustand for application state with persistence
- **API Layer**: React Query for efficient data fetching and caching
- **Reusable Components**: Comprehensive component library

### Backend (Node.js + Express)
- **Multi-tenancy**: Built-in tenant isolation and management
- **Authentication & Authorization**: JWT, sessions, RBAC with granular permissions
- **Real-time Communication**: Socket.io for notifications and live updates
- **File Management**: Upload, processing, and storage with multiple providers
- **Security**: Rate limiting, CORS, helmet, input validation
- **Database**: MongoDB with Mongoose and tenant-specific data isolation
- **Logging**: Winston-based structured logging
- **API Documentation**: Auto-generated documentation
- **Export System**: CSV, PDF, MD export capabilities

### DevOps & Production Ready
- **Environment Configuration**: Comprehensive environment variable setup
- **Security Best Practices**: OWASP compliant security measures
- **Performance Optimization**: Caching, compression, and optimization
- **Monitoring**: Health checks and performance monitoring
- **Scalability**: Horizontal scaling ready architecture

## 📁 Project Structure

```
saas-boiler/
├── src/
│   ├── client/                 # Frontend React application
│   │   ├── components/         # Reusable UI components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── common/        # Common UI components
│   │   │   ├── layout/        # Layout components (Header, Sidebar, etc.)
│   │   │   ├── notifications/ # Notification system
│   │   │   └── users/         # User management components
│   │   ├── contexts/          # React contexts (Auth, Theme)
│   │   ├── hooks/             # Custom React hooks
│   │   ├── pages/             # Page components
│   │   │   ├── auth/          # Authentication pages
│   │   │   ├── dashboard/     # Dashboard pages
│   │   │   ├── users/         # User management pages
│   │   │   └── settings/      # Settings pages
│   │   ├── services/          # API services and utilities
│   │   └── styles/            # Global styles and themes
│   └── server/                 # Backend Node.js application
│       ├── controllers/       # Route controllers
│       ├── middleware/        # Express middleware
│       ├── models/           # Database models
│       ├── routes/           # API routes
│       ├── services/         # Business logic services
│       └── utils/            # Utility functions
├── public/                    # Static assets
├── uploads/                   # File uploads (development)
└── docs/                     # Documentation
```

## 🛠️ Tech Stack

### Frontend
- **React 19** - Latest React with concurrent features
- **Vite** - Fast build tool and dev server
- **Ant Design** - Enterprise UI component library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **Zustand** - Lightweight state management
- **Socket.io Client** - Real-time communication
- **React Hook Form** - Form handling with validation
- **Framer Motion** - Animations and transitions

### Backend
- **Node.js** - JavaScript runtime
- **Express** - Web application framework
- **MongoDB** - NoSQL database
- **Mongoose** - MongoDB object modeling
- **Socket.io** - Real-time communication
- **JWT** - JSON Web Tokens for authentication
- **Passport.js** - Authentication middleware
- **Winston** - Logging library
- **Helmet** - Security middleware

### Development Tools
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Development server auto-restart
- **Concurrently** - Run multiple commands

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (v5 or higher)
- Redis (optional, for session storage)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/saas-boiler.git
   cd saas-boiler
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # Using MongoDB locally
   mongod
   
   # Or using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:latest
   ```

5. **Start the application**
   ```bash
   # Development mode (starts both frontend and backend)
   npm run dev
   
   # Or start separately
   npm run client  # Frontend only
   npm run server  # Backend only
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000

## 🔧 Configuration

### Environment Variables

Key environment variables you need to configure:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/saas-portal

# JWT Secrets
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-token-secret

# Session
SESSION_SECRET=your-session-secret

# Email (for notifications)
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

See `.env.example` for complete configuration options.

### Theme Customization

The application supports multiple themes and custom branding:

```javascript
// In your tenant settings
const customTheme = {
  token: {
    colorPrimary: '#1890ff',
    colorBgContainer: '#ffffff',
    // ... other theme tokens
  }
}
```

## 📱 Key Features

### 1. Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (RBAC)
- Multi-factor authentication ready
- Session management and tracking
- Password reset functionality

### 2. Multi-tenancy
- Complete tenant isolation
- Tenant-specific branding and themes
- Per-tenant configuration
- Data segregation at database level

### 3. Real-time Features
- Live notifications
- Real-time data updates
- User activity tracking
- System status monitoring

### 4. User Management
- User registration and invitation
- Role and permission management
- Bulk user operations
- User activity logs

### 5. Export & Reporting
- CSV, PDF, and Markdown exports
- Customizable report templates
- Scheduled reports
- Data visualization

## 🔒 Security

This application implements multiple security layers:

- **Input Validation**: All inputs are validated and sanitized
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Proper CORS configuration
- **Helmet**: Security headers with Helmet.js
- **JWT Security**: Secure token generation and validation
- **Password Security**: Bcrypt hashing with salt rounds
- **Session Security**: Secure session configuration

## 🧪 Testing

```bash
# Run frontend tests
npm run test:client

# Run backend tests
npm run test:server

# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage
```

## 🚀 Deployment

### Production Build

```bash
# Build frontend for production
npm run build

# Start production server
npm start
```

### Docker Deployment

```bash
# Build Docker image
docker build -t saas-portal .

# Run with Docker Compose
docker-compose up -d
```

### Environment-specific Deployment

The application supports multiple deployment environments:

- **Development**: Full debugging and hot reloading
- **Staging**: Production-like environment for testing
- **Production**: Optimized for performance and security

## 📊 Monitoring

The application includes built-in monitoring and observability:

- **Health Checks**: `/api/health` endpoint
- **Metrics**: Performance and usage metrics
- **Logging**: Structured logging with Winston
- **Error Tracking**: Integration ready for Sentry
- **Analytics**: User behavior tracking

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 API Documentation

Once the server is running, API documentation is available at:
- Swagger UI: http://localhost:5000/api-docs
- OpenAPI Spec: http://localhost:5000/api-docs.json

## 🔧 Customization

### Adding New Components

1. Create component in appropriate directory under `src/client/components/`
2. Export from `index.js` for easy importing
3. Add proper TypeScript types if using TypeScript
4. Include unit tests

### Adding New API Endpoints

1. Create controller in `src/server/controllers/`
2. Define routes in `src/server/routes/`
3. Add middleware if needed
4. Update API documentation

### Custom Themes

See the Theme System documentation for details on creating custom themes and branding.

## 📚 Additional Resources

- [Component Library Documentation](./docs/components.md)
- [API Reference](./docs/api.md)
- [Deployment Guide](./docs/deployment.md)
- [Contributing Guidelines](./docs/contributing.md)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

---

Built with ❤️ for enterprise SaaS applications
