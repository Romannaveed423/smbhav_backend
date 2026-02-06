import { Router } from 'express';
import {
  createUser,
  listUsers,
  getUser,
  updateUser,
  deleteUser,
  changeRole,
  verifyEmail,
  verifyPhone,
  updateKycStatus,
  getUserStatistics,
  adjustUserBalance,
  freezeUser,
  getUserTransactions,
} from '../../controllers/admin/users.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import {
  createUserSchema,
  listUsersSchema,
  getUserSchema,
  updateUserSchema,
  deleteUserSchema,
  changeRoleSchema,
  verifyEmailSchema,
  verifyPhoneSchema,
  updateKycStatusSchema,
  getUserStatisticsSchema,
  adjustUserBalanceSchema,
  freezeUserSchema,
  getUserTransactionsSchema,
} from '../../validations/admin/users.validation';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Create user
router.post('/', validate(createUserSchema), createUser);

// List all users
router.get('/', validate(listUsersSchema), listUsers);

// Specific :userId routes (must be before generic /:userId)
router.get('/:userId/statistics', validate(getUserStatisticsSchema), getUserStatistics);
router.get('/:userId/transactions', validate(getUserTransactionsSchema), getUserTransactions);
router.put('/:userId/role', validate(changeRoleSchema), changeRole);
router.put('/:userId/verify-email', validate(verifyEmailSchema), verifyEmail);
router.put('/:userId/verify-phone', validate(verifyPhoneSchema), verifyPhone);
router.put('/:userId/kyc-status', validate(updateKycStatusSchema), updateKycStatus);

// Get single user
router.get('/:userId', validate(getUserSchema), getUser);

// Update user
router.put('/:userId', validate(updateUserSchema), updateUser);

// Adjust user balance
router.post('/:userId/adjust-balance', validate(adjustUserBalanceSchema), adjustUserBalance);

// Freeze/unfreeze user
router.post('/:userId/freeze', validate(freezeUserSchema), freezeUser);

// Delete user (soft or hard)
router.delete('/:userId', validate(deleteUserSchema), deleteUser);

export default router;

