import { Router } from 'express';
import {
  searchItems,
  voiceSearch,
  getBanners,
  getCategories,
  getCategoryProducts,
  getRecommendedStores,
  getAllRecommendedStores,
  getStoreDetails,
  searchStores,
  getSpecialOffers,
  getHighlights,
  getProductDetails,
  getStoreProducts,
  getDeliveryTimeEstimate,
  getStoreStatus,
} from '../controllers/store.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  searchItemsSchema,
  voiceSearchSchema,
  getBannersSchema,
  getCategoryProductsSchema,
  getRecommendedStoresSchema,
  getAllRecommendedStoresSchema,
  getStoreDetailsSchema,
  searchStoresSchema,
  getSpecialOffersSchema,
  getHighlightsSchema,
  getProductDetailsSchema,
  getStoreProductsSchema,
  getDeliveryTimeEstimateSchema,
  getStoreStatusSchema,
} from '../validations/store.validation';
import { healthCheck } from '../controllers/health.controller';

const router = Router();

// Health check endpoint
router.get('/health', healthCheck('store'));

// Search APIs
router.get('/search', authenticate, validate(searchItemsSchema), searchItems);
router.post('/voice-search', authenticate, validate(voiceSearchSchema), voiceSearch);

// Banner APIs
router.get('/banners', authenticate, validate(getBannersSchema), getBanners);

// Category APIs
router.get('/categories', authenticate, getCategories);
router.get('/categories/:categoryId/products', authenticate, validate(getCategoryProductsSchema), getCategoryProducts);

// Store APIs
router.get('/stores/recommended', authenticate, validate(getRecommendedStoresSchema), getRecommendedStores);
router.get('/stores/recommended/all', authenticate, validate(getAllRecommendedStoresSchema), getAllRecommendedStores);
router.get('/stores/:storeId', authenticate, validate(getStoreDetailsSchema), getStoreDetails);
router.get('/stores/search', authenticate, validate(searchStoresSchema), searchStores);
router.get('/stores/:storeId/status', authenticate, validate(getStoreStatusSchema), getStoreStatus);

// Product APIs
router.get('/products/special-offers', authenticate, validate(getSpecialOffersSchema), getSpecialOffers);
router.get('/products/highlights', authenticate, validate(getHighlightsSchema), getHighlights);
router.get('/products/:productId', authenticate, validate(getProductDetailsSchema), getProductDetails);
router.get('/stores/:storeId/products', authenticate, validate(getStoreProductsSchema), getStoreProducts);

// Utility APIs
router.get('/delivery-time', authenticate, validate(getDeliveryTimeEstimateSchema), getDeliveryTimeEstimate);

export default router;

