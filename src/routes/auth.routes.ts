import { Router } from 'express';
import {
  register,
  login,
  refreshToken,
  forgotPassword,
  resetPassword,
  logout,
} from '../controllers/auth.controller';
import { validate } from '../middleware/validate';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../validations/auth.validation';
import { authenticate } from '../middleware/auth';
import { healthCheck } from '../controllers/health.controller';

const router = Router();

// Health check endpoint
router.get('/health', healthCheck('auth'));

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh', validate(refreshTokenSchema), refreshToken);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);
router.post('/logout', authenticate, logout);

export default router;

