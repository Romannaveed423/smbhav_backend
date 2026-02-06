import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { Product } from '../models/Product';
import { createError } from '../utils/errors';

/**
 * Create Public Task (User-facing)
 * POST /api/v1/earn/public-tasks
 */
export const createPublicTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const {
      name,
      description,
      category,
      earnUpTo,
      taskUrl,
      // Social Media Task fields
      platform,
      actions,
      instructions,
      pinToTop,
      vipUsersOnly,
      // Campaign Task fields
      subcategory,
      taskSteps,
      payoutModel,
      revenueCost,
      payoutType,
      payoutCost,
      dailyCap,
      totalCap,
      conversionStatusRule,
      privateOffer,
      enableRedirection,
      requireApproval,
      geoTarget,
      deviceTarget,
      osPlatform,
      destinationLink,
      attributionTool,
      clickIdParam,
      testUrl,
      // Influencer Task fields
      productDescription,
      nicheCategory,
      requiredReachMin,
      requiredReachMax,
      paymentType,
      totalBudget,
      deliverables,
      // Company Task fields
      workDescription,
      // Common fields
      maxUsers,
      requireScreenshot,
      deadline,
      instantPay,
      requirements,
    } = req.body;

    if (!userId) {
      throw createError('User ID not found', 401, 'UNAUTHORIZED');
    }

    // Map category to Product category enum
    const categoryMap: Record<string, string> = {
      'social_media': 'social_task',
      'campaign': 'campaign',
      'influencer': 'influencer_marketing',
      'company_custom': 'company_task',
    };

    const productCategory = categoryMap[category] || category;

    // Generate route from name
    const route = `/public-tasks/${name.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`;

    // Set default logo and icon based on category
    const defaultIcons: Record<string, { icon: string; logo: string }> = {
      social_task: { icon: 'thumb_up', logo: '/uploads/default-social-icon.png' },
      campaign: { icon: 'campaign', logo: '/uploads/default-campaign-icon.png' },
      influencer_marketing: { icon: 'star', logo: '/uploads/default-influencer-icon.png' },
      company_task: { icon: 'business', logo: '/uploads/default-company-icon.png' },
    };

    const defaultIcon = defaultIcons[productCategory] || { icon: 'task', logo: '/uploads/default-task-icon.png' };

    // Store task-specific data in details.how field as JSON
    const taskDetails: any = {
      // Social Media Task fields
      platform: platform || null,
      actions: actions || [],
      instructions: instructions || null,
      pinToTop: pinToTop || false,
      vipUsersOnly: vipUsersOnly || false,
      
      // Campaign Task fields
      subcategory: subcategory || null,
      taskSteps: taskSteps || null,
      payoutModel: payoutModel || null,
      revenueCost: revenueCost || null,
      payoutType: payoutType || null,
      payoutCost: payoutCost || null,
      dailyCap: dailyCap || null, // null means unlimited
      totalCap: totalCap || null, // null means unlimited
      conversionStatusRule: conversionStatusRule || null,
      privateOffer: privateOffer || false,
      enableRedirection: enableRedirection || false,
      requireApproval: requireApproval || false,
      geoTarget: geoTarget || [],
      deviceTarget: deviceTarget || [],
      osPlatform: osPlatform || [],
      destinationLink: destinationLink || null,
      attributionTool: attributionTool || null,
      clickIdParam: clickIdParam || null,
      testUrl: testUrl || null,
      
      // Influencer Task fields
      productDescription: productDescription || null,
      nicheCategory: nicheCategory || [],
      requiredReachMin: requiredReachMin || null,
      requiredReachMax: requiredReachMax || null,
      paymentType: paymentType || null,
      totalBudget: totalBudget || null,
      deliverables: deliverables || [],
      
      // Company Task fields
      workDescription: workDescription || null,
      
      // Common fields
      maxUsers: maxUsers || null,
      requireScreenshot: requireScreenshot || false,
      deadline: deadline || null,
      instantPay: instantPay || false,
      requirements: requirements || [],
    };

    // Create product (public task) - initially inactive, needs admin approval
    const product = await Product.create({
      name,
      description,
      category: productCategory as any,
      section: 'public',
      earnUpTo: Number(earnUpTo),
      taskUrl: taskUrl || undefined,
      route,
      logo: defaultIcon.logo,
      icon: defaultIcon.icon,
      isActive: false, // Public tasks need admin approval
      isNewProduct: true,
      details: {
        benefits: {
          payoutOpportunity: [],
          customerBenefits: [],
        },
        how: JSON.stringify(taskDetails), // Store task-specific details
      },
      // Store creator info in marketing field for now (can be moved to a dedicated field later)
      marketing: {
        materials: [],
        links: [userId], // Store creator ID in links for now
      },
    });

    res.status(201).json({
      success: true,
      message: 'Public task created successfully. It will be reviewed by admin before going live.',
      data: {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        category: product.category,
        earnUpTo: product.earnUpTo,
        status: product.isActive ? 'active' : 'pending',
        route: product.route,
        createdAt: product.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Public Tasks (User-facing)
 * GET /api/v1/earn/public-tasks
 * This is essentially an alias for getEarningsProducts with section='public'
 * But we can add additional filtering/formatting specific to public tasks
 */
export const getPublicTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { category, page = 1, limit = 20, status = 'active' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {
      section: 'public',
    };

    if (category) {
      // Map category filters
      const categoryMap: Record<string, string> = {
        'influencer': 'influencer_marketing',
        'social': 'social_task',
        'social_task': 'social_task',
        'campaign': 'campaign',
        'company': 'company_task',
        'company_task': 'company_task',
      };
      query.category = categoryMap[category as string] || category;
    }

    // Status filter
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'pending') {
      query.isActive = false;
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    // Format response to include task-specific fields
    const formattedTasks = products.map((product: any) => {
      let taskDetails: any = {};
      try {
        if (product.details?.how) {
          taskDetails = typeof product.details.how === 'string' 
            ? JSON.parse(product.details.how) 
            : product.details.how;
        }
      } catch (e) {
        // Ignore parse errors
      }

      return {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        category: product.category,
        earnUpTo: product.earnUpTo,
        taskUrl: product.taskUrl || null,
        route: product.route,
        status: product.isActive ? 'active' : 'pending',
        platform: taskDetails.platform || null,
        actions: taskDetails.actions || [],
        instructions: taskDetails.instructions || null,
        maxUsers: taskDetails.maxUsers || null,
        requireScreenshot: taskDetails.requireScreenshot || false,
        deadline: taskDetails.deadline || null,
        instantPay: taskDetails.instantPay || false,
        createdAt: product.createdAt,
        icon: product.icon,
      };
    });

    res.json({
      success: true,
      data: {
        tasks: formattedTasks,
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
 * Get User's Public Tasks (User-facing)
 * GET /api/v1/earn/my-public-tasks
 */
export const getMyPublicTasks = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { page = 1, limit = 20, status } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    if (!userId) {
      throw createError('User ID not found', 401, 'UNAUTHORIZED');
    }

    const query: any = {
      section: 'public',
      'marketing.links': userId, // Creator ID stored in marketing.links
    };

    if (status) {
      query.isActive = status === 'active';
    }

    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      Product.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        tasks: products.map((product: any) => ({
          id: product._id.toString(),
          name: product.name,
          description: product.description,
          category: product.category,
          earnUpTo: product.earnUpTo,
          status: product.isActive ? 'active' : 'pending',
          route: product.route,
          createdAt: product.createdAt,
        })),
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

