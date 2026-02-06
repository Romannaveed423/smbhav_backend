import { Router } from 'express';
import {
  listCategories,
} from '../../controllers/admin/categories.controller';
import { authenticate } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/admin';
import { validate } from '../../middleware/validate';
import {
  listCategoriesSchema,
} from '../../validations/admin/categories.validation';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(requireAdmin);

// Categories routes (enum-based, read-only for now)
router.get('/categories', validate(listCategoriesSchema), listCategories);

export default router;

