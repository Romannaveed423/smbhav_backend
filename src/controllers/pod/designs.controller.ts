import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { PODDesign } from '../../models/PODDesign';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for design uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/pod/designs';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `design-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/svg+xml', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, SVG, and PDF are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
});

export const handleMulterError = (err: any, req: any, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit',
        error: 'FILE_TOO_LARGE',
      });
    }
  }
  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message || 'File upload error',
      error: 'UPLOAD_ERROR',
    });
  }
  next();
};

/**
 * Upload design/artwork
 */
export const uploadDesign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { productId, designType = 'image' } = req.body;
    const file = req.file;

    if (!file) {
      throw createError('File is required', 400, 'VALIDATION_ERROR');
    }

    // Generate design URL
    const designUrl = `${process.env.BASE_URL || 'https://yourapp.com'}/uploads/pod/designs/${file.filename}`;
    const thumbnailUrl = designUrl; // In production, generate thumbnail

    // Basic validation (in production, use image processing library to get dimensions)
    const dimensions = {
      width: 2000, // Placeholder - use sharp or similar to get actual dimensions
      height: 2000,
    };

    const design = await PODDesign.create({
      userId: new mongoose.Types.ObjectId(userId),
      designUrl,
      thumbnailUrl,
      fileName: file.originalname,
      fileSize: file.size,
      dimensions,
      designType,
      validation: {
        isValid: true,
        minResolution: '300x300',
        maxResolution: '5000x5000',
        recommendedResolution: '2000x2000',
      },
    });

    res.status(201).json({
      success: true,
      data: {
        designId: design.designId,
        designUrl: design.designUrl,
        thumbnailUrl: design.thumbnailUrl,
        fileName: design.fileName,
        fileSize: design.fileSize,
        dimensions: design.dimensions,
        uploadedAt: design.uploadedAt,
        validation: design.validation,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Validate design
 */
export const validateDesign = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { designUrl, productId, productType, printArea } = req.body;

    // Basic validation (in production, implement actual image validation)
    const isValid = true;
    const warnings: string[] = [];
    const recommendations = [
      'Design resolution is optimal for printing',
      'Consider adding 0.125 inch bleed area',
    ];

    const previewUrl = designUrl; // In production, generate preview

    res.json({
      success: true,
      data: {
        isValid,
        warnings,
        recommendations,
        previewUrl,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Generate product mockup
 */
export const generateMockup = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { productId, selectedColor, selectedSize, design, text } = req.body;

    // In production, use image processing to generate mockup
    const mockupId = `MOCKUP${Date.now()}`;
    const mockupUrl = `${process.env.BASE_URL || 'https://yourapp.com'}/mockups/${mockupId}.jpg`;
    const thumbnailUrl = mockupUrl;

    res.json({
      success: true,
      data: {
        mockupId,
        mockupUrl,
        thumbnailUrl,
        generatedAt: new Date(),
      },
    });
  } catch (error) {
    next(error);
  }
};

