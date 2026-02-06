import { Router } from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
} from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  addToCartSchema,
  updateCartItemSchema,
} from '../validations/cart.validation';
import { healthCheck } from '../controllers/health.controller';

const router = Router();

// Health check endpoint
router.get('/health', healthCheck('cart'));

// Cart routes
router.get('/', authenticate, getCart);
router.post('/items', authenticate, validate(addToCartSchema), addToCart);
router.put('/items/:itemId', authenticate, validate(updateCartItemSchema), updateCartItem);
router.delete('/items/:itemId', authenticate, removeFromCart);
router.delete('/', authenticate, clearCart);

export default router;

