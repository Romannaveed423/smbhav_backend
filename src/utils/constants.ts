export const USER_ROLES = {
  USER: 'user',
  ADMIN: 'admin',
} as const;

export const KYC_STATUS = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
} as const;

export const LEAD_STATUS = {
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  DOCUMENTS_REQUIRED: 'documents_required',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMMISSION_PAID: 'commission_paid',
} as const;

export const COMMISSION_STATUS = {
  PENDING: 'pending',
  CREDITED: 'credited',
} as const;

export const TRANSACTION_TYPE = {
  LEAD_COMMISSION: 'lead_commission',
  REFERRAL_BONUS: 'referral_bonus',
  BONUS_CAMPAIGN: 'bonus_campaign',
  WITHDRAWAL: 'withdrawal',
  REFUND: 'refund',
} as const;

export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
} as const;

export const REFERRAL_STATUS = {
  PENDING: 'pending',
  KYC_COMPLETED: 'kyc_completed',
  FIRST_LEAD: 'first_lead',
  FIRST_SALE: 'first_sale',
  COMPLETED: 'completed',
} as const;

export const CAMPAIGN_TYPE = {
  PRODUCT_COUNT: 'product_count',
  SALES_TARGET: 'sales_target',
  STREAK: 'streak',
  LEADERBOARD: 'leaderboard',
} as const;

export const WITHDRAWAL_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
} as const;

export const NOTIFICATION_TYPE = {
  LEAD_UPDATE: 'lead_update',
  PRODUCT_APPROVED: 'product_approved',
  TRAINING: 'training',
  CAMPAIGN: 'campaign',
  PAYMENT: 'payment',
  REFERRAL: 'referral',
  KYC: 'kyc',
  GENERAL: 'general',
} as const;

export const DOCUMENT_TYPE = {
  PAN_CARD: 'pan_card',
  AADHAAR_CARD: 'aadhaar_card',
  BANK_STATEMENT: 'bank_statement',
  SALARY_SLIP: 'salary_slip',
  ADDRESS_PROOF: 'address_proof',
  PHOTO: 'photo',
} as const;

export const PRODUCT_CATEGORY = {
  BANKING: 'banking',
  CREDIT: 'credit',
  INSURANCE: 'insurance',
  INVESTMENTS: 'investments',
} as const;

export const CONTENT_TYPE = {
  VIDEO: 'video',
  ARTICLE: 'article',
  DOCUMENT: 'document',
} as const;

export const REFERRAL_BONUSES = {
  SIGNUP: 100,
  KYC: 500,
  FIRST_SALE_PERCENTAGE: 10, // 10% of first sale commission
  ONGOING_COMMISSION_PERCENTAGE: 10, // 10% of referred user's earnings
} as const;

export const MIN_WITHDRAWAL_AMOUNT = 100; // Minimum withdrawal in rupees

