import { z } from 'zod';

export const getSubcategoriesSchema = z.object({
  params: z.object({
    categoryId: z.string().min(1, 'Category ID is required').optional(),
    subcategoryId: z.string().min(1, 'Subcategory ID is required').optional(),
  }),
});

export const getServicesSchema = z.object({
  query: z.object({
    categoryId: z.string().optional(),
    subcategoryId: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  }),
});

export const getServiceDetailsSchema = z.object({
  params: z.object({
    serviceId: z.string().min(1, 'Service ID is required'),
  }),
});

export const submitApplicationSchema = z.object({
  body: z.object({
    serviceId: z.string().min(1, 'Service ID is required'),
    serviceType: z.string().optional(),
    clientDetails: z.object({
      clientName: z.string().min(1, 'Client name is required'),
      businessName: z.string().min(1, 'Business name is required'),
      gstin: z.string().optional(),
      addressProof: z.string().optional(),
    }),
    documents: z.record(z.string()).optional(),
    additionalInfo: z.record(z.any()).optional(),
  }),
});

export const getApplicationStatusSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
});

export const getUserApplicationsSchema = z.object({
  query: z.object({
    status: z.enum(['pending', 'in_review', 'awaiting_clarification', 'approved', 'rejected', 'completed']).optional(),
    serviceType: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const downloadCertificateSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
  query: z.object({
    type: z.enum(['certificate', 'application', 'invoice']).optional().default('certificate'),
  }),
});

export const uploadDocumentSchema = z.object({
  body: z.object({
    documentType: z.enum(['aadhar', 'pan', 'address_proof', 'business_proof', 'other']),
    applicationId: z.string().optional(),
  }),
});

export const startChatSchema = z.object({
  body: z.object({
    applicationId: z.string().optional(),
    serviceType: z.string().optional(),
    message: z.string().optional(),
  }),
});

export const sendMessageSchema = z.object({
  params: z.object({
    chatId: z.string().min(1, 'Chat ID is required'),
  }),
  body: z.object({
    message: z.string().optional(),
    attachments: z.array(z.string()).optional(),
  }).refine((data) => data.message || (data.attachments && data.attachments.length > 0), {
    message: 'Message or attachments required',
  }),
});

export const getMessagesSchema = z.object({
  params: z.object({
    chatId: z.string().min(1, 'Chat ID is required'),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('50'),
    before: z.string().datetime().optional(),
  }),
});

export const requestCallbackSchema = z.object({
  body: z.object({
    phoneNumber: z.string().min(10, 'Phone number is required'),
    preferredTime: z.string().optional(),
    applicationId: z.string().optional(),
    reason: z.string().optional(),
  }),
});

export const updateApplicationStatusSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
  body: z.object({
    status: z.enum(['pending', 'in_review', 'awaiting_clarification', 'approved', 'rejected', 'completed']),
    notes: z.string().optional(),
    timelineUpdate: z.object({
      title: z.string(),
      description: z.string().optional(),
      icon: z.string().optional(),
    }).optional(),
  }),
});

export const requestClarificationSchema = z.object({
  params: z.object({
    applicationId: z.string().min(1, 'Application ID is required'),
  }),
  body: z.object({
    message: z.string().min(1, 'Message is required'),
    requiredDocuments: z.array(z.string()).optional(),
    deadline: z.string().datetime().optional(),
  }),
});

export const getTestimonialsSchema = z.object({
  query: z.object({
    type: z.enum(['video', 'text']).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
  }),
});

export const getRecentCoursesSchema = z.object({
  query: z.object({
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
    category: z.string().optional(),
  }),
});

// Form validation schemas
export const getFormSchemaSchema = z.object({
  params: z.object({
    subSubcategoryId: z.string().min(1, 'Sub-subcategory ID is required'),
  }),
});

export const saveFormSchemaSchema = z.object({
  body: z.object({
    subSubcategoryId: z.string().min(1, 'Sub-subcategory ID is required'),
    fields: z.array(z.object({
      name: z.string().min(1, 'Field name is required'),
      label: z.string().min(1, 'Field label is required'),
      type: z.enum(['text', 'email', 'phone', 'number', 'date', 'select', 'textarea', 'file', 'checkbox']),
      placeholder: z.string().optional(),
      isRequired: z.boolean().default(false),
      validation: z.object({
        min: z.number().optional(),
        max: z.number().optional(),
        pattern: z.string().optional(),
        minLength: z.number().optional(),
        maxLength: z.number().optional(),
      }).optional(),
      options: z.array(z.object({
        value: z.string(),
        label: z.string(),
      })).optional(),
      defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
      helpText: z.string().optional(),
      section: z.string().optional(),
      order: z.number(),
    })),
    sections: z.array(z.object({
      id: z.string(),
      title: z.string(),
      description: z.string().optional(),
      order: z.number(),
    })).optional(),
  }),
});

export const submitFormEntrySchema = z.object({
  body: z.object({
    subSubcategoryId: z.string().min(1, 'Sub-subcategory ID is required'),
    formData: z.record(z.any()),
    files: z.record(z.string()).optional(),
  }),
});

export const getUserFormEntriesSchema = z.object({
  query: z.object({
    subSubcategoryId: z.string().optional(),
    status: z.enum(['draft', 'submitted', 'in_review', 'approved', 'rejected']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).optional().default('20'),
  }),
});

export const getFormEntryDetailsSchema = z.object({
  params: z.object({
    entryId: z.string().min(1, 'Entry ID is required'),
  }),
});

export const saveDraftEntrySchema = z.object({
  body: z.object({
    entryId: z.string().optional(),
    subSubcategoryId: z.string().min(1, 'Sub-subcategory ID is required'),
    formData: z.record(z.any()),
    files: z.record(z.string()).optional(),
  }),
});

