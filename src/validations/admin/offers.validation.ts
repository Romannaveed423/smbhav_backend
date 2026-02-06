import { z } from 'zod';

export const getProductOffersSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
});

export const createOfferSchema = z.object({
  params: z.object({
    productId: z.string().min(1, 'Product ID is required'),
  }),
  body: z.object({
    name: z.string().min(1, 'Offer name is required'),
    amount: z.number().positive('Amount must be positive').or(z.string().transform(Number)),
    oldPrice: z.number().positive().or(z.string().transform(Number)).optional(),
    status: z.enum(['active', 'inactive', 'expired']).optional(),
    category: z.string().optional(),
    icon: z.string().optional(),
  }),
});

export const updateOfferSchema = z.object({
  params: z.object({
    offerId: z.string().min(1, 'Offer ID is required'),
  }),
  body: z.object({
    name: z.string().optional(),
    amount: z.number().positive().or(z.string().transform(Number)).optional(),
    oldPrice: z.number().positive().or(z.string().transform(Number)).optional(),
    status: z.enum(['active', 'inactive', 'expired']).optional(),
    category: z.string().optional(),
    icon: z.string().optional(),
  }),
});

export const deleteOfferSchema = z.object({
  params: z.object({
    offerId: z.string().min(1, 'Offer ID is required'),
  }),
});

export const listOffersSchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    status: z.enum(['active', 'inactive', 'pending', 'expired']).optional(),
    search: z.string().optional(),
    advertiser: z.string().optional(),
    category: z.string().optional(),
    createdBy: z.string().optional(),
  }),
});

export const createStandaloneOfferSchema = z.object({
  body: z.object({
    // Basic fields
    name: z.string().min(1, 'Offer name is required'),
    description: z.string().optional(),
    advertiserId: z.string().optional(),
    advertiserName: z.string().optional(),
    accountManagerId: z.string().optional(),
    accountManagerName: z.string().optional(),
    previewLink: z.string().url().optional().or(z.literal('')),
    trackingLink: z.string().min(1, 'Tracking link is required'),
    category: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    clickLifeSpan: z.union([z.number(), z.string()]).optional(),
    status: z.enum(['active', 'inactive', 'pending', 'expired']).optional(),
    
    // Payout fields
    payoutModel: z.enum(['Impressions', 'Clicks', 'Conversions', 'Sales', 'Leads', 'Installs']).optional(),
    revenueCost: z.union([z.number(), z.string()]).optional(),
    payoutType: z.enum(['Flat', 'Revenue share']).optional(),
    payoutCost: z.union([z.number(), z.string()]).optional(),
    cap: z.union([z.number(), z.string()]).optional(),
    dailyCap: z.union([z.number(), z.string()]).optional(),
    monthlyCap: z.union([z.number(), z.string()]).optional(),
    
    // Offer settings
    conversionStatusRule: z.string().optional(),
    privateSetting: z.enum(['Enable', 'Disable']).optional(),
    redirection: z.enum(['Enable', 'Disable']).optional(),
    requiredApproval: z.enum(['Enable', 'Disable']).optional(),
    
    // Targeting
    geoTarget: z.string().optional(),
    geoGlobal: z.union([z.boolean(), z.string()]).optional(),
    device: z.string().optional(),
    deviceAll: z.union([z.boolean(), z.string()]).optional(),
    platform: z.string().optional(),
    platformAll: z.union([z.boolean(), z.string()]).optional(),
    
    // Tracking
    trackingProtocol: z.enum(['Postback Url', 'Server-to-Server', 'Pixel', 'JavaScript']).optional(),
    
    // Testing
    testUrl: z.string().url().optional().or(z.literal('')),
    testMode: z.enum(['Enable', 'Disable']).optional(),
    testParameters: z.string().optional(),
  }),
});

