import { z } from 'zod';

// SIP Application Validation Schemas
export const submitSIPApplicationSchema = z.object({
  body: z.object({
    productId: z.string().optional(),
    sipType: z.enum(['Regular SIP', 'Flexible SIP', 'Top-up SIP', 'Tax Saving']),
    monthlyInstallment: z.number().min(100, 'Minimum investment is ₹100'),
    preferredSIPDate: z.enum(['1st', '5th', '10th', '15th', '20th']),
    duration: z.number().min(1).max(30),
    assetAllocation: z.enum(['Equity', 'Debt', 'Hybrid']),
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format'),
    aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar number must be 12 digits'),
    additionalDocument: z.string().url().optional().or(z.literal('')),
  }),
});

export const getSIPApplicationStatusSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
});

export const getUserSIPApplicationsSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'completed']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

// Mutual Fund Application Validation Schemas
export const submitMutualFundApplicationSchema = z.object({
  body: z.object({
    productId: z.string().optional(),
    investmentMode: z.enum(['SIP', 'Lumpsum']),
    mutualFundStrategy: z.string().optional(),
    investmentDuration: z.enum(['1-3 Yrs', '3-5 Yrs', '5+ Yrs']).optional(),
    riskTolerance: z.number().min(0).max(1),
    panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format'),
    aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar number must be 12 digits'),
    additionalDocument: z.string().url().optional().or(z.literal('')),
    investmentAmount: z.number().min(100, 'Minimum investment is ₹100'),
  }),
});

export const getMutualFundApplicationStatusSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
});

export const getUserMutualFundApplicationsSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'completed']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

// Admin schemas
export const updateSIPApplicationStatusSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
  body: z.object({
    status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'completed']),
    notes: z.string().optional(),
    rejectedReason: z.string().optional(),
  }),
});

export const updateMutualFundApplicationStatusSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
  body: z.object({
    status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'completed']),
    notes: z.string().optional(),
    rejectedReason: z.string().optional(),
  }),
});

export const getAdminSIPApplicationsSchema = z.object({
  query: z.preprocess(
    (data: any) => {
      // Convert empty strings to undefined
      if (data && typeof data === 'object') {
        const processed = { ...data };
        Object.keys(processed).forEach(key => {
          if (processed[key] === '') {
            processed[key] = undefined;
          }
        });
        return processed;
      }
      return data;
    },
    z.object({
      status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'completed', 'all']).optional(),
      search: z.string().optional(),
      page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
  ),
});

export const getAdminMutualFundApplicationsSchema = z.object({
  query: z.preprocess(
    (data: any) => {
      // Convert empty strings to undefined
      if (data && typeof data === 'object') {
        const processed = { ...data };
        Object.keys(processed).forEach(key => {
          if (processed[key] === '') {
            processed[key] = undefined;
          }
        });
        return processed;
      }
      return data;
    },
    z.object({
      status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'completed', 'all']).optional(),
      search: z.string().optional(),
      page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
  ),
});

export const getAdminSIPApplicationDetailsSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
});

export const getAdminMutualFundApplicationDetailsSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
});

// ==================== Insurance Application Validation Schemas ====================

export const submitInsuranceApplicationSchema = z.object({
  body: z.object({
    productId: z.string().optional(),
    insuranceType: z.string().min(1, 'Insurance type is required'),
    sumAssured: z.number().min(0, 'Sum assured must be positive'),
    paymentFrequency: z.string().min(1, 'Payment frequency is required'),
    policyholderDetails: z.object({
      fullName: z.string().min(1, 'Full name is required'),
      dateOfBirth: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
      contactNumber: z.string().min(10, 'Contact number is required'),
      email: z.string().email('Invalid email address'),
      address: z.string().optional(),
    }),
    nomineeDetails: z.object({
      name: z.string().min(1, 'Nominee name is required'),
      relationship: z.string().min(1, 'Relationship is required'),
      dateOfBirth: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).optional(),
      benefitShare: z.number().min(0).max(100, 'Benefit share must be between 0 and 100'),
    }).optional(),
    healthHistory: z.object({
      isSmoker: z.boolean().optional(),
      isAlcohol: z.boolean().optional(),
      preExistingConditions: z.string().optional(),
      pastSurgeries: z.string().optional(),
      currentMedications: z.string().optional(),
    }).optional(),
    documents: z.record(z.string()).optional(),
  }),
});

export const getInsuranceApplicationStatusSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
});

export const getUserInsuranceApplicationsSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'completed']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

// ==================== Loan Application Validation Schemas ====================

export const submitLoanApplicationSchema = z.object({
  body: z.object({
    productId: z.string().optional(),
    loanType: z.string().min(1, 'Loan type is required'),
    loanAmount: z.number().min(0, 'Loan amount must be positive'),
    tenure: z.number().min(1, 'Tenure must be at least 1 month'),
    personalDetails: z.object({
      fullName: z.string().min(1, 'Full name is required'),
      mobileNumber: z.string().min(10, 'Mobile number is required'),
      panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN number format').optional(),
    }),
    employmentDetails: z.object({
      employmentType: z.string().optional(),
      companyName: z.string().optional(),
      experience: z.number().optional(),
      monthlyIncome: z.number().min(0, 'Monthly income must be positive'),
      sourceOfIncome: z.string().optional(),
    }).optional(),
    eligibility: z.object({
      maxLoanAmount: z.number().optional(),
      estimatedEMI: z.number().optional(),
      eligibilityMessage: z.string().optional(),
    }).optional(),
    documents: z.record(z.string()).optional(),
  }),
});

export const getLoanApplicationStatusSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
});

export const getUserLoanApplicationsSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'completed']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

// Admin schemas for Insurance and Loan
export const updateInsuranceApplicationStatusSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
  body: z.object({
    status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'completed']),
    notes: z.string().optional(),
    rejectedReason: z.string().optional(),
  }),
});

export const updateLoanApplicationStatusSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
  body: z.object({
    status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'completed']),
    notes: z.string().optional(),
    rejectedReason: z.string().optional(),
  }),
});

export const getAdminInsuranceApplicationsSchema = z.object({
  query: z.preprocess(
    (data: any) => {
      // Convert empty strings to undefined
      if (data && typeof data === 'object') {
        const processed = { ...data };
        Object.keys(processed).forEach(key => {
          if (processed[key] === '') {
            processed[key] = undefined;
          }
        });
        return processed;
      }
      return data;
    },
    z.object({
      status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'completed', 'all']).optional(),
      search: z.string().optional(),
      page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
  ),
});

export const getAdminLoanApplicationsSchema = z.object({
  query: z.preprocess(
    (data: any) => {
      // Convert empty strings to undefined
      if (data && typeof data === 'object') {
        const processed = { ...data };
        Object.keys(processed).forEach(key => {
          if (processed[key] === '') {
            processed[key] = undefined;
          }
        });
        return processed;
      }
      return data;
    },
    z.object({
      status: z.enum(['pending', 'in_review', 'approved', 'rejected', 'completed', 'all']).optional(),
      search: z.string().optional(),
      page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
      limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    })
  ),
});

export const getAdminInsuranceApplicationDetailsSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
});

export const getAdminLoanApplicationDetailsSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
});

