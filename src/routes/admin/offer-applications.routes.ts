import { Router } from 'express';
import {
  listOfferApplications,
  getOfferApplication,
  updateOfferApplicationStatus,
  activateOfferApplication,
  deleteOfferApplication,
  bulkUpdateOfferApplicationStatus,
} from '../../controllers/admin/offer-applications.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import {
  listOfferApplicationsSchema,
  getOfferApplicationSchema,
  updateOfferApplicationStatusSchema,
  activateOfferApplicationSchema,
  deleteOfferApplicationSchema,
  bulkUpdateOfferApplicationStatusSchema,
} from '../../validations/admin/offer-applications.validation';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// List all offer applications
router.get('/', validate(listOfferApplicationsSchema), listOfferApplications);

// Bulk update status
router.post('/bulk-status', validate(bulkUpdateOfferApplicationStatusSchema), bulkUpdateOfferApplicationStatus);

// Get single offer application
router.get('/:applicationId', validate(getOfferApplicationSchema), getOfferApplication);

// Update offer application status
router.put('/:applicationId/status', validate(updateOfferApplicationStatusSchema), updateOfferApplicationStatus);

// Activate offer application
router.put('/:applicationId/activate', validate(activateOfferApplicationSchema), activateOfferApplication);

// Delete offer application
router.delete('/:applicationId', validate(deleteOfferApplicationSchema), deleteOfferApplication);

export default router;

