# Sambhav Backend API

A comprehensive backend API built with Node.js, TypeScript, Express, and MongoDB for the Sambhav platform.

## Features

- 🔐 JWT-based authentication with refresh tokens
- 👤 User management and profile
- 🏠 Home dashboard API
- 💰 Earnings module with products, applications, and withdrawals
- 📊 Comprehensive error handling
- ✅ Input validation using Zod
- 🛡️ Security middleware (Helmet, CORS, Rate Limiting)
- 📝 Request logging with Morgan

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT (jsonwebtoken)
- **Validation**: Zod
- **Security**: Helmet, CORS, express-rate-limit
- **Password Hashing**: bcryptjs

## Project Structure

```
sombhav_backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.ts  # MongoDB connection
│   │   └── env.ts       # Environment variables
│   ├── controllers/     # Request handlers
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── home.controller.ts
│   │   └── earnings.controller.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.ts      # Authentication middleware
│   │   ├── errorHandler.ts
│   │   └── validate.ts  # Validation middleware
│   ├── models/          # Mongoose models
│   │   ├── User.ts
│   │   ├── Product.ts
│   │   ├── Offer.ts
│   │   ├── Application.ts
│   │   ├── Earning.ts
│   │   └── Withdrawal.ts
│   ├── routes/          # API routes
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── home.routes.ts
│   │   ├── earnings.routes.ts
│   │   └── index.ts
│   ├── utils/           # Utility functions
│   │   ├── jwt.ts       # JWT utilities
│   │   └── errors.ts    # Error classes
│   ├── validations/     # Zod validation schemas
│   │   ├── auth.validation.ts
│   │   ├── user.validation.ts
│   │   └── earnings.validation.ts
│   └── server.ts        # Main server file
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd sombhav_backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=mongodb://localhost:27017/sambhav
DATABASE_NAME=sambhav

# JWT
JWT_SECRET=your_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=1h
JWT_REFRESH_SECRET=your_refresh_token_secret_change_in_production
JWT_REFRESH_EXPIRES_IN=7d

# Social Login (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret

# File Upload
UPLOAD_MAX_SIZE=5242880
UPLOAD_ALLOWED_TYPES=jpg,jpeg,png,pdf,doc,docx

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password

# Payment Gateway (Optional)
PAYMENT_GATEWAY_API_KEY=your_payment_gateway_key
```

4. Make sure MongoDB is running on your system.

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register a new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/logout` - Logout user

### User Management
- `GET /api/v1/user/profile` - Get user profile
- `PUT /api/v1/user/profile` - Update user profile

### Home Dashboard
- `GET /api/v1/home/dashboard` - Get home dashboard data

### Earnings Module
- `GET /api/v1/earn/dashboard` - Get earnings dashboard
- `GET /api/v1/earn/products` - Get earnings products
- `GET /api/v1/earn/products/:productId/offers` - Get product offers
- `GET /api/v1/earn/products/:productId/detail` - Get product detail
- `POST /api/v1/earn/products/:productId/apply` - Apply for product
- `GET /api/v1/earn/applications/:applicationId/status` - Get application status
- `GET /api/v1/earn/earnings` - Get user earnings
- `POST /api/v1/earn/withdraw` - Withdraw earnings
- `GET /api/v1/earn/withdrawals` - Get withdrawal history

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## Error Handling

The API uses a consistent error response format:

```json
{
  "success": false,
  "message": "Error message",
  "errors": [
    {
      "field": "email",
      "message": "Email is required"
    }
  ],
  "code": "ERROR_CODE"
}
```

## Rate Limiting

- **Public Endpoints**: 100 requests per 15 minutes per IP
- **Authenticated Endpoints**: 1000 requests per 15 minutes per user
- **Login/Register**: 5 requests per 15 minutes per IP

## Database Models

The application uses the following MongoDB collections:
- `users` - User accounts
- `products` - Earning products
- `offers` - Product offers
- `applications` - User applications
- `earnings` - User earnings
- `withdrawals` - Withdrawal requests

## Development

### Building
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Security Considerations

1. **Change JWT secrets** in production
2. **Use HTTPS** in production
3. **Implement proper CORS** configuration
4. **Add request logging** and monitoring
5. **Use environment variables** for sensitive data
6. **Implement database indexing** for frequently queried fields
7. **Use transactions** for financial operations

## Notes

- All timestamps are in ISO 8601 format (UTC)
- All monetary values are in INR (₹)
- File uploads should be handled via multipart/form-data
- Implement proper input sanitization and validation
- Add API documentation (Swagger) for better developer experience

## License

ISC

