import { z } from 'zod';

// POD Orders Validations
export const listPODOrdersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    search: z.string().optional(),
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned']).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const getPODOrderSchema = z.object({
  params: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
  }),
});

export const updatePODOrderStatusSchema = z.object({
  params: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
  }),
  body: z.object({
    status: z.enum(['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled', 'returned']),
  }),
});

export const shipPODOrderSchema = z.object({
  params: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
  }),
  body: z.object({
    trackingNumber: z.string().min(1, 'Tracking number is required'),
  }),
});

export const cancelPODOrderSchema = z.object({
  params: z.object({
    orderId: z.string().min(1, 'Order ID is required'),
  }),
  body: z.object({
    reason: z.string().min(1, 'Cancellation reason is required'),
  }),
});

// POD Designs Validations
export const listPODDesignsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    status: z.enum(['pending', 'approved', 'rejected']).optional(),
  }),
});

export const getPODDesignSchema = z.object({
  params: z.object({
    designId: z.string().min(1, 'Design ID is required'),
  }),
});

export const approvePODDesignSchema = z.object({
  params: z.object({
    designId: z.string().min(1, 'Design ID is required'),
  }),
});

export const rejectPODDesignSchema = z.object({
  params: z.object({
    designId: z.string().min(1, 'Design ID is required'),
  }),
  body: z.object({
    reason: z.string().min(1, 'Rejection reason is required'),
  }),
});

// POD Products Validations
export const listPODProductsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    type: z.string().optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const getPODProductSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
});

export const createPODProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    type: z.string().optional(),
    categoryId: z.string().optional(), // Optional - will use default if not provided
    // Accept variants as either array (JSON) or string (FormData JSON string)
    variants: z.union([
      z.array(z.object({
        size: z.string().optional(),
        color: z.string().optional(),
        material: z.string().optional(),
        price: z.number().optional(),
        stock: z.number().optional(),
      })),
      z.string().transform((str, ctx) => {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) {
            return parsed;
          }
          throw new Error('Invalid array');
        } catch (e) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Variants must be a valid JSON array string',
          });
          return z.NEVER;
        }
      }),
    ]).optional(),
    // Accept basePrice as either number or string (FormData sends strings)
    basePrice: z.union([
      z.number(),
      z.string().transform((val) => {
        const num = Number(val);
        if (isNaN(num)) {
          throw new Error('basePrice must be a valid number');
        }
        return num;
      }),
    ]).optional(),
    status: z.enum(['active', 'inactive']).optional().default('active'),
    images: z.array(z.string()).optional(),
  }),
});

export const updatePODProductSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
  body: z.object({
    name: z.string().optional(),
    type: z.string().optional(),
    // Accept basePrice as either number or string (FormData sends strings)
    basePrice: z.union([
      z.number(),
      z.string().transform((val) => {
        const num = Number(val);
        if (isNaN(num)) {
          throw new Error('basePrice must be a valid number');
        }
        return num;
      }),
    ]).optional(),
    status: z.enum(['active', 'inactive']).optional(),
    // Accept variants as either array (JSON) or string (FormData JSON string)
    variants: z.union([
      z.array(z.object({
        size: z.string().optional(),
        color: z.string().optional(),
        material: z.string().optional(),
        price: z.number().optional(),
        stock: z.number().optional(),
      })),
      z.string().transform((str, ctx) => {
        try {
          const parsed = JSON.parse(str);
          if (Array.isArray(parsed)) {
            return parsed;
          }
          throw new Error('Invalid array');
        } catch (e) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Variants must be a valid JSON array string',
          });
          return z.NEVER;
        }
      }),
    ]).optional(),
  }),
});

export const deletePODProductSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
});

// Catalogs Validations
export const listCatalogsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    search: z.string().optional(),
    categoryId: z.string().optional(),
    status: z.enum(['Enabled', 'Disabled']).optional(),
  }),
});

export const getCatalogSchema = z.object({
  params: z.object({
    catalogId: z.string().min(1, 'Catalog ID is required'),
  }),
});

export const createCatalogSchema = z.object({
  body: z.object({
    categoryId: z.string().min(1, 'Category ID is required'),
    name: z.string().min(1).max(100, 'Name must be 1-100 characters'),
    slug: z.string().min(1, 'Slug is required'),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.string().optional(),
  }),
});

export const updateCatalogSchema = z.object({
  params: z.object({
    catalogId: z.string().min(1, 'Catalog ID is required'),
  }),
  body: z.object({
    name: z.string().max(100).optional(),
    slug: z.string().optional(),
    categoryId: z.string().optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.string().optional(),
  }),
});

export const toggleCatalogStatusSchema = z.object({
  params: z.object({
    catalogId: z.string().min(1, 'Catalog ID is required'),
  }),
  body: z.object({
    status: z.enum(['Enabled', 'Disabled']),
  }),
});

export const updateCatalogSEOSchema = z.object({
  params: z.object({
    catalogId: z.string().min(1, 'Catalog ID is required'),
  }),
  body: z.object({
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.string().optional(),
  }),
});

