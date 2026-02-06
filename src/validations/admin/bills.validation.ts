import { z } from 'zod';

// Bill Services (Admin)

export const listAdminBillServicesSchema = z.object({
  query: z.object({
    type: z
      .enum(['mobile_recharge', 'dth_recharge', 'electricity_bill', 'gas_bill', 'water_bill'])
      .optional(),
    status: z.enum(['active', 'inactive']).optional(),
    search: z.string().optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export const createAdminBillServiceSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    description: z.string().optional(),
    type: z.enum(['mobile_recharge', 'dth_recharge', 'electricity_bill', 'gas_bill', 'water_bill']),
    providerCode: z.string().min(1, 'Provider code is required'),
    icon: z.string().optional(),
    minAmount: z.number().min(0, 'Min amount must be non-negative'),
    maxAmount: z.number().min(0, 'Max amount must be non-negative'),
    commissionType: z.enum(['flat', 'percentage']).default('percentage'),
    commissionValue: z.number().min(0, 'Commission value must be non-negative'),
    isActive: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const updateAdminBillServiceSchema = z.object({
  params: z.object({
    serviceId: z.string().min(1, 'Service ID is required'),
  }),
  body: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    type: z.enum(['mobile_recharge', 'dth_recharge', 'electricity_bill', 'gas_bill', 'water_bill']).optional(),
    providerCode: z.string().optional(),
    icon: z.string().optional(),
    minAmount: z.number().min(0).optional(),
    maxAmount: z.number().min(0).optional(),
    commissionType: z.enum(['flat', 'percentage']).optional(),
    commissionValue: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const toggleAdminBillServiceStatusSchema = z.object({
  params: z.object({
    serviceId: z.string().min(1, 'Service ID is required'),
  }),
  body: z.object({
    isActive: z.boolean(),
  }),
});

// Bill Transactions (Admin)

export const listAdminBillTransactionsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    status: z.enum(['pending', 'processing', 'success', 'failed', 'refunded']).optional(),
    type: z
      .enum(['mobile_recharge', 'dth_recharge', 'electricity_bill', 'gas_bill', 'water_bill'])
      .optional(),
    userId: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    search: z.string().optional(),
  }),
});

export const getAdminBillTransactionSchema = z.object({
  params: z.object({
    transactionId: z.string().min(1, 'Transaction ID is required'),
  }),
});

export const refundAdminBillTransactionSchema = z.object({
  params: z.object({
    transactionId: z.string().min(1, 'Transaction ID is required'),
  }),
  body: z.object({
    reason: z.string().min(1, 'Refund reason is required'),
  }),
});

