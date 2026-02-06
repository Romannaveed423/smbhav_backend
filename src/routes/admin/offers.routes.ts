import { Router } from 'express';
import {
  listOffers,
  getProductOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  createStandaloneOffer,
} from '../../controllers/admin/offers.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import {
  listOffersSchema,
  getProductOffersSchema,
  createOfferSchema,
  updateOfferSchema,
  deleteOfferSchema,
  createStandaloneOfferSchema,
} from '../../validations/admin/offers.validation';
import { productUpload, offerUpload, handleMulterError } from '../../utils/fileUpload';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Offer routes
// List all offers
router.get('/offers', validate(listOffersSchema), listOffers);

// Standalone offer creation
router.post(
  '/offers',
  offerUpload.fields([
    { name: 'image', maxCount: 1 },
    { name: 'icon', maxCount: 1 },
    { name: 'payoutFile', maxCount: 1 },
  ]),
  handleMulterError,
  validate(createStandaloneOfferSchema),
  createStandaloneOffer
);

// Product-linked offers (existing endpoints)
router.get('/products/:productId/offers', validate(getProductOffersSchema), getProductOffers);
router.post(
  '/products/:productId/offers',
  productUpload.single('icon'),
  handleMulterError,
  validate(createOfferSchema),
  createOffer
);
router.put(
  '/offers/:offerId',
  productUpload.single('icon'),
  handleMulterError,
  validate(updateOfferSchema),
  updateOffer
);
router.delete('/offers/:offerId', validate(deleteOfferSchema), deleteOffer);

export default router;

