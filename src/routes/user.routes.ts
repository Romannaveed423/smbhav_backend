import { Router } from 'express';
import { getProfile, updateProfile } from '../controllers/user.controller';
import {
  getUserLocation,
  getUserLocations,
  updateUserLocation,
} from '../controllers/store.controller';
import {
  getUserFavorites,
  addToFavorites,
  removeFromFavorites,
  checkFavoriteStatus,
} from '../controllers/favorites.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { updateProfileSchema } from '../validations/user.validation';
import { updateUserLocationSchema } from '../validations/store.validation';
import {
  getUserFavoritesSchema,
  addToFavoritesSchema,
  checkFavoriteStatusSchema,
} from '../validations/favorites.validation';
import { healthCheck } from '../controllers/health.controller';

const router = Router();

// Health check endpoint
router.get('/health', healthCheck('user'));

// Profile routes
router.get('/profile', authenticate, getProfile);
router.put('/profile', authenticate, validate(updateProfileSchema), updateProfile);

// Location routes
router.get('/location', authenticate, getUserLocation);
router.get('/locations', authenticate, getUserLocations);
router.put('/location', authenticate, validate(updateUserLocationSchema), updateUserLocation);

// Favorites routes
router.get('/favorites', authenticate, validate(getUserFavoritesSchema), getUserFavorites);
router.post('/favorites', authenticate, validate(addToFavoritesSchema), addToFavorites);
router.delete('/favorites/:favoriteId', authenticate, removeFromFavorites);
router.get('/favorites/check', authenticate, validate(checkFavoriteStatusSchema), checkFavoriteStatus);

export default router;

