import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import { catalogUpload, catalogCategoryUpload, podProductUpload, podBannerUpload, handlePodMulterError } from '../../utils/podFileUpload';

// POD Orders controllers
import {
  listPODOrders,
  getPODOrder,
  updatePODOrderStatus,
  shipPODOrder,
  cancelPODOrder,
} from '../../controllers/admin/pod/orders.controller';

// POD Designs controllers
import {
  listPODDesigns,
  getPODDesign,
  approvePODDesign,
  rejectPODDesign,
} from '../../controllers/admin/pod/designs.controller';

// POD Products controllers
import {
  listPODProducts,
  getPODProduct,
  createPODProduct,
  updatePODProduct,
  deletePODProduct,
} from '../../controllers/admin/pod/products.controller';

// Catalogs controllers
import {
  listCatalogs,
  getCatalog,
  createCatalog,
  updateCatalog,
  toggleCatalogStatus,
  updateCatalogSEO,
  deleteCatalog,
} from '../../controllers/admin/pod/catalogs.controller';

// Catalog Categories controllers
import {
  listCatalogCategories,
  getCatalogCategory,
  createCatalogCategory,
  updateCatalogCategory,
  toggleCatalogCategoryStatus,
  updateCatalogCategorySEO,
  deleteCatalogCategory,
} from '../../controllers/admin/pod/catalog-categories.controller';

// POD Banners controllers
import {
  listPODBanners,
  getPODBanner,
  createPODBanner,
  updatePODBanner,
  deletePODBanner,
  togglePODBannerStatus,
} from '../../controllers/admin/pod/banners.controller';

// POD Carts controllers
import {
  listPODCarts,
  getPODCart,
  deletePODCart,
  getPODCartStats,
} from '../../controllers/admin/pod/carts.controller';

// Validation schemas
import {
  listPODOrdersSchema,
  getPODOrderSchema,
  updatePODOrderStatusSchema,
  shipPODOrderSchema,
  cancelPODOrderSchema,
  listPODDesignsSchema,
  getPODDesignSchema,
  approvePODDesignSchema,
  rejectPODDesignSchema,
  listPODProductsSchema,
  getPODProductSchema,
  createPODProductSchema,
  updatePODProductSchema,
  deletePODProductSchema,
  listCatalogsSchema,
  getCatalogSchema,
  createCatalogSchema,
  updateCatalogSchema,
  toggleCatalogStatusSchema,
  updateCatalogSEOSchema,
  deleteCatalogSchema,
  listCatalogCategoriesSchema,
  getCatalogCategorySchema,
  createCatalogCategorySchema,
  updateCatalogCategorySchema,
  toggleCatalogCategoryStatusSchema,
  updateCatalogCategorySEOSchema,
  deleteCatalogCategorySchema,
  listPODBannersSchema,
  getPODBannerSchema,
  createPODBannerSchema,
  updatePODBannerSchema,
  deletePODBannerSchema,
  togglePODBannerStatusSchema,
  listPODCartsSchema,
  getPODCartSchema,
  deletePODCartSchema,
} from '../../validations/admin/pod.validation';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// POD Orders Routes
router.get('/orders', validate(listPODOrdersSchema), listPODOrders);
router.get('/orders/:orderId', validate(getPODOrderSchema), getPODOrder);
router.put('/orders/:orderId/status', validate(updatePODOrderStatusSchema), updatePODOrderStatus);
router.post('/orders/:orderId/ship', validate(shipPODOrderSchema), shipPODOrder);
router.post('/orders/:orderId/cancel', validate(cancelPODOrderSchema), cancelPODOrder);

// POD Designs Routes
router.get('/designs', validate(listPODDesignsSchema), listPODDesigns);
router.get('/designs/:designId', validate(getPODDesignSchema), getPODDesign);
router.post('/designs/:designId/approve', validate(approvePODDesignSchema), approvePODDesign);
router.post('/designs/:designId/reject', validate(rejectPODDesignSchema), rejectPODDesign);

// POD Products Routes
router.get('/products', validate(listPODProductsSchema), listPODProducts);
router.get('/products/:productId', validate(getPODProductSchema), getPODProduct);
router.post('/products', podProductUpload.array('images', 10), handlePodMulterError, validate(createPODProductSchema), createPODProduct);
router.put('/products/:productId', podProductUpload.array('images', 10), handlePodMulterError, validate(updatePODProductSchema), updatePODProduct);
router.delete('/products/:productId', validate(deletePODProductSchema), deletePODProduct);

// Catalogs Routes
router.get('/catalogs', validate(listCatalogsSchema), listCatalogs);
router.get('/catalogs/:catalogId', validate(getCatalogSchema), getCatalog);
router.post('/catalogs', catalogUpload.single('image'), handlePodMulterError, validate(createCatalogSchema), createCatalog);
router.put('/catalogs/:catalogId', catalogUpload.single('image'), handlePodMulterError, validate(updateCatalogSchema), updateCatalog);
router.put('/catalogs/:catalogId/status', validate(toggleCatalogStatusSchema), toggleCatalogStatus);
router.put('/catalogs/:catalogId/seo', validate(updateCatalogSEOSchema), updateCatalogSEO);
router.delete('/catalogs/:catalogId', validate(deleteCatalogSchema), deleteCatalog);

// Catalog Categories Routes
router.get('/catalog-categories', validate(listCatalogCategoriesSchema), listCatalogCategories);
router.get('/catalog-categories/:categoryId', validate(getCatalogCategorySchema), getCatalogCategory);
router.post('/catalog-categories', catalogCategoryUpload.single('image'), handlePodMulterError, validate(createCatalogCategorySchema), createCatalogCategory);
router.put('/catalog-categories/:categoryId', catalogCategoryUpload.single('image'), handlePodMulterError, validate(updateCatalogCategorySchema), updateCatalogCategory);
router.put('/catalog-categories/:categoryId/status', validate(toggleCatalogCategoryStatusSchema), toggleCatalogCategoryStatus);
router.put('/catalog-categories/:categoryId/seo', validate(updateCatalogCategorySEOSchema), updateCatalogCategorySEO);
router.delete('/catalog-categories/:categoryId', validate(deleteCatalogCategorySchema), deleteCatalogCategory);

// POD Banners Routes
router.get('/banners', validate(listPODBannersSchema), listPODBanners);
router.get('/banners/:bannerId', validate(getPODBannerSchema), getPODBanner);
router.post('/banners', podBannerUpload.single('image'), handlePodMulterError, validate(createPODBannerSchema), createPODBanner);
router.put('/banners/:bannerId', podBannerUpload.single('image'), handlePodMulterError, validate(updatePODBannerSchema), updatePODBanner);
router.put('/banners/:bannerId/status', validate(togglePODBannerStatusSchema), togglePODBannerStatus);
router.delete('/banners/:bannerId', validate(deletePODBannerSchema), deletePODBanner);

// POD Carts Routes
router.get('/carts', validate(listPODCartsSchema), listPODCarts);
router.get('/carts/stats', getPODCartStats); // No validation needed for stats
router.get('/carts/:cartId', validate(getPODCartSchema), getPODCart);
router.delete('/carts/:cartId', validate(deletePODCartSchema), deletePODCart);

export default router;

