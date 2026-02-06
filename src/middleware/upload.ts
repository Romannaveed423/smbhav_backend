import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';
import { Request } from 'express';
import { Express } from 'express';


const storage = new CloudinaryStorage({
  cloudinary,
    params: async (
    _req: Request,
    file: Express.Multer.File
    ) => ({
    folder: 'ca-documents',
    resource_type: 'auto',
    public_id: `${Date.now()}-${file.originalname}`,
    }),
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});
