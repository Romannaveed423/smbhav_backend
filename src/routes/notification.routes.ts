import { Router } from 'express';
import {
  getNotifications,
  markNotificationAsRead,
} from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { getNotificationsSchema } from '../validations/notification.validation';
import { healthCheck } from '../controllers/health.controller';

const router = Router();

// Health check endpoint
router.get('/health', healthCheck('notifications'));

// Notification routes
router.get('/', authenticate, validate(getNotificationsSchema), getNotifications);
router.put('/:notificationId/read', authenticate, markNotificationAsRead);

export default router;

