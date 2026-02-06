import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { createError } from '../utils/errors';
import { BillService } from '../models/BillService';
import { BillTransaction } from '../models/BillTransaction';
import { billProviderService } from '../services/billProvider.service';

export const listBillServices = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type } = req.query;

    const filter: any = { isActive: true };
    if (type && typeof type === 'string') {
      filter.type = type;
    }

    const services = await BillService.find(filter).sort({ type: 1, name: 1 }).lean();

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
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const payBill = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { serviceId, accountNumber, amount, customerName, phone, metadata } = req.body;

    const service = await BillService.findOne({ _id: serviceId, isActive: true });
    if (!service) {
      throw createError('Bill service not found or inactive', 404, 'NOT_FOUND');
    }

    const numericAmount = typeof amount === 'string' ? Number(amount) : amount;
    if (Number.isNaN(numericAmount) || numericAmount <= 0) {
      throw createError('Amount must be a positive number', 400, 'VALIDATION_ERROR');
    }

    if (numericAmount < service.minAmount || numericAmount > service.maxAmount) {
      throw createError(
        `Amount must be between ${service.minAmount} and ${service.maxAmount}`,
        400,
        'VALIDATION_ERROR'
      );
    }

    // Compute commission
    const commissionAmount =
      service.commissionType === 'percentage'
        ? (numericAmount * service.commissionValue) / 100
        : service.commissionValue;

    // Create initial transaction in "processing" state
    const transaction = await BillTransaction.create({
      userId,
      serviceId: service._id,
      serviceType: service.type,
      serviceName: service.name,
      providerCode: service.providerCode,
      accountNumber,
      customerName,
      phone,
      amount: numericAmount,
      commissionAmount,
      status: 'processing',
    });

    // Call provider (mock for now)
    const providerResult = await billProviderService.processPayment({
      serviceType: service.type,
      providerCode: service.providerCode,
      accountNumber,
      amount: numericAmount,
      metadata: metadata || {},
    });

    if (!providerResult.success) {
      transaction.status = 'failed';
      transaction.errorMessage = providerResult.message || 'Provider rejected the transaction';
      transaction.providerResponse = providerResult.raw;
      await transaction.save();

      throw createError(transaction.errorMessage, 400, 'PROVIDER_ERROR');
    }

    transaction.status = 'success';
    transaction.providerTransactionId = providerResult.providerTransactionId;
    transaction.providerResponse = providerResult.raw;
    await transaction.save();

    res.status(201).json({
      success: true,
      message: 'Bill payment processed successfully',
      data: {
        transaction: {
          id: transaction._id.toString(),
          serviceName: transaction.serviceName,
          serviceType: transaction.serviceType,
          providerCode: transaction.providerCode,
          accountNumber: transaction.accountNumber,
          amount: transaction.amount,
          commissionAmount: transaction.commissionAmount,
          status: transaction.status,
          providerTransactionId: transaction.providerTransactionId || null,
          createdAt: transaction.createdAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const listUserBillTransactions = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { page = '1', limit = '20', status, type, startDate, endDate } = req.query;
    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 20;
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {
      userId,
    };

    if (status && typeof status === 'string') {
      filter.status = status;
    }

    if (type && typeof type === 'string') {
      filter.serviceType = type;
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
          serviceName: tx.serviceName,
          serviceType: tx.serviceType,
          providerCode: tx.providerCode,
          accountNumber: tx.accountNumber,
          amount: tx.amount,
          commissionAmount: tx.commissionAmount,
          status: tx.status,
          providerTransactionId: tx.providerTransactionId || null,
          errorMessage: tx.errorMessage || null,
          createdAt: tx.createdAt,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getUserBillTransaction = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw createError('Authentication required', 401, 'UNAUTHORIZED');
    }

    const { transactionId } = req.params;

    const transaction = await BillTransaction.findOne({ _id: transactionId, userId }).lean();
    if (!transaction) {
      throw createError('Transaction not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        transaction: {
          id: transaction._id.toString(),
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
          createdAt: transaction.createdAt,
          updatedAt: transaction.updatedAt,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

