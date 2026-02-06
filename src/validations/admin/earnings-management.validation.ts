import { z } from 'zod';

export const listEarningsSchema = z.object({
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
      status: z.enum(['pending', 'completed', 'cancelled']).optional(),
      type: z.string().optional(),
      productId: z.string().optional(),
      userId: z.string().optional(),
      approvalStatus: z.enum(['pending', 'auto_approved', 'manually_approved', 'rejected']).optional(),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
      search: z.string().optional(),
    })
  ),
});

export const getEarningSchema = z.object({
  params: z.object({
    earningId: z.string().min(1, 'Earning ID is required'),
  }),
});

export const approveEarningSchema = z.object({
  params: z.object({
    earningId: z.string().min(1, 'Earning ID is required'),
  }),
  body: z.object({
    amount: z.number().positive().optional(),
    notes: z.string().optional(),
  }),
});

export const rejectEarningSchema = z.object({
  params: z.object({
    earningId: z.string().min(1, 'Earning ID is required'),
  }),
  body: z.object({
    reason: z.string().min(1, 'Rejection reason is required'),
  }),
});

export const adjustEarningAmountSchema = z.object({
  params: z.object({
    earningId: z.string().min(1, 'Earning ID is required'),
  }),
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    reason: z.string().min(1, 'Reason is required for adjustment'),
  }),
});

