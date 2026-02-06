import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getProducts, getProductById } from '../controllers/product.controller';

const router = Router();

router.use(authenticate);
router.get('/', getProducts);
router.get('/:id', getProductById);

export default router;

