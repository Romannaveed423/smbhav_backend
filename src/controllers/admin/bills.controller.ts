import { Response, NextFunction } from 'express';
import { AdminRequest } from '../../middleware/admin';
import { createError } from '../../utils/errors';
import { BillService } from '../../models/BillService';
import { BillTransaction } from '../../models/BillTransaction';

// ======== Admin Bill Services =========

export const listAdminBillServices = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, status, page = '1', limit = '20', search } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    if (type && typeof type === 'string') {
      filter.type = type;
    }

    if (status === 'active') {
      filter.isActive = true;
    } else if (status === 'inactive') {
      filter.isActive = false;
    }

    if (search && typeof search === 'string') {
      filter.name = { $regex: search, $options: 'i' };
    }

    const [services, total] = await Promise.all([
      BillService.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      BillService.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        services: services.map((svc) => ({
          id: svc._id.toString(),
          name: svc.name,
          description: svc.description || null,
          type: svc.type,
          providerCode: svc.providerCode,
          icon: svc.icon || null,
          minAmount: svc.minAmount,
          maxAmount: svc.maxAmount,
          commissionType: svc.commissionType,
          commissionValue: svc.commissionValue,
          isActive: svc.isActive,
          createdAt: svc.createdAt,
        })),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const createAdminBillService = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const {
      name,
      description,
      type,
      providerCode,
      icon,
      minAmount,
      maxAmount,
      commissionType,
      commissionValue,
      isActive,
      metadata,
    } = req.body;

    const service = await BillService.create({
      name,
      description,
      type,
      providerCode,
      icon,
      minAmount,
      maxAmount,
      commissionType,
      commissionValue,
      isActive: isActive !== undefined ? isActive : true,
      metadata,
    });

    res.status(201).json({
      success: true,
      message: 'Bill service created successfully',
      data: {
        service: {
          id: service._id.toString(),
          name: service.name,
          description: service.description || null,
          type: service.type,
          providerCode: service.providerCode,
          icon: service.icon || null,
          minAmount: service.minAmount,
          maxAmount: service.maxAmount,
          commissionType: service.commissionType,
          commissionValue: service.commissionValue,
          isActive: service.isActive,
          createdAt: service.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAdminBillService = async (req: AdminRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { serviceId } = req.params;
    const updates = req.body ?? {};

    const service = await BillService.findByIdAndUpdate(serviceId, updates, { new: true });
    if (!service) {
      throw createError('Bill service not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      message: 'Bill service updated successfully',
      data: {
        service: {
          id: service._id.toString(),
          name: service.name,
          description: service.description || null,
          type: service.type,
          providerCode: service.providerCode,
          icon: service.icon || null,
          minAmount: service.minAmount,
          maxAmount: service.maxAmount,
          commissionType: service.commissionType,
          commissionValue: service.commissionValue,
          isActive: service.isActive,
          createdAt: service.createdAt,
          updatedAt: service.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const toggleAdminBillServiceStatus = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { serviceId } = req.params;
    const { isActive } = req.body;

    const service = await BillService.findById(serviceId);
    if (!service) {
      throw createError('Bill service not found', 404, 'NOT_FOUND');
    }

    service.isActive = Boolean(isActive);
    await service.save();

    res.json({
      success: true,
      message: 'Bill service status updated successfully',
      data: {
        service: {
          id: service._id.toString(),
          isActive: service.isActive,
          updatedAt: service.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// ======== Admin Bill Transactions =========

export const listAdminBillTransactions = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { page = '1', limit = '20', status, type, userId, startDate, endDate, search } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    if (status && typeof status === 'string') {
      filter.status = status;
    }

    if (type && typeof type === 'string') {
      filter.serviceType = type;
    }

    if (userId && typeof userId === 'string') {
      filter.userId = userId;
    }

    if (search && typeof search === 'string') {
      filter.$or = [
        { accountNumber: { $regex: search, $options: 'i' } },
        { serviceName: { $regex: search, $options: 'i' } },
        { providerTransactionId: { $regex: search, $options: 'i' } },
      ];
    }

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate && typeof startDate === 'string') {
        filter.createdAt.$gte = new Date(startDate);
      }
      if (endDate && typeof endDate === 'string') {
        filter.createdAt.$lte = new Date(endDate);
      }
    }

    const [transactions, total] = await Promise.all([
      BillTransaction.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      BillTransaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        transactions: transactions.map((tx) => ({
          id: tx._id.toString(),
          userId: tx.userId.toString(),
          serviceName: tx.serviceName,
          serviceType: tx.serviceType,
          providerCode: tx.providerCode,
          accountNumber: tx.accountNumber,
          amount: tx.amount,
          commissionAmount: tx.commissionAmount,
          status: tx.status,
          providerTransactionId: tx.providerTransactionId || null,
          errorMessage: tx.errorMessage || null,
          refundReason: tx.refundReason || null,
          refundedAt: tx.refundedAt || null,
          createdAt: tx.createdAt,
        })),
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdminBillTransaction = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { transactionId } = req.params;

    const transaction = await BillTransaction.findById(transactionId).lean();
    if (!transaction) {
      throw createError('Transaction not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        transaction: {
          id: transaction._id.toString(),
          userId: transaction.userId.toString(),
          serviceName: transaction.serviceName,
          serviceType: transaction.serviceType,
          providerCode: transaction.providerCode,
          accountNumber: transaction.accountNumber,
          amount: transaction.amount,
          commissionAmount: transaction.commissionAmount,
          status: transaction.status,
          providerTransactionId: transaction.providerTransactionId || null,
          errorMessage: transaction.errorMessage || null,
          refundReason: transaction.refundReason || null,
          refundedAt: transaction.refundedAt || null,
          providerResponse: transaction.providerResponse || null,
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const refundAdminBillTransaction = async (
  req: AdminRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { transactionId } = req.params;
    const { reason } = req.body;

    const transaction = await BillTransaction.findById(transactionId);
    if (!transaction) {
      throw createError('Transaction not found', 404, 'NOT_FOUND');
    }

    if (transaction.status !== 'success') {
      throw createError('Only successful transactions can be refunded', 400, 'INVALID_STATE');
    }

    transaction.status = 'refunded';
    transaction.refundReason = reason;
    transaction.refundedAt = new Date();
    await transaction.save();

    res.json({
      success: true,
      message: 'Transaction refunded successfully (logical refund only, no gateway call)',
      data: {
        transaction: {
          id: transaction._id.toString(),
          status: transaction.status,
          refundReason: transaction.refundReason,
          refundedAt: transaction.refundedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

