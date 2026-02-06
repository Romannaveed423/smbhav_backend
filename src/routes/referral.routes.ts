import { Router } from 'express';
import {
  getReferralDashboard,
  getReferrals,
  getReferralCommissions,
  verifyReferralCode,
} from '../controllers/referral.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getReferralsSchema,
  getReferralCommissionsSchema,
  verifyReferralCodeSchema,
} from '../validations/referral.validation';
import { healthCheck } from '../controllers/health.controller';

const router = Router();

// Health check endpoint
router.get('/health', healthCheck('referral'));

// All routes require authentication
router.get('/dashboard', authenticate, getReferralDashboard);
router.get('/referrals', authenticate, validate(getReferralsSchema), getReferrals);
router.get('/commissions', authenticate, validate(getReferralCommissionsSchema), getReferralCommissions);
router.get('/verify-code', authenticate, validate(verifyReferralCodeSchema), verifyReferralCode);

export default router;

