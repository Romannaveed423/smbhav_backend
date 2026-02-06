import dotenv from 'dotenv';

dotenv.config();

export const env = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.MONGODB_URI || process.env.DATABASE_URL || 'mongodb://localhost:27017/sombhav',
  jwtSecret: process.env.JWT_SECRET || 'your_jwt_secret_key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your_refresh_token_secret',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  facebookAppId: process.env.FACEBOOK_APP_ID,
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET,
  uploadMaxSize: parseInt(process.env.UPLOAD_MAX_SIZE || '5242880', 10),
  uploadAllowedTypes: process.env.UPLOAD_ALLOWED_TYPES?.split(',') || ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
  baseUrl: process.env.BASE_URL || `http://localhost:${parseInt(process.env.PORT || '3000', 10)}`,
  referralCommissionRate: parseFloat(process.env.REFERRAL_COMMISSION_RATE || '0.1'), // 10% default commission
};

// Export as 'config' for backward compatibility with files that import 'config'
export const config = env;

