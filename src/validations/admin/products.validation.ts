import { z } from 'zod';

export const listProductsSchema = z.object({
  query: z.preprocess(
    (data: any) => {
      // Convert empty strings to undefined
      if (data && typeof data === 'object') {
        const processed = { ...data };
        Object.keys(processed).forEach(key => {
          if (processed[key] === '') {
            processed[key] = undefined;
          }
        });
        return processed;
      }
      return data;
    },
    z.object({
      page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
      section: z.enum(['sambhav', 'public']).optional(),
      category: z.enum([
        'campaign',
        'dsa_mfd_agent',
        'social_task',
        'other_tasks',
        'influencer_marketing',
        'company_task',
        'freelancer_task',
      ]).optional(),
      status: z.enum(['active', 'inactive']).optional(),
      search: z.string().optional(),
    })
  ),
});

export const getProductSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
});

export const createProductSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Product name is required'),
    description: z.string().min(1, 'Description is required'),
    category: z.enum([
      'campaign',
      'dsa_mfd_agent',
      'social_task',
      'other_tasks',
      'influencer_marketing',
      'company_task',
      'freelancer_task',
    ]),
    section: z.enum(['sambhav', 'public']),
    earnUpTo: z.number().positive('Earning amount must be positive').or(z.string().transform(Number)),
    taskUrl: z.string().url('Valid task URL is required').optional(),
    route: z.string().optional(),
    logo: z.string().optional(),
    icon: z.string().optional(),
    isActive: z.boolean().or(z.string()).optional(),
    isNewProduct: z.boolean().or(z.string()).optional(),
    details: z.any().optional(),
    marketing: z.any().optional(),
    training: z.any().optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    category: z.enum([
      'campaign',
      'dsa_mfd_agent',
      'social_task',
      'other_tasks',
      'influencer_marketing',
      'company_task',
      'freelancer_task',
    ]).optional(),
    section: z.enum(['sambhav', 'public']).optional(),
    earnUpTo: z.number().positive().or(z.string().transform(Number)).optional(),
    taskUrl: z.string().url().optional(),
    route: z.string().optional(),
    logo: z.string().optional(),
    icon: z.string().optional(),
    isActive: z.boolean().or(z.string()).optional(),
    isNewProduct: z.boolean().or(z.string()).optional(),
    details: z.any().optional(),
    marketing: z.any().optional(),
    training: z.any().optional(),
  }),
});

export const deleteProductSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
});

export const duplicateProductSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
});

export const toggleProductStatusSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
});

export const getProductStatisticsSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

