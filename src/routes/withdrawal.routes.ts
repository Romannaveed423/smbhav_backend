import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  requestWithdrawal,
  getWithdrawals,
  cancelWithdrawal,
} from '../controllers/withdrawal.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate([
    body('amount').isNumeric().withMessage('Amount must be a number'),
    body('bankDetails.bankName').notEmpty().withMessage('Bank name is required'),
    body('bankDetails.accountNumber').notEmpty().withMessage('Account number is required'),
    body('bankDetails.ifscCode').notEmpty().withMessage('IFSC code is required'),
    body('bankDetails.accountHolderName')
      .notEmpty()
      .withMessage('Account holder name is required'),
  ]),
  requestWithdrawal
);

router.get('/', getWithdrawals);
router.put('/:id/cancel', cancelWithdrawal);

export default router;

