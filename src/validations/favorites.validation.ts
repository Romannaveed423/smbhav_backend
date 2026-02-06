import { z } from 'zod';

export const getUserFavoritesSchema = z.object({
  query: z.object({
    type: z.enum(['stores', 'products']).optional(),
  }),
});

export const addToFavoritesSchema = z.object({
  body: z.object({
    type: z.enum(['store', 'product'], {
      errorMap: () => ({ message: 'Type must be "store" or "product"' }),
    }),
    itemId: z.string().min(1, 'Item ID is required'),
  }),
});

export const checkFavoriteStatusSchema = z.object({
  query: z.object({
    type: z.enum(['stores', 'products'], {
      errorMap: () => ({ message: 'Type must be "stores" or "products"' }),
    }),
    itemId: z.string().min(1, 'Item ID is required'),
  }),
});

