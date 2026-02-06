import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { loginWithEmailPassword, logoutController } from '../controllers/auth.controller';
import {
  createProduct,
  updateProduct,
  deleteProduct,
  getAllLeads,
  getLeadById,
  getPendingKYC,
  verifyKYCDocument,
  getPendingWithdrawals,
  processWithdrawal,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getAdminDashboardStats,
} from '../controllers/admin.controller';
import { getProducts } from '../controllers/product.controller';
import { getCampaigns } from '../controllers/campaign.controller';

const router = Router();

// Public admin routes (no auth required)
router.post(
  '/auth/login',
  validate([
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  (req, res, next) => {
    // Add requireAdmin flag for admin login route
    req.body.requireAdmin = true;
    loginWithEmailPassword(req, res, next);
  }
);

router.post('/auth/logout', logoutController);

// Protected admin routes (require authentication and admin role)
router.use(authenticate);
router.use(requireAdmin);

// Dashboard
router.get('/dashboard/stats', getAdminDashboardStats);

// Products
router.get('/products', getProducts);
router.post('/products', createProduct);
router.put('/products/:id', updateProduct);
router.delete('/products/:id', deleteProduct);

// Leads
router.get('/leads/all', getAllLeads);
router.get('/leads/:id', getLeadById);

// KYC
router.get('/kyc/pending', getPendingKYC);
router.put('/kyc/documents/:id', verifyKYCDocument);

// Withdrawals
router.get('/withdrawals/pending', getPendingWithdrawals);
router.put('/withdrawals/:id', processWithdrawal);

// Campaigns
router.get('/campaigns', getCampaigns);
router.post('/campaigns', createCampaign);
router.put('/campaigns/:id', updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);

// Users
router.get('/users', getAllUsers);
router.get('/users/:id', getUserById);
router.put('/users/:id/status', updateUserStatus);

export default router;

