import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  createLead,
  getLeads,
  getLeadById,
  updateLeadStatus,
} from '../controllers/lead.controller';

const router = Router();

router.use(authenticate);

router.post(
  '/',
  validate([
    body('customerName').notEmpty().withMessage('Customer name is required'),
    body('customerPhone').notEmpty().withMessage('Customer phone is required'),
    body('productId').notEmpty().withMessage('Product ID is required'),
  ]),
  createLead
);

router.get('/', getLeads);
router.get('/:id', getLeadById);
router.put('/:id/status', updateLeadStatus);

export default router;

