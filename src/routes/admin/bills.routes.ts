import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import {
  listAdminBillServices,
  createAdminBillService,
  updateAdminBillService,
  toggleAdminBillServiceStatus,
  listAdminBillTransactions,
  getAdminBillTransaction,
  refundAdminBillTransaction,
} from '../../controllers/admin/bills.controller';
import {
  listAdminBillServicesSchema,
  createAdminBillServiceSchema,
  updateAdminBillServiceSchema,
  toggleAdminBillServiceStatusSchema,
  listAdminBillTransactionsSchema,
  getAdminBillTransactionSchema,
  refundAdminBillTransactionSchema,
} from '../../validations/admin/bills.validation';

const router = Router();

// All admin bills routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Bill services management
router.get('/services', validate(listAdminBillServicesSchema), listAdminBillServices);
router.post('/services', validate(createAdminBillServiceSchema), createAdminBillService);
router.put('/services/:serviceId', validate(updateAdminBillServiceSchema), updateAdminBillService);
router.put(
  '/services/:serviceId/status',
  validate(toggleAdminBillServiceStatusSchema),
  toggleAdminBillServiceStatus
);

// Bill transactions management
router.get('/transactions', validate(listAdminBillTransactionsSchema), listAdminBillTransactions);
router.get('/transactions/:transactionId', validate(getAdminBillTransactionSchema), getAdminBillTransaction);
router.post(
  '/transactions/:transactionId/refund',
  validate(refundAdminBillTransactionSchema),
  refundAdminBillTransaction
);

export default router;

