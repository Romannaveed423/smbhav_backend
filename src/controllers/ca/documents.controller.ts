import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { CADocument } from '../../models/CADocument';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/ca/documents';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter,
});

// Error handler for multer
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
 * Upload document
 */
export const uploadDocument = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { documentType, applicationId } = req.body;
    const file = req.file;

    if (!file) {
      throw createError('File is required', 400, 'VALIDATION_ERROR');
    }

    if (!documentType) {
      throw createError('Document type is required', 400, 'VALIDATION_ERROR');
    }

    const allowedTypes = ['aadhar', 'pan', 'address_proof', 'business_proof', 'other'];
    if (!allowedTypes.includes(documentType)) {
      throw createError('Invalid document type', 400, 'VALIDATION_ERROR');
    }

    // Generate document URL (in production, upload to cloud storage)
    const documentUrl = `${process.env.BASE_URL || 'https://yourapp.com'}/uploads/ca/documents/${file.filename}`;

    const document = await CADocument.create({
      userId: new mongoose.Types.ObjectId(userId),
      applicationId: applicationId ? new mongoose.Types.ObjectId(applicationId) : undefined,
      documentType,
      documentUrl,
      fileName: file.originalname,
      fileSize: file.size,
      mimeType: file.mimetype,
      verificationStatus: 'pending',
    });

    res.status(201).json({
      success: true,
      data: {
        documentId: document.documentId,
        documentUrl: document.documentUrl,
        documentType: document.documentType,
        fileName: document.fileName,
        fileSize: document.fileSize,
        uploadedAt: document.uploadedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List all documents for an application (Admin/CA)
 */
export const getAllApplicationDocumentsAdmin = async (
req: AuthRequest, 
 res: Response, 
 next: NextFunction
): Promise<void> => {
   try {
    const { userId, documentType, status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Admin / CA only
    if (!req.user || !['admin', 'ca'].includes(req.user.role)) {
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }

    const query: any = {};
    if (userId) query.userId = new mongoose.Types.ObjectId(userId as string);
    if (documentType) query.documentType = documentType;
    if (status) query.verificationStatus = status;

    const [documents, total] = await Promise.all([
      CADocument.find(query)
        .sort({ uploadedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CADocument.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Verify document (Admin/CA)
 */
export const verifyDocumentAdmin = async (
 req: AuthRequest, 
 res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { documentId } = req.params;
    const { action, note } = req.body;
    // Admin / CA only
    if (!req.user || !['admin', 'ca'].includes(req.user.role)) {
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }
    const document = await CADocument.findOne({ documentId });

    if (!document) {
      throw createError('Document not found', 404, 'NOT_FOUND');
    }
    if (action === 'approve') {
      document.verificationStatus = 'verified';
    } else if (action === 'reject') {
      document.verificationStatus = 'rejected';
      document.rejectionNote = note || '';
    }
    document.verifiedBy = new mongoose.Types.ObjectId(req.user.id);
    document.verifiedAt = new Date();
    await document.save();
    res.json({
      success: true,
      message: `Document ${action}d successfully`,
      data: {
        documentId: document.documentId,
        rejectionNote: document.rejectionNote,
        verifiedBy: document.verifiedBy,
        verifiedAt: document.verifiedAt,
        verificationStatus: document.verificationStatus,
      },
    });
  } catch (error) {
    next(error);
  }
};


