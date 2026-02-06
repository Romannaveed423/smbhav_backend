import { z } from 'zod';

// Common fields for all task types
const baseTaskSchema = z.object({
  name: z.string().min(1, 'Task name is required').max(200, 'Task name too long'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000, 'Description too long'),
  category: z.enum(['social_media', 'campaign', 'influencer', 'company_custom'], {
    errorMap: () => ({ message: 'Invalid task category' }),
  }),
  earnUpTo: z.number().positive('Earning amount must be positive').min(0.01, 'Minimum earning is 0.01'),
  taskUrl: z.string().url('Valid task URL is required').optional().or(z.literal('')),
  maxUsers: z.number().int().positive().optional().nullable(),
  requireScreenshot: z.boolean().optional().default(false),
  deadline: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()).nullable(),
  instantPay: z.boolean().optional().default(false),
  requirements: z.array(z.string()).optional(),
});

// Create a comprehensive schema that handles all task types with optional fields
export const createPublicTaskSchema = z.object({
  body: baseTaskSchema
    .extend({
      // Social Media Task fields
      platform: z.enum(['YouTube', 'Instagram', 'TikTok', 'Twitter', 'Facebook', 'LinkedIn']).optional(),
      actions: z.array(z.enum(['Like', 'Comment', 'Share', 'Subscribe', 'Follow'])).optional(),
      instructions: z.string().optional(),
      pinToTop: z.boolean().optional().default(false),
      vipUsersOnly: z.boolean().optional().default(false),
      
      // Campaign Task fields
      subcategory: z.string().optional(), // Savings, Demat, Credit C
      taskSteps: z.string().optional(), // Task steps/instructions for campaign
      payoutModel: z.enum(['Install (CPI)', 'Leads (CPL)', 'CPC', 'CPA', 'CPM', 'Revenue Share']).optional(),
      revenueCost: z.number().positive().optional().nullable(),
      payoutType: z.enum(['Flat', 'Percentage %']).optional(),
      payoutCost: z.number().positive().optional().nullable(),
      dailyCap: z.number().int().positive().optional().nullable(), // null = unlimited
      totalCap: z.number().int().positive().optional().nullable(), // null = unlimited
      conversionStatusRule: z.enum(['Auto Approve', 'Manual Review']).optional(),
      privateOffer: z.boolean().optional().default(false),
      enableRedirection: z.boolean().optional().default(false),
      requireApproval: z.boolean().optional().default(false),
      geoTarget: z.array(z.string()).optional(), // Countries
      deviceTarget: z.array(z.enum(['Mobile', 'Desktop', 'Tablet', 'TV'])).optional(),
      osPlatform: z.array(z.enum(['iOS', 'Android', 'Windows', 'macOS', 'Linux'])).optional(),
      destinationLink: z.string().url('Valid destination URL is required').optional().or(z.literal('')),
      attributionTool: z.enum(['Self (Direct)', 'Adjust', 'AppsFlyer']).optional(),
      clickIdParam: z.string().optional(),
      testUrl: z.string().url('Valid test URL is required').optional().or(z.literal('')),
      
      // Influencer Task fields
      productDescription: z.string().optional(), // Product/Service Description
      nicheCategory: z.array(z.string()).optional(), // Lifestyle, Fitness, Gaming, etc.
      requiredReachMin: z.number().int().positive().optional().nullable(), // in thousands
      requiredReachMax: z.number().int().positive().optional().nullable(), // in thousands
      paymentType: z.enum(['Cash', 'Product', 'Commission']).optional(),
      totalBudget: z.number().positive().optional().nullable(),
      deliverables: z.array(z.string()).optional(), // Deliverables required
      
      // Company Task fields
      workDescription: z.string().optional(), // The Work description (separate from main description)
    })
    .refine((data) => {
      // Social media tasks require platform and at least one action
      if (data.category === 'social_media') {
        if (!data.platform) {
          return false;
        }
        if (!data.actions || data.actions.length === 0) {
          return false;
        }
      }
      return true;
    }, {
      message: 'Platform and at least one action required for social media tasks',
      path: ['platform'],
    })
    .refine((data) => {
      // Influencer tasks require platform if provided
      if (data.category === 'influencer' && data.platform && !['Instagram', 'TikTok', 'YouTube', 'Twitter'].includes(data.platform)) {
        return false;
      }
      return true;
    }, {
      message: 'Invalid platform for influencer task',
      path: ['platform'],
    }),
});

export const getPublicTasksSchema = z.object({
  query: z.object({
    category: z.enum(['influencer', 'social', 'social_task', 'campaign', 'company', 'company_task']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    status: z.enum(['active', 'pending', 'all']).optional().default('active'),
  }),
});

export const getMyPublicTasksSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    status: z.enum(['active', 'pending', 'all']).optional(),
  }),
});

