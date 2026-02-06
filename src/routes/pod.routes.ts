import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { healthCheck } from '../controllers/health.controller';

// Catalog controllers
import {
  getCategories,
  getSubcategories,
  getProducts,
  getProductDetails,
  searchProducts,
  getBanners,
  getBestSellers,
} from '../controllers/pod/catalog.controller';

// Cart controllers
import {
  addToCart,
  getCartItems,
  updateCartItem,
  removeCartItem,
  clearCart,
} from '../controllers/pod/cart.controller';

// Order controllers
import {
  placeOrder,
  getOrderDetails,
  trackOrder,
  getUserOrders,
  cancelOrder,
  returnOrder,
} from '../controllers/pod/orders.controller';

// Design controllers
import {
  uploadDesign,
  validateDesign,
  generateMockup,
  upload,
  handleMulterError,
} from '../controllers/pod/designs.controller';

// Review controllers
import {
  getProductReviews,
  addReview,
} from '../controllers/pod/reviews.controller';

// Delivery controllers
import {
  getExpressDeliveryInfo,
  checkExpressDelivery,
  getDeliveryCharges,
  getAddressSuggestions,
} from '../controllers/pod/delivery.controller';

// Additional controllers
import {
  applyCoupon,
  getPackagingCategories,
  getPackagingProducts,
} from '../controllers/pod/additional.controller';

// Catalog Categories & Catalogs controllers
import {
  getCatalogCategories,
  getCatalogsByCategory,
  getCatalogDetails,
} from '../controllers/pod/catalog-categories.controller';

// Validation schemas
import {
  getSubcategoriesSchema,
  getProductsSchema,
  getProductDetailsSchema,
  searchProductsSchema,
  getBannersSchema,
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  placeOrderSchema,
  getOrderDetailsSchema,
  trackOrderSchema,
  getUserOrdersSchema,
  cancelOrderSchema,
  returnOrderSchema,
  checkExpressDeliverySchema,
  getDeliveryChargesSchema,
  getAddressSuggestionsSchema,
  uploadDesignSchema,
  validateDesignSchema,
  generateMockupSchema,
  getProductReviewsSchema,
  addReviewSchema,
  applyCouponSchema,
  getPackagingProductsSchema,
  getBestSellersSchema,
} from '../validations/pod.validation';

const router = Router();

// Health check endpoint
router.get('/health', healthCheck('pod'));

// ==================== Catalog Routes ====================
router.get('/categories', authenticate, getCategories);
router.get('/categories/:categoryId/subcategories', authenticate, validate(getSubcategoriesSchema), getSubcategories);
router.get('/products', authenticate, validate(getProductsSchema), getProducts);
router.get('/products/:productId', authenticate, validate(getProductDetailsSchema), getProductDetails);
router.get('/products/search', authenticate, validate(searchProductsSchema), searchProducts);
router.get('/products/best-sellers', authenticate, validate(getBestSellersSchema), getBestSellers);
router.get('/banners', authenticate, validate(getBannersSchema), getBanners);

// ==================== Cart Routes ====================
router.post('/cart/add', authenticate, validate(addToCartSchema), addToCart);
router.get('/cart', authenticate, getCartItems);
router.patch('/cart/:cartItemId', authenticate, validate(updateCartItemSchema), updateCartItem);
router.delete('/cart/:cartItemId', authenticate, validate(removeCartItemSchema), removeCartItem);
router.delete('/cart', authenticate, clearCart);

// ==================== Order Routes ====================
router.post('/orders', authenticate, validate(placeOrderSchema), placeOrder);
router.get('/orders', authenticate, validate(getUserOrdersSchema), getUserOrders);
router.get('/orders/:orderId', authenticate, validate(getOrderDetailsSchema), getOrderDetails);
router.get('/orders/track/:orderId', validate(trackOrderSchema), trackOrder); // Public endpoint
router.post('/orders/:orderId/cancel', authenticate, validate(cancelOrderSchema), cancelOrder);
router.post('/orders/:orderId/return', authenticate, validate(returnOrderSchema), returnOrder);

// ==================== Design Routes ====================
router.post('/designs/upload', authenticate, upload.single('file'), handleMulterError, validate(uploadDesignSchema), uploadDesign);
router.post('/designs/validate', authenticate, validate(validateDesignSchema), validateDesign);
router.post('/mockup/generate', authenticate, validate(generateMockupSchema), generateMockup);

// ==================== Review Routes ====================
router.get('/products/:productId/reviews', authenticate, validate(getProductReviewsSchema), getProductReviews);
router.post('/products/:productId/reviews', authenticate, validate(addReviewSchema), addReview);

// ==================== Delivery Routes ====================
router.get('/express-delivery/info', authenticate, getExpressDeliveryInfo);
router.get('/products/:productId/express-delivery', authenticate, validate(checkExpressDeliverySchema), checkExpressDelivery);
router.get('/delivery/charges', authenticate, validate(getDeliveryChargesSchema), getDeliveryCharges);
router.get('/addresses/suggestions', authenticate, validate(getAddressSuggestionsSchema), getAddressSuggestions);

// ==================== Additional Routes ====================
router.post('/coupons/apply', authenticate, validate(applyCouponSchema), applyCoupon);
router.get('/packaging/categories', authenticate, getPackagingCategories);
router.get('/packaging/products', authenticate, validate(getPackagingProductsSchema), getPackagingProducts);

// ==================== Catalog Categories & Catalogs Routes ====================
router.get('/catalog-categories', authenticate, getCatalogCategories);
router.get('/catalog-categories/:categoryId/catalogs', authenticate, getCatalogsByCategory);
router.get('/catalogs/:catalogId', authenticate, getCatalogDetails);

export default router;

