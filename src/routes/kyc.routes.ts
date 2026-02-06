import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import {
  uploadDocument,
  getDocuments,
  getKYCStatus,
  deleteDocument,
} from '../controllers/kyc.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(authenticate);
router.post('/documents', upload.single('document'), uploadDocument);
router.get('/documents', getDocuments);
router.get('/status', getKYCStatus);
router.delete('/documents/:id', deleteDocument);

export default router;

