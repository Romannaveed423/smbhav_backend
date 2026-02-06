import { Router } from 'express';
import {
  getAdminSIPApplications,
  getAdminSIPApplicationDetails,
  updateSIPApplicationStatus,
  getAdminMutualFundApplications,
  getAdminMutualFundApplicationDetails,
  updateMutualFundApplicationStatus,
} from '../../controllers/admin/financial-applications.controller';
import {
  getAdminInsuranceApplications,
  getAdminInsuranceApplicationDetails,
  updateInsuranceApplicationStatus,
  getAdminLoanApplications,
  getAdminLoanApplicationDetails,
  updateLoanApplicationStatus,
} from '../../controllers/admin/insurance-loan-applications.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import {
  getAdminSIPApplicationsSchema,
  updateSIPApplicationStatusSchema,
  getAdminMutualFundApplicationsSchema,
  updateMutualFundApplicationStatusSchema,
  getAdminSIPApplicationDetailsSchema,
  getAdminMutualFundApplicationDetailsSchema,
  getAdminInsuranceApplicationsSchema,
  updateInsuranceApplicationStatusSchema,
  getAdminLoanApplicationsSchema,
  updateLoanApplicationStatusSchema,
  getAdminInsuranceApplicationDetailsSchema,
  getAdminLoanApplicationDetailsSchema,
} from '../../validations/financial-applications.validation';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// SIP Application routes
router.get('/sip-applications', validate(getAdminSIPApplicationsSchema), getAdminSIPApplications);
router.get('/sip-applications/:applicationId', validate(getAdminSIPApplicationDetailsSchema), getAdminSIPApplicationDetails);
router.patch('/sip-applications/:applicationId/status', validate(updateSIPApplicationStatusSchema), updateSIPApplicationStatus);

// Mutual Fund Application routes
router.get('/mutual-fund-applications', validate(getAdminMutualFundApplicationsSchema), getAdminMutualFundApplications);
router.get('/mutual-fund-applications/:applicationId', validate(getAdminMutualFundApplicationDetailsSchema), getAdminMutualFundApplicationDetails);
router.patch('/mutual-fund-applications/:applicationId/status', validate(updateMutualFundApplicationStatusSchema), updateMutualFundApplicationStatus);

// Insurance Application routes
router.get('/insurance-applications', validate(getAdminInsuranceApplicationsSchema), getAdminInsuranceApplications);
router.get('/insurance-applications/:applicationId', validate(getAdminInsuranceApplicationDetailsSchema), getAdminInsuranceApplicationDetails);
router.patch('/insurance-applications/:applicationId/status', validate(updateInsuranceApplicationStatusSchema), updateInsuranceApplicationStatus);

// Loan Application routes
router.get('/loan-applications', validate(getAdminLoanApplicationsSchema), getAdminLoanApplications);
router.get('/loan-applications/:applicationId', validate(getAdminLoanApplicationDetailsSchema), getAdminLoanApplicationDetails);
router.patch('/loan-applications/:applicationId/status', validate(updateLoanApplicationStatusSchema), updateLoanApplicationStatus);

export default router;

