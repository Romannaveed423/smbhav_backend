import { z } from 'zod';

export const listCategoriesSchema = z.object({
  query: z.object({
    section: z.enum(['sambhav', 'public']).optional(),
  }),
});