export const deleteCatalogSchema = z.object({
  params: z.object({
    catalogId: z.string().min(1, 'Catalog ID is required'),
  }),
});

// Catalog Categories Validations
export const listCatalogCategoriesSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    search: z.string().optional(),
    feature: z.enum(['General', 'Featured']).optional(),
    status: z.enum(['Enabled', 'Disabled']).optional(),
  }),
});

export const getCatalogCategorySchema = z.object({
  params: z.object({
    categoryId: z.string().min(1, 'Category ID is required'),
  }),
});

export const createCatalogCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100, 'Name must be 1-100 characters'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().max(500).optional(),
    feature: z.enum(['General', 'Featured']),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.string().optional(),
  }),
});

export const updateCatalogCategorySchema = z.object({
  params: z.object({
    categoryId: z.string().min(1, 'Category ID is required'),
  }),
  body: z.object({
    name: z.string().max(100).optional(),
    slug: z.string().optional(),
    description: z.string().max(500).optional(),
    feature: z.enum(['General', 'Featured']).optional(),
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.string().optional(),
  }),
});

export const toggleCatalogCategoryStatusSchema = z.object({
  params: z.object({
    categoryId: z.string().min(1, 'Category ID is required'),
  }),
  body: z.object({
    status: z.enum(['Enabled', 'Disabled']),
  }),
});

export const updateCatalogCategorySEOSchema = z.object({
  params: z.object({
    categoryId: z.string().min(1, 'Category ID is required'),
  }),
  body: z.object({
    seoTitle: z.string().optional(),
    seoDescription: z.string().optional(),
    seoKeywords: z.string().optional(),
  }),
});

export const deleteCatalogCategorySchema = z.object({
  params: z.object({
    categoryId: z.string().min(1, 'Category ID is required'),
  }),
});

// POD Banners Validations
export const listPODBannersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    type: z.enum(['carousel', 'promotional']).optional(),
    status: z.enum(['active', 'inactive']).optional(),
  }),
});

export const getPODBannerSchema = z.object({
  params: z.object({
    bannerId: z.string().min(1, 'Banner ID is required'),
  }),
});

export const createPODBannerSchema = z.object({
  body: z.object({
    title: z.string().min(1, 'Title is required'),
    subtitle: z.string().optional(),
    type: z.enum(['carousel', 'promotional'], {
      required_error: 'Type must be either "carousel" or "promotional"',
    }),
    link: z.string().optional(),
    order: z.union([
      z.number(),
      z.string().transform((val) => Number(val)),
    ]).optional().default(0),
    isActive: z.union([
      z.boolean(),
      z.string().transform((val) => val === 'true'),
    ]).optional().default(true),
    backgroundColor: z.string().optional(),
    startDate: z.union([
      z.string().datetime(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).transform((val) => {
        // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO format
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid datetime');
        }
        return date.toISOString();
      }),
      z.string().length(0).transform(() => undefined),
      z.undefined(),
    ]).optional(),
    endDate: z.union([
      z.string().datetime(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).transform((val) => {
        // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO format
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid datetime');
        }
        return date.toISOString();
      }),
      z.string().length(0).transform(() => undefined),
      z.undefined(),
    ]).optional(),
  }),
});

export const updatePODBannerSchema = z.object({
  params: z.object({
    bannerId: z.string().min(1, 'Banner ID is required'),
  }),
  body: z.object({
    title: z.string().optional(),
    subtitle: z.string().optional(),
    type: z.enum(['carousel', 'promotional']).optional(),
    link: z.string().optional(),
    order: z.union([
      z.number(),
      z.string().transform((val) => Number(val)),
    ]).optional(),
    isActive: z.union([
      z.boolean(),
      z.string().transform((val) => val === 'true'),
    ]).optional(),
    backgroundColor: z.string().optional(),
    startDate: z.union([
      z.string().datetime(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).transform((val) => {
        // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO format
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid datetime');
        }
        return date.toISOString();
      }),
      z.string().length(0).transform(() => undefined),
      z.undefined(),
    ]).optional(),
    endDate: z.union([
      z.string().datetime(),
      z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/).transform((val) => {
        // Convert datetime-local format (YYYY-MM-DDTHH:mm) to ISO format
        const date = new Date(val);
        if (isNaN(date.getTime())) {
          throw new Error('Invalid datetime');
        }
        return date.toISOString();
      }),
      z.string().length(0).transform(() => undefined),
      z.undefined(),
    ]).optional(),
  }),
});

export const deletePODBannerSchema = z.object({
  params: z.object({
    bannerId: z.string().min(1, 'Banner ID is required'),
  }),
});

export const togglePODBannerStatusSchema = z.object({
  params: z.object({
    bannerId: z.string().min(1, 'Banner ID is required'),
  }),
});

// POD Carts Validations
export const listPODCartsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    userId: z.string().optional(),
    productId: z.string().optional(),
  }),
});

export const getPODCartSchema = z.object({
  params: z.object({
    cartId: z.string().min(1, 'Cart ID is required'),
  }),
});

export const deletePODCartSchema = z.object({
  params: z.object({
    cartId: z.string().min(1, 'Cart ID is required'),
  }),
});

