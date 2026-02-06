import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User } from '../models/User';
import { Product } from '../models/Product';
import { createError } from '../utils/errors';

export const getDashboard = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      throw createError('User not found', 404, 'NOT_FOUND');
    }

    // Get financial services (hardcoded for now, can be moved to database)
    const financialServices = {
      payout: {
        id: '1',
        name: 'Payout',
        icon: 'icon_url',
        description: 'Instant payouts',
      },
      creditCard: {
        id: '2',
        name: 'Credit Card',
        icon: 'icon_url',
        description: 'Apply for credit card',
      },
      education: {
        id: '3',
        name: 'Education Loan',
        icon: 'icon_url',
        description: 'Education financing',
      },
      savingAccount: {
        id: '4',
        name: 'Saving Account',
        icon: 'icon_url',
        description: 'Open savings account',
      },
      wallet: {
        id: '5',
        name: 'Wallet',
        icon: 'icon_url',
        description: 'Digital wallet',
      },
      dematAccount: {
        id: '6',
        name: 'Demat Account',
        icon: 'icon_url',
        description: 'Trading account',
      },
    };

    // Get quick access items (hardcoded for now)
    const quickAccess = [
      {
        id: '1',
        name: 'CA Services',
        icon: 'icon_url',
        route: '/ca-services',
      },
      {
        id: '2',
        name: 'Earn',
        icon: 'icon_url',
        route: '/earn',
      },
    ];

    // Get services by category
    const services = await Product.aggregate([
      {
        $group: {
          _id: '$category',
          products: {
            $push: {
              id: '$_id',
              name: '$name',
              icon: '$icon',
              category: '$category',
            },
          },
        },
      },
    ]);

    // Organize services by category
    const servicesByCategory: any = {
      recharge: [],
      billPayments: [],
      financialServices: [],
      purchaseServices: [],
      travelServices: [],
    };

    // Map products to appropriate categories (this is a simplified mapping)
    const allProducts = await Product.find({ isActive: true }).limit(20);
    allProducts.forEach((product) => {
      // This mapping logic should be adjusted based on your actual product categories
      if (product.category === 'campaign' || product.category === 'dsa_mfd_agent') {
        servicesByCategory.financialServices.push({
          id: product._id.toString(),
          name: product.name,
          icon: product.icon,
          category: product.category,
        });
      }
    });

    res.json({
      success: true,
      data: {
        user: {
          name: user.name,
          walletBalance: user.walletBalance,
          profileImage: user.profileImage || null,
        },
        financialServices,
        quickAccess,
        services: servicesByCategory,
      },
    });
  } catch (error) {
    next(error);
  }
};

