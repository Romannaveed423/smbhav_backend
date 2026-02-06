import { z } from 'zod';

export const getEarningsProductsSchema = z.object({
  query: z.object({
    section: z.enum(['sambhav', 'public']),
    category: z.enum(['campaign', 'dsa_mfd_agent', 'social_task', 'other_tasks', 
                      'influencer_marketing', 'company_task', 'freelancer_task']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  }),
});

export const getEarningsDashboardSchema = z.object({
  query: z.object({
    section: z.enum(['sambhav', 'public']).optional().default('sambhav'),
    category: z.enum(['campaign', 'dsa_mfd_agent', 'social_task', 'other_tasks', 
                      'influencer_marketing', 'company_task', 'freelancer_task']).optional(),
  }),
});

export const getEarningsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

const bankAccountSchema = z.object({
  accountNumber: z.string().min(1, 'Account number is required'),
  ifscCode: z.string().min(1, 'IFSC code is required'),
  accountHolderName: z.string().min(1, 'Account holder name is required'),
  bankName: z.string().min(1, 'Bank name is required'),
}).optional();

export const withdrawEarningsSchema = z.object({
  body: z.object({
    amount: z.number().positive('Amount must be positive'),
    bankAccount: bankAccountSchema,
    upiId: z.string().optional(),
  }).refine((data) => data.bankAccount || data.upiId, {
    message: 'Either bank account or UPI ID is required',
  }),
});

export const getWithdrawalsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    status: z.enum(['pending', 'completed', 'rejected']).optional(),
  }),
});

export const applyForProductSchema = z.object({
  body: z.object({
    clientDetails: z.object({
      clientName: z.string().min(1, 'Client name is required'),
      businessName: z.string().min(1, 'Business name is required'),
      gstin: z.string().optional(),
      addressProof: z.string().optional(),
    }),
    documents: z.object({
      aadhar: z.string().optional(),
      pan: z.string().optional(),
      addressProof: z.string().optional(),
    }),
    offerId: z.string().optional(),
  }),
});

export const generateClickSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
  body: z.object({
    taskUrl: z.string().url('Valid task URL is required'),
    offerId: z.string().optional(),
  }),
});

export const postbackSchema = z.object({
  query: z.object({
    click_id: z.string().min(1, 'Click ID is required'),
  }),
  body: z.object({
    amount: z.number().positive().optional(),
    offerId: z.string().optional(),
    status: z.enum(['pending', 'completed', 'approved', 'rejected', 'cancelled']).optional(),
    transactionId: z.string().optional(),
    conversionId: z.string().optional(),
  }).passthrough(), // Allow additional fields from postback
});

export const getOffersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    status: z.enum(['active', 'inactive', 'pending', 'expired']).optional().default('active'),
    search: z.string().optional(),
    category: z.string().optional(),
    section: z.enum(['sambhav', 'public']).optional(),
  }),
});

export const createOfferApplicationSchema = z.object({
  body: z.object({
    offerId: z.string().min(1, 'Offer ID is required'),
    offerPromotion: z.string().min(10, 'Offer promotion description must be at least 10 characters'),
  }),
});
