import { Response, NextFunction } from 'express';
import KYCDocument from '../models/KYCDocument';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { NotFoundError, ValidationError } from '../utils/errors';
import { uploadFile } from '../services/fileUpload.service';
import { createNotification } from '../services/notification.service';

export const uploadDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.file) {
      throw new ValidationError('No file uploaded');
    }

    const { documentType } = req.body;

    if (!documentType) {
      throw new ValidationError('Document type is required');
    }

    const fileUrl = await uploadFile(req.file, 'kyc-documents');
    if (!fileUrl) {
      throw new ValidationError('File upload failed');
    }

    const document = await KYCDocument.create({
      userId: req.user!.userId,
      documentType,
      documentUrl: fileUrl,
    });

    await createNotification({
      userId: req.user!.userId,
      type: 'kyc',
      title: 'Document Uploaded',
      message: 'Your KYC document has been uploaded and is under review',
      metadata: { documentId: document._id },
    });

    res.status(201).json({
      success: true,
      message: 'Document uploaded successfully',
      data: document,
    });
  } catch (error) {
    next(error);
  }
};

export const getDocuments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const documents = await KYCDocument.find({
      userId: req.user?.userId,
    }).sort({ uploadedAt: -1 });

    res.json({
      success: true,
      data: documents,
    });
  } catch (error) {
    next(error);
  }
};

export const getKYCStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const user = await User.findById(req.user?.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const documents = await KYCDocument.find({ userId: req.user?.userId });

    res.json({
      success: true,
      data: {
        kycStatus: user.kycStatus,
        documents,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const document = await KYCDocument.findOne({
      _id: id,
      userId: req.user?.userId,
    });

    if (!document) {
      throw new NotFoundError('Document not found');
    }

    if (document.verificationStatus === 'approved') {
      throw new ValidationError('Cannot delete approved document');
    }

    await document.deleteOne();

    res.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

