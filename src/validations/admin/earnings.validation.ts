import { z } from 'zod';

export const getClickLogsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    status: z.enum(['pending', 'converted', 'expired', 'rejected']).optional(),
    userId: z.string().optional(),
    productId: z.string().optional(),
    offerId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    search: z.string().optional(),
  }),
});

export const getConversionsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    status: z.enum(['pending', 'completed', 'cancelled']).optional(),
    approvalStatus: z.enum(['pending', 'auto_approved', 'manually_approved', 'rejected']).optional(),
    userId: z.string().optional(),
    productId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    search: z.string().optional(),
  }),
});

export const getClickLogByIdSchema = z.object({
  params: z.object({
    clickLogId: z.string().min(1, 'Click log ID is required'),
  }),
});

export const getClickLogByClickIdSchema = z.object({
  params: z.object({
    clickId: z.string().min(1, 'Click ID is required'),
  }),
});

export const approveConversionSchema = z.object({
  params: z.object({
    conversionId: z.string().min(1, 'Conversion ID is required'),
  }),
  body: z.object({
    amount: z.number().positive().optional(),
    notes: z.string().optional(),
  }),
});

export const rejectConversionSchema = z.object({
  params: z.object({
    conversionId: z.string().min(1, 'Conversion ID is required'),
  }),
  body: z.object({
    reason: z.string().min(1, 'Rejection reason is required'),
  }),
});

export const adjustConversionAmountSchema = z.object({
  params: z.object({
    conversionId: z.string().min(1, 'Conversion ID is required'),
  }),
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    reason: z.string().min(1, 'Reason is required for adjustment'),
  }),
});

