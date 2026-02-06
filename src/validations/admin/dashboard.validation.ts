import { z } from 'zod';

export const getDashboardSummarySchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
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
  }),
});

export const getProductAnalyticsSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    groupBy: z.enum(['day', 'week', 'month']).optional().default('day'),
  }),
});

