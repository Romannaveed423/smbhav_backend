import { Router } from 'express';
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  duplicateProduct,
  toggleProductStatus,
  getProductStatistics,
} from '../../controllers/admin/products.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import {
  listProductsSchema,
  getProductSchema,
  createProductSchema,
  updateProductSchema,
  deleteProductSchema,
  duplicateProductSchema,
  toggleProductStatusSchema,
  getProductStatisticsSchema,
} from '../../validations/admin/products.validation';
import { productUpload, handleMulterError } from '../../utils/fileUpload';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Product routes - all routes are under /products
router.get('/products', validate(listProductsSchema), listProducts);
router.get('/products/:productId', validate(getProductSchema), getProduct);
router.post(
  '/products',
  productUpload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'icon', maxCount: 1 },
  ]),
  handleMulterError,
  validate(createProductSchema),
  createProduct
);
router.put(
  '/products/:productId',
  productUpload.fields([
    { name: 'logo', maxCount: 1 },
    { name: 'icon', maxCount: 1 },
  ]),
  handleMulterError,
  validate(updateProductSchema),
  updateProduct
);
router.delete('/products/:productId', validate(deleteProductSchema), deleteProduct);
router.post('/products/:productId/duplicate', validate(duplicateProductSchema), duplicateProduct);
router.post('/products/:productId/toggle-status', validate(toggleProductStatusSchema), toggleProductStatus);
router.get('/products/:productId/statistics', validate(getProductStatisticsSchema), getProductStatistics);

export default router;

