import { Response, NextFunction } from 'express';
import Lead, { ILead } from '../models/Lead';
import Product from '../models/Product';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth.middleware';
import { NotFoundError, ValidationError, ForbiddenError } from '../utils/errors';
import { LEAD_STATUS } from '../utils/constants';
import { createTransaction } from '../services/transaction.service';
import { createNotification } from '../services/notification.service';

// Generate unique lead number
const generateLeadNumber = async (): Promise<string> => {
  const count = await Lead.countDocuments();
  return `LEAD${String(count + 1).padStart(6, '0')}`;
};

export const createLead = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const {
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      productId,
      notes,
    } = req.body;

    if (!customerName || !customerPhone || !productId) {
      throw new ValidationError('Customer name, phone, and product are required');
    }

    const product = await Product.findById(productId);
    if (!product) {
      throw new NotFoundError('Product not found');
    }

    const leadNumber = await generateLeadNumber();
    const lead = await Lead.create({
      leadNumber,
      agentId: req.user!.userId,
      customerName,
      customerPhone,
      customerEmail,
      customerAddress,
      productId,
      productName: product.name,
      notes,
      commissionAmount: product.commission.amount,
      statusHistory: [
        {
          status: LEAD_STATUS.NEW,
          changedAt: new Date(),
          changedBy: req.user!.userId,
        },
      ],
    });

    // Update user's total leads
    await User.findByIdAndUpdate(req.user!.userId, {
      $inc: { totalLeads: 1 },
    });

    // Create notification
    await createNotification({
      userId: req.user!.userId,
      type: 'lead_update',
      title: 'New Lead Created',
      message: `Lead ${leadNumber} has been created for ${product.name}`,
      metadata: { leadId: lead._id },
    });

    res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const getLeads = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status, productId, startDate, endDate, page = 1, limit = 10 } = req.query;
    const query: any = { agentId: req.user!.userId };

    if (status) query.status = status;
    if (productId) query.productId = productId;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate as string);
      if (endDate) query.createdAt.$lte = new Date(endDate as string);
    }

    const leads = await Lead.find(query)
      .populate('productId', 'name category')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Lead.countDocuments(query);

    res.json({
      success: true,
      data: leads,
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

export const getLeadById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const lead = await Lead.findOne({
      _id: id,
      agentId: req.user!.userId,
    }).populate('productId');

    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    res.json({
      success: true,
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

export const updateLeadStatus = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const lead = await Lead.findById(id);
    if (!lead) {
      throw new NotFoundError('Lead not found');
    }

    // Check if user is admin or the lead owner
    if (req.user!.role !== 'admin' && lead.agentId.toString() !== req.user!.userId) {
      throw new ForbiddenError('Unauthorized to update this lead');
    }

    const oldStatus = lead.status;
    lead.status = status;
    if (notes) lead.notes = notes;

    lead.statusHistory.push({
      status,
      changedAt: new Date(),
      changedBy: req.user!.userId,
    });

    // If lead is approved, credit commission
    if (status === LEAD_STATUS.APPROVED && oldStatus !== LEAD_STATUS.APPROVED) {
      await handleLeadApproval(lead);
    }

    await lead.save();

    res.json({
      success: true,
      message: 'Lead status updated successfully',
      data: lead,
    });
  } catch (error) {
    next(error);
  }
};

const handleLeadApproval = async (lead: ILead): Promise<void> => {
  const agent = await User.findById(lead.agentId);
  if (!agent) return;

  const balanceBefore = agent.walletBalance;
  const balanceAfter = balanceBefore + lead.commissionAmount;

  // Update wallet
  agent.walletBalance = balanceAfter;
  agent.totalEarnings += lead.commissionAmount;
  agent.totalSales += 1;
  await agent.save();

  // Create transaction
  await createTransaction({
    userId: lead.agentId,
    type: 'lead_commission',
    amount: lead.commissionAmount,
    status: 'completed',
    description: `Commission for lead ${lead.leadNumber}`,
    relatedEntity: { type: 'lead', id: lead._id },
    metadata: { leadNumber: lead.leadNumber },
    balanceBefore,
    balanceAfter,
  });

  // Update lead commission status
  lead.commissionStatus = 'credited';
  await lead.save();

  // Create notification
  await createNotification({
    userId: lead.agentId,
    type: 'payment',
    title: 'Commission Credited',
    message: `₹${lead.commissionAmount} credited for lead ${lead.leadNumber}`,
    metadata: { leadId: lead._id },
  });
};

