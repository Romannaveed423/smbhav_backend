import { z } from 'zod';

export const listOfferApplicationsSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    status: z.enum(['Pending', 'Approved', 'Rejected', 'Active', 'All']).optional(),
    search: z.string().optional(),
    offerId: z.string().optional(),
    publisherId: z.string().optional(),
  }),
});

export const getOfferApplicationSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
});

export const updateOfferApplicationStatusSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
  body: z.object({
    status: z.enum(['Pending', 'Approved', 'Rejected', 'Active']),
    rejectionReason: z.string().optional(),
    notes: z.string().optional(),
  }).refine((data) => {
    // If status is Rejected, rejectionReason is required
    if (data.status === 'Rejected' && !data.rejectionReason) {
      return false;
    }
    return true;
  }, {
    message: 'Rejection reason is required when rejecting an application',
    path: ['rejectionReason'],
  }),
});

export const activateOfferApplicationSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
});

export const deleteOfferApplicationSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
});

export const bulkUpdateOfferApplicationStatusSchema = z.object({
  body: z.object({
    applicationIds: z.array(z.string().min(1)).min(1, 'At least one application ID is required'),
    status: z.enum(['Pending', 'Approved', 'Rejected', 'Active']),
    notes: z.string().optional(),
  }).refine((data) => {
    // If status is Rejected, notes can serve as rejection reason for bulk operations
    // For bulk, we're more flexible - notes can be the rejection reason
    return true;
  }),
});

