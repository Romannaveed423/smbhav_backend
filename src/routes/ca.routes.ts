import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { healthCheck } from '../controllers/health.controller';

// Catalog controllers
import {
  getCategories,
  getSubcategories,
  getSubSubcategories,
  getServices,
  getServiceDetails,
  getGSTTabs,
} from '../controllers/ca/catalog.controller';

// Form controllers
import {
  getFormSchema,
  saveFormSchema,
  submitFormEntry,
  getUserFormEntries,
  getFormEntryDetails,
  saveDraftEntry,
} from '../controllers/ca/forms.controller';

// Application controllers
import {
  submitApplication,
  getApplicationStatus,
  getUserApplications,
  downloadCertificate,
  updateApplicationStatus,
  requestClarification,
} from '../controllers/ca/applications.controller';

// Document controllers
import { uploadDocument, upload, handleMulterError } from '../controllers/ca/documents.controller';

// Bulk import controllers
import {
  bulkImportCategories,
  bulkImportSubcategories,
  upload as bulkUpload,
  handleMulterError as bulkHandleMulterError,
} from '../controllers/ca/bulkImport.controller';

// Chat controllers
import {
  startChat,
  sendMessage,
  getMessages,
  getActiveChats,
} from '../controllers/ca/chat.controller';

// Support controllers
import {
  requestCallback,
  getSupportPhone,
} from '../controllers/ca/support.controller';

// Additional controllers
import {
  getTestimonials,
  getRecentCourses,
} from '../controllers/ca/additional.controller';

// Validation schemas
import {
  getSubcategoriesSchema,
  getServicesSchema,
  getServiceDetailsSchema,
  submitApplicationSchema,
  getApplicationStatusSchema,
  getUserApplicationsSchema,
  downloadCertificateSchema,
  uploadDocumentSchema,
  startChatSchema,
  sendMessageSchema,
  getMessagesSchema,
  requestCallbackSchema,
  updateApplicationStatusSchema,
  requestClarificationSchema,
  getTestimonialsSchema,
  getRecentCoursesSchema,
  getFormSchemaSchema,
  saveFormSchemaSchema,
  submitFormEntrySchema,
  getUserFormEntriesSchema,
  getFormEntryDetailsSchema,
  saveDraftEntrySchema,
} from '../validations/ca.validation';

const   router = Router();

// Health check endpoint
router.get('/health', healthCheck('ca-services'));

// ==================== Catalog Routes ====================
router.get('/category', authenticate, getCategories);
router.get('/category/:categoryId/subcategory', authenticate, validate(getSubcategoriesSchema), getSubcategories);
router.get('/subcategory/:subcategoryId/sub-subcategory', authenticate, validate(getSubcategoriesSchema), getSubSubcategories);
router.get('/services', authenticate, validate(getServicesSchema), getServices);
router.get('/services/:serviceId', authenticate, validate(getServiceDetailsSchema), getServiceDetails);
router.get('/services/gst/tabs', authenticate, getGSTTabs);

// ==================== Form Routes ====================
router.get('/forms/schema/:subSubcategoryId', authenticate, validate(getFormSchemaSchema), getFormSchema);
router.post('/forms/schema', authenticate, validate(saveFormSchemaSchema), saveFormSchema); // Admin only
router.get('/forms/entries', authenticate, validate(getUserFormEntriesSchema), getUserFormEntries);
router.get('/forms/entries/:entryId', authenticate, validate(getFormEntryDetailsSchema), getFormEntryDetails);
router.post('/forms/entries', authenticate, validate(submitFormEntrySchema), submitFormEntry);
router.post('/forms/entries/draft', authenticate, validate(saveDraftEntrySchema), saveDraftEntry);

// ==================== Application Routes ====================
router.post('/applications', authenticate, validate(submitApplicationSchema), submitApplication);
router.get('/applications', authenticate, validate(getUserApplicationsSchema), getUserApplications);
router.get('/applications/:applicationId/status', authenticate, validate(getApplicationStatusSchema), getApplicationStatus);
router.get('/applications/:applicationId/download', authenticate, validate(downloadCertificateSchema), downloadCertificate);
router.patch('/applications/:applicationId/status', authenticate, validate(updateApplicationStatusSchema), updateApplicationStatus);
router.post('/applications/:applicationId/clarification', authenticate, validate(requestClarificationSchema), requestClarification);

// ==================== Document Routes ====================
router.post('/documents/upload', authenticate, upload.single('file'), handleMulterError, validate(uploadDocumentSchema), uploadDocument);

// ==================== Bulk Import Routes ====================
router.post('/bulk-import/categories', authenticate, bulkUpload.single('file'), bulkHandleMulterError, bulkImportCategories);
router.post('/bulk-import/subcategories', authenticate, bulkUpload.single('file'), bulkHandleMulterError, bulkImportSubcategories);

// ==================== Chat Routes ====================
router.post('/chat/start', authenticate, validate(startChatSchema), startChat);
router.get('/chat', authenticate, getActiveChats);
router.post('/chat/:chatId/messages', authenticate, upload.array('attachments', 5), validate(sendMessageSchema), sendMessage);
router.get('/chat/:chatId/messages', authenticate, validate(getMessagesSchema), getMessages);

// ==================== Support Routes ====================
router.post('/support/callback', authenticate, validate(requestCallbackSchema), requestCallback);
router.get('/support/phone', authenticate, getSupportPhone);

// ==================== Additional Routes ====================
router.get('/testimonials', authenticate, validate(getTestimonialsSchema), getTestimonials);
router.get('/courses', authenticate, validate(getRecentCoursesSchema), getRecentCourses);

export default router;

