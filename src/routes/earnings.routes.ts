import { Router } from 'express';
import {
  getEarningsDashboard,
  getEarningsProducts,
  getOffers,
  getProductOffers,
  getProductDetail,
  applyForProduct,
  getApplicationStatus,
  getEarnings,
  withdrawEarnings,
  getWithdrawals,
  handlePostback,
  generateClick,
  trackClick,
  createOfferApplication,
} from '../controllers/earnings.controller';
import {
  submitSIPApplication,
  getSIPApplicationStatus,
  getUserSIPApplications,
  submitMutualFundApplication,
  getMutualFundApplicationStatus,
  getUserMutualFundApplications,
} from '../controllers/financial-applications.controller';
import {
  submitInsuranceApplication,
  getInsuranceApplicationStatus,
  getUserInsuranceApplications,
  submitLoanApplication,
  getLoanApplicationStatus,
  getUserLoanApplications,
} from '../controllers/insurance-loan-applications.controller';
import {
  createPublicTask,
  getPublicTasks,
  getMyPublicTasks,
} from '../controllers/public-tasks.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  getEarningsDashboardSchema,
  getEarningsProductsSchema,
  getOffersSchema,
  getEarningsSchema,
  withdrawEarningsSchema,
  getWithdrawalsSchema,
  applyForProductSchema,
  postbackSchema,
  generateClickSchema,
  createOfferApplicationSchema,
} from '../validations/earnings.validation';
import {
  submitSIPApplicationSchema,
  getSIPApplicationStatusSchema,
  getUserSIPApplicationsSchema,
  submitMutualFundApplicationSchema,
  getMutualFundApplicationStatusSchema,
  getUserMutualFundApplicationsSchema,
  submitInsuranceApplicationSchema,
  getInsuranceApplicationStatusSchema,
  getUserInsuranceApplicationsSchema,
  submitLoanApplicationSchema,
  getLoanApplicationStatusSchema,
  getUserLoanApplicationsSchema,
} from '../validations/financial-applications.validation';
import {
  createPublicTaskSchema,
  getPublicTasksSchema,
  getMyPublicTasksSchema,
} from '../validations/public-tasks.validation';
import { healthCheck } from '../controllers/health.controller';

const router = Router();

// Health check endpoint
router.get('/health', healthCheck('earnings'));

router.get('/dashboard', authenticate, validate(getEarningsDashboardSchema), getEarningsDashboard);
router.get('/products', authenticate, validate(getEarningsProductsSchema), getEarningsProducts);
router.get('/offers', authenticate, validate(getOffersSchema), getOffers);
router.post('/offer-applications', authenticate, validate(createOfferApplicationSchema), createOfferApplication);
router.get('/products/:productId/offers', authenticate, getProductOffers);
router.get('/products/:productId/detail', authenticate, getProductDetail);
router.post('/products/:productId/apply', authenticate, validate(applyForProductSchema), applyForProduct);
router.post('/products/:productId/click', authenticate, validate(generateClickSchema), generateClick);
router.get('/applications/:applicationId/status', authenticate, getApplicationStatus);
router.get('/track/:clickId', trackClick); // Optional analytics endpoint, no auth required
router.get('/earnings', authenticate, validate(getEarningsSchema), getEarnings);
router.post('/withdraw', authenticate, validate(withdrawEarningsSchema), withdrawEarnings);
router.get('/withdrawals', authenticate, validate(getWithdrawalsSchema), getWithdrawals);
// Postback endpoint (no authentication required - uses tracking token for security)
router.post('/postback', validate(postbackSchema), handlePostback);

// SIP Application routes
router.post('/sip-applications', authenticate, validate(submitSIPApplicationSchema), submitSIPApplication);
router.get('/sip-applications', authenticate, validate(getUserSIPApplicationsSchema), getUserSIPApplications);
router.get('/sip-applications/:applicationId/status', authenticate, validate(getSIPApplicationStatusSchema), getSIPApplicationStatus);

// Mutual Fund Application routes
router.post('/mutual-fund-applications', authenticate, validate(submitMutualFundApplicationSchema), submitMutualFundApplication);
router.get('/mutual-fund-applications', authenticate, validate(getUserMutualFundApplicationsSchema), getUserMutualFundApplications);
router.get('/mutual-fund-applications/:applicationId/status', authenticate, validate(getMutualFundApplicationStatusSchema), getMutualFundApplicationStatus);

// Insurance Application routes
router.post('/insurance-applications', authenticate, validate(submitInsuranceApplicationSchema), submitInsuranceApplication);
router.get('/insurance-applications', authenticate, validate(getUserInsuranceApplicationsSchema), getUserInsuranceApplications);
router.get('/insurance-applications/:applicationId/status', authenticate, validate(getInsuranceApplicationStatusSchema), getInsuranceApplicationStatus);

// Loan Application routes
router.post('/loan-applications', authenticate, validate(submitLoanApplicationSchema), submitLoanApplication);
router.get('/loan-applications', authenticate, validate(getUserLoanApplicationsSchema), getUserLoanApplications);
router.get('/loan-applications/:applicationId/status', authenticate, validate(getLoanApplicationStatusSchema), getLoanApplicationStatus);

// Public Tasks routes
router.post('/public-tasks', authenticate, validate(createPublicTaskSchema), createPublicTask);
router.get('/public-tasks', authenticate, validate(getPublicTasksSchema), getPublicTasks);
router.get('/my-public-tasks', authenticate, validate(getMyPublicTasksSchema), getMyPublicTasks);

export default router;

