import { z } from 'zod';

export const listBillServicesSchema = z.object({
  query: z.object({
    type: z
      .enum(['mobile_recharge', 'dth_recharge', 'electricity_bill', 'gas_bill', 'water_bill'])
      .optional(),
  }),
});

export const payBillSchema = z.object({
  body: z.object({
    serviceId: z.string().min(1, 'Service ID is required'),
    accountNumber: z.string().min(1, 'Account number is required'),
    amount: z.union([
      z.number().positive('Amount must be greater than zero'),
      z
        .string()
        .min(1, 'Amount is required')
        .transform((val, ctx) => {
          const num = Number(val);
          if (Number.isNaN(num) || num <= 0) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: 'Amount must be a positive number',
            });
            return z.NEVER;
          }
          return num;
        }),
    ]),
    customerName: z.string().optional(),
    phone: z
      .string()
      .regex(/^\d{10}$/, 'Phone must be a 10 digit number')
      .optional(),
    metadata: z.record(z.any()).optional(),
  }),
});

export const listUserBillTransactionsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
    status: z.enum(['pending', 'processing', 'success', 'failed', 'refunded']).optional(),
    type: z
      .enum(['mobile_recharge', 'dth_recharge', 'electricity_bill', 'gas_bill', 'water_bill'])
      .optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const getUserBillTransactionSchema = z.object({
  params: z.object({
    transactionId: z.string().min(1, 'Transaction ID is required'),
  }),
});

