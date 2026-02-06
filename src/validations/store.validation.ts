import { z } from 'zod';

// Location validations
export const updateUserLocationSchema = z.object({
  body: z.object({
    locationId: z.string().min(1, 'Location ID is required'),
  }),
});

export const searchLocationsSchema = z.object({
  query: z.object({
    query: z.string().min(1, 'Search query is required'),
  }),
});

// Search validations
export const searchItemsSchema = z.object({
  query: z.object({
    query: z.string().optional(),
    category: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export const voiceSearchSchema = z.object({
  body: z.object({
    audioFile: z.string().min(1, 'Audio file is required'),
  }),
});

// Banner validations
export const getBannersSchema = z.object({
  query: z.object({
    locationId: z.string().optional(),
  }),
});

// Category validations
export const getCategoryProductsSchema = z.object({
  params: z.object({
    categoryId: z.string().min(1, 'Category ID is required'),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    sort: z.enum(['price_asc', 'price_desc', 'rating', 'newest']).optional(),
  }),
});

// Store validations
export const getRecommendedStoresSchema = z.object({
  query: z.object({
    locationId: z.string().optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export const getAllRecommendedStoresSchema = z.object({
  query: z.object({
    locationId: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export const getStoreDetailsSchema = z.object({
  params: z.object({
    storeId: z.string().min(1, 'Store ID is required'),
  }),
});

export const searchStoresSchema = z.object({
  query: z.object({
    query: z.string().optional(),
    locationId: z.string().optional(),
  }),
});

// Product validations
export const getSpecialOffersSchema = z.object({
  query: z.object({
    locationId: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export const getHighlightsSchema = z.object({
  query: z.object({
    locationId: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export const getProductDetailsSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
});

export const getStoreProductsSchema = z.object({
  params: z.object({
    storeId: z.string().min(1, 'Store ID is required'),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    category: z.string().optional(),
  }),
});

// Utility validations
export const getDeliveryTimeEstimateSchema = z.object({
  query: z.object({
    storeId: z.string().min(1, 'Store ID is required'),
    locationId: z.string().optional(),
  }),
});

export const getStoreStatusSchema = z.object({
  params: z.object({
    storeId: z.string().min(1, 'Store ID is required'),
  }),
});

