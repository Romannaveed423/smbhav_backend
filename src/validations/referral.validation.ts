import { z } from 'zod';

export const getReferralsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    status: z.enum(['pending', 'active', 'inactive']).optional(),
  }),
});

export const getReferralCommissionsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const verifyReferralCodeSchema = z.object({
  query: z.object({
    code: z.string().min(1, 'Referral code is required'),
  }),
});

