import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  listBillServices,
  payBill,
  listUserBillTransactions,
  getUserBillTransaction,
} from '../controllers/bills.controller';
import {
  listBillServicesSchema,
  payBillSchema,
  listUserBillTransactionsSchema,
  getUserBillTransactionSchema,
} from '../validations/bills.validation';

const router = Router();

router.use(authenticate);

router.get('/services', validate(listBillServicesSchema), listBillServices);
router.post('/pay', validate(payBillSchema), payBill);
router.get('/transactions', validate(listUserBillTransactionsSchema), listUserBillTransactions);
router.get('/transactions/:transactionId', validate(getUserBillTransactionSchema), getUserBillTransaction);

export default router;

