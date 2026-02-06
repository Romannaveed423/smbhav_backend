import { Response, NextFunction } from 'express';
import Withdrawal from '../models/Withdrawal';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { NotFoundError, ValidationError } from '../utils/errors';
import { MIN_WITHDRAWAL_AMOUNT, WITHDRAWAL_STATUS } from '../utils/constants';
import { encrypt } from '../utils/encryption';
import { createTransaction } from '../services/transaction.service';
import { createNotification } from '../services/notification.service';

export const requestWithdrawal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { amount, bankDetails } = req.body;

    if (!amount || amount < MIN_WITHDRAWAL_AMOUNT) {
      throw new ValidationError(
        `Minimum withdrawal amount is ₹${MIN_WITHDRAWAL_AMOUNT}`
      );
    }

    const user = await User.findById(req.user?.userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.walletBalance < amount) {
      throw new ValidationError('Insufficient balance');
    }

    if (!user.bankDetails && !bankDetails) {
      throw new ValidationError('Bank details are required');
    }

    const withdrawalBankDetails = bankDetails || user.bankDetails!;

    const withdrawal = await Withdrawal.create({
      userId: req.user!.userId,
      amount,
      bankDetails: {
        bankName: withdrawalBankDetails.bankName,
        accountNumber: encrypt(withdrawalBankDetails.accountNumber),
        ifscCode: withdrawalBankDetails.ifscCode,
        accountHolderName: withdrawalBankDetails.accountHolderName,
      },
      status: WITHDRAWAL_STATUS.PENDING,
    });

    await createNotification({
      userId: req.user!.userId,
      type: 'payment',
      title: 'Withdrawal Requested',
      message: `Withdrawal request of ₹${amount} has been submitted`,
      metadata: { withdrawalId: withdrawal._id },
    });

    res.status(201).json({
      success: true,
      message: 'Withdrawal request submitted successfully',
      data: withdrawal,
    });
  } catch (error) {
    next(error);
  }
};

export const getWithdrawals = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const query: any = { userId: req.user?.userId };

    if (status) query.status = status;

    const withdrawals = await Withdrawal.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Withdrawal.countDocuments(query);

    res.json({
      success: true,
      data: withdrawals,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelWithdrawal = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const withdrawal = await Withdrawal.findOne({
      _id: id,
      userId: req.user?.userId,
    });

    if (!withdrawal) {
      throw new NotFoundError('Withdrawal not found');
    }

    if (withdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
      throw new ValidationError('Only pending withdrawals can be cancelled');
    }

    withdrawal.status = WITHDRAWAL_STATUS.CANCELLED;
    await withdrawal.save();

    res.json({
      success: true,
      message: 'Withdrawal cancelled successfully',
    });
  } catch (error) {
    next(error);
  }
};

