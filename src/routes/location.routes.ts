import { Router } from 'express';
import { searchLocations } from '../controllers/store.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { searchLocationsSchema } from '../validations/store.validation';
import { healthCheck } from '../controllers/health.controller';

const router = Router();

// Health check endpoint
router.get('/health', healthCheck('locations'));

// Location search route (public endpoint for searching locations)
router.get('/search', authenticate, validate(searchLocationsSchema), searchLocations);

export default router;

