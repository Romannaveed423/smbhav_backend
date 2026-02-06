import { z } from 'zod';

/** MongoDB ObjectId - 24 hex characters */
const objectIdSchema = z.string().length(24, 'Invalid ID').regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format');

const userIdParam = z.object({ userId: objectIdSchema });

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    email: z.string().email().toLowerCase(),
    phone: z.string().min(10).max(15),
    password: z.string().min(6),
    role: z.enum(['user', 'admin']).optional().default('user'),
    kycStatus: z.enum(['pending', 'verified', 'rejected']).optional().default('pending'),
    isEmailVerified: z.boolean().optional().default(false),
    isPhoneVerified: z.boolean().optional().default(false),
  }),
});

export const listUsersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    search: z.string().optional(),
    kycStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
    sortBy: z.string().optional().default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  }),
});

export const getUserSchema = z.object({ params: userIdParam });

export const updateUserSchema = z.object({
  params: userIdParam,
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    phone: z.string().min(10).max(15).optional(),
    address: z.object({
      street: z.string().max(200).optional(),
      city: z.string().max(100).optional(),
      state: z.string().max(100).optional(),
      pincode: z.string().max(20).optional(),
      country: z.string().max(100).optional(),
    }).optional(),
    profileImage: z.string().url().max(500).optional().nullable(),
    kycStatus: z.enum(['pending', 'verified', 'rejected']).optional(),
    isEmailVerified: z.boolean().optional(),
    isPhoneVerified: z.boolean().optional(),
  }),
});

export const adjustUserBalanceSchema = z.object({
  params: userIdParam,
  body: z.object({
    amount: z.number(),
    reason: z.string().min(5).max(500),
  }),
});

export const freezeUserSchema = z.object({
  params: userIdParam,
  body: z.object({
    freeze: z.boolean(),
    reason: z.string().min(5).max(500).optional(),
  }),
});

export const getUserTransactionsSchema = z.object({
  params: userIdParam,
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).pipe(z.number().min(1).max(100)).optional().default('20'),
    type: z.enum(['credit', 'debit']).optional(),
    status: z.enum(['pending', 'completed', 'cancelled', 'processing', 'rejected']).optional(),
  }),
});

/** Soft delete (set status inactive) or hard delete. Default: soft */
export const deleteUserSchema = z.object({
  params: userIdParam,
  body: z.object({
    hard: z.boolean().optional().default(false),
    reason: z.string().min(5).max(500).optional(),
  }).optional(),
});

/** Change user role - admin only */
export const changeRoleSchema = z.object({
  params: userIdParam,
  body: z.object({
    role: z.enum(['user', 'admin']),
  }),
});

/** Verify user email (admin override). Omit body or { verified: true } to verify. */
export const verifyEmailSchema = z.object({
  params: userIdParam,
  body: z.object({
    verified: z.boolean().optional(),
  }).optional(),
});

/** Verify user phone (admin override). Omit body or { verified: true } to verify. */
export const verifyPhoneSchema = z.object({
  params: userIdParam,
  body: z.object({
    verified: z.boolean().optional(),
  }).optional(),
});

/** Update KYC status only */
export const updateKycStatusSchema = z.object({
  params: userIdParam,
  body: z.object({
    kycStatus: z.enum(['pending', 'verified', 'rejected']),
    reason: z.string().max(500).optional(),
  }),
});

/** Get user statistics */
export const getUserStatisticsSchema = z.object({
  params: userIdParam,
});

