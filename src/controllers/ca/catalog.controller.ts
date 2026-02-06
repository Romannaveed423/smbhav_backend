import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { CAServiceCategory } from '../../models/CAServiceCategory';
import { CAService } from '../../models/CAService';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';


/**
 * Utility to validate ObjectId
 */
const validateObjectId = (id: string, name = 'ID') => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw createError(`Invalid ${name}`, 400, 'VALIDATION_ERROR');
  }
};

/**
 * Get all service categories
 */
export const getCategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Check user's completed services to set hasCheckmark
    const userId = req.user?.id;
    if (!userId) {
      throw createError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    // Fetch categories
    const categories = await CAServiceCategory.find({
      level: 'category',
      status: 1,
    })
      .sort({ order: 1 })
      .lean();

    // Fetch user's approved applications
    const userApplications = await mongoose.model('CAApplication').find({
      userId: new mongoose.Types.ObjectId(userId),
      status: 'approved',
    }).select('serviceId');

    const completedServiceIds = new Set(
      userApplications.map((app: any) => app.serviceId.toString())
    );

    // Fetch all active services once
    const services = await CAService.find({ isActive: true })
      .select('_id categoryId')
      .lean();

    const servicesByCategory = new Map<string, string[]>();
    services.forEach(service => {
      const catId = service.categoryId.toString();
      if (!servicesByCategory.has(catId)) servicesByCategory.set(catId, []);
      servicesByCategory.get(catId)!.push(service._id.toString());
    });

    const categoriesWithCheckmark = categories.map(category => {
      const hasCompletedService = servicesByCategory
        .get(category._id.toString())
        ?.some(id => completedServiceIds.has(id)) ?? false;


        return {
          id: category._id.toString(),
          cat_name: category.cat_name,
          cat_img: category.cat_img,
          status: category.status,
          hasCheckmark: hasCompletedService,
        };
      });
    

    res.json({
      success: true,
      data: categoriesWithCheckmark,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get subcategories for a category
 */
export const getSubcategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId } = req.params;

    if (!categoryId) {
      throw createError('Category ID is required', 400, 'VALIDATION_ERROR');
    }

    const subcategories = await CAServiceCategory.find({
      parentCategoryId: new mongoose.Types.ObjectId(categoryId),
      level: 'subcategory',
      status: 1,
    })
      .sort({ order: 1 })
      .lean();

    res.json({
      success: true,
      data: subcategories.map((sub) => ({
        id: sub._id.toString(),
        cat_name: sub.cat_name,
        cat_img: sub.cat_img,
        status: sub.status,
        level: sub.level,
        parentCategoryId: sub.parentCategoryId?.toString(),
        description: sub.description,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get sub-subcategories for a subcategory
 */
export const getSubSubcategories = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subcategoryId } = req.params;

    if (!subcategoryId) {
      throw createError('Subcategory ID is required', 400, 'VALIDATION_ERROR');
    }

    const subSubcategories = await CAServiceCategory.find({
      parentCategoryId: new mongoose.Types.ObjectId(subcategoryId),
      level: 'sub_subcategory',
      status: 1,
    })
      .sort({ order: 1 })
      .lean();

    res.json({
      success: true,
      data: subSubcategories.map((sub) => ({
        id: sub._id.toString(),
        cat_name: sub.cat_name,
        cat_img: sub.cat_img,
        status: sub.status,
        level: sub.level,
        parentCategoryId: sub.parentCategoryId?.toString(),
        description: sub.description,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get services by category/subcategory
 */
export const getServices = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { categoryId, subcategoryId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {
      isActive: true,
    };

    if (subcategoryId) {
      query.subcategoryId = new mongoose.Types.ObjectId(subcategoryId as string);
    } else if (categoryId) {
      query.categoryId = new mongoose.Types.ObjectId(categoryId as string);
    }

    const [services, total] = await Promise.all([
      CAService.find(query)
        .populate('categoryId', 'cat_name')
        .populate('subcategoryId', 'cat_name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CAService.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        services: services.map((service) => ({
          id: service._id.toString(),
          title: service.title,
          description: service.description,
          logo: service.logo,
          price: service.price,
          cross_price: service.cross_price,
          categoryId: service.categoryId?._id?.toString() || service.categoryId?.toString(),
          subcategoryId: service.subcategoryId?._id?.toString() || service.subcategoryId?.toString(),
          estimatedTime: service.estimatedTime,
          isActive: service.isActive,
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

/**
 * Get service details
 */
export const getServiceDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { serviceId } = req.params;
    if (!serviceId) {
      throw createError('Service ID is required', 400, 'VALIDATION_ERROR');
    }

    const service = await CAService.findById(serviceId)
      .populate('categoryId', 'cat_name')
      .populate('subcategoryId', 'cat_name')
      .lean();

    if (!service) {
      throw createError('Service not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: service._id.toString(),
        title: service.title,
        description: service.description,
        logo: service.logo,
        price: service.price,
        cross_price: service.cross_price,
        categoryId: service.categoryId?._id?.toString() || service.categoryId?.toString(),
        subcategoryId: service.subcategoryId?._id?.toString() || service.subcategoryId?.toString(),
        estimatedTime: service.estimatedTime,
        features: service.features || [],
        requiredDocuments: service.requiredDocuments || [],
        processSteps: service.processSteps || [],
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get GST service tabs
 */
export const getGSTTabs = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const tabs = [
      {
        id: 'gst_registration',
        name: 'GST Registration',
        isActive: true,
      },
      {
        id: 'gst_filing',
        name: 'GST Filing',
        isActive: true,
      },
      {
        id: 'gst_cancellation',
        name: 'GST Cancellation',
        isActive: true,
      },
      {
        id: 'gst_compliance',
        name: 'GST Compliance',
        isActive: true,
      },
    ];

    res.json({
      success: true,
      data: {
        tabs,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Admin controller functions can be added below as needed

/**
 * Create a new category/subcategory
 */
export const createCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { cat_name, level, parentCategoryId, cat_img, order = 0, status = 1, description = '' } = req.body;

    if (!cat_name || !level) {
      throw createError('Category name and level are required', 400, 'VALIDATION_ERROR');
    }

    if (parentCategoryId) validateObjectId(parentCategoryId, 'Parent Category ID');

    const newCategory = new CAServiceCategory({
      cat_name,
      level,
      parentCategoryId: parentCategoryId ? new mongoose.Types.ObjectId(parentCategoryId) : undefined,
      cat_img,
      order,
      status,
      description,
    });

    await newCategory.save();

    res.json({
      success: true,
      message: 'Category created successfully',
      data: {
        id: newCategory._id.toString(),
        cat_name: newCategory.cat_name,
        level: newCategory.level,
        parentCategoryId: newCategory.parentCategoryId?.toString(),
        cat_img: newCategory.cat_img,
        order: newCategory.order,
        status: newCategory.status,
        description: newCategory.description,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a category
 */
export const updateCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.params;
    const { cat_name, cat_img, status, order, description } = req.body;

    if (!categoryId) throw createError('Category ID is required', 400, 'VALIDATION_ERROR');
    validateObjectId(categoryId, 'Category ID');

    const category = await CAServiceCategory.findById(categoryId);
    if (!category) throw createError('Category not found', 404, 'NOT_FOUND');

    if (cat_name !== undefined) category.cat_name = cat_name;
    if (cat_img !== undefined) category.cat_img = cat_img;
    if (status !== undefined) category.status = status;
    if (order !== undefined) category.order = order;
    if (description !== undefined) category.description = description;

    await category.save();

    res.json({
      success: true,
      message: 'Category updated successfully',
      data: {
        id: category._id.toString(),
        cat_name: category.cat_name,
        level: category.level,
        parentCategoryId: category.parentCategoryId?.toString(),
        cat_img: category.cat_img,
        order: category.order,
        status: category.status,
        description: category.description,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a category
 */
export const deleteCategory = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { categoryId } = req.params;
    if (!categoryId) throw createError('Category ID is required', 400, 'VALIDATION_ERROR');
    validateObjectId(categoryId, 'Category ID');

    const category = await CAServiceCategory.findById(categoryId);
    if (!category) throw createError('Category not found', 404, 'NOT_FOUND');

    // Optional: prevent deletion if there are subcategories or services
    const subCount = await CAServiceCategory.countDocuments({ parentCategoryId: category._id });
    if (subCount > 0) throw createError('Cannot delete category with subcategories', 400, 'VALIDATION_ERROR');

    const serviceCount = await CAService.countDocuments({ categoryId: category._id });
    if (serviceCount > 0) throw createError('Cannot delete category with services', 400, 'VALIDATION_ERROR');

    await category.deleteOne();

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a service
 */
export const createService = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const {
      title,
      description,
      logo,
      price,
      cross_price,
      categoryId,
      subcategoryId,
      estimatedTime,
      features = [],
      requiredDocuments = [],
      processSteps = [],
      isActive = true,
    } = req.body;

    if (!title || !categoryId) throw createError('Title and Category ID are required', 400, 'VALIDATION_ERROR');

    validateObjectId(categoryId, 'Category ID');
    if (subcategoryId) validateObjectId(subcategoryId, 'Subcategory ID');

    const newService = new CAService({
      title,
      description,
      logo,
      price,
      cross_price,
      categoryId: new mongoose.Types.ObjectId(categoryId),
      subcategoryId: subcategoryId ? new mongoose.Types.ObjectId(subcategoryId) : undefined,
      estimatedTime,
      features,
      requiredDocuments,
      processSteps,
      isActive,
    });

    await newService.save();

    res.json({
      success: true,
      message: 'Service created successfully',
      data: {
        id: newService._id.toString(),
        title: newService.title,
        categoryId: newService.categoryId.toString(),
        subcategoryId: newService.subcategoryId?.toString(),
        isActive: newService.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a service
 */
export const updateService = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { serviceId } = req.params;
    if (!serviceId) throw createError('Service ID is required', 400, 'VALIDATION_ERROR');
    validateObjectId(serviceId, 'Service ID');

    const service = await CAService.findById(serviceId);
    if (!service) throw createError('Service not found', 404, 'NOT_FOUND');

    const {
      title,
      description,
      logo,
      price,
      cross_price,
      categoryId,
      subcategoryId,
      estimatedTime,
      features,
      requiredDocuments,
      processSteps,
      isActive,
    } = req.body;

    if (title !== undefined) service.title = title;
    if (description !== undefined) service.description = description;
    if (logo !== undefined) service.logo = logo;
    if (price !== undefined) service.price = price;
    if (cross_price !== undefined) service.cross_price = cross_price;
    if (categoryId !== undefined) {
      validateObjectId(categoryId, 'Category ID');
      service.categoryId = new mongoose.Types.ObjectId(categoryId);
    }
    if (subcategoryId !== undefined) {
      validateObjectId(subcategoryId, 'Subcategory ID');
      service.subcategoryId = new mongoose.Types.ObjectId(subcategoryId);
    }
    if (estimatedTime !== undefined) service.estimatedTime = estimatedTime;
    if (features !== undefined) service.features = features;
    if (requiredDocuments !== undefined) service.requiredDocuments = requiredDocuments;
    if (processSteps !== undefined) service.processSteps = processSteps;
    if (isActive !== undefined) service.isActive = isActive;

    await service.save();

    res.json({
      success: true,
      message: 'Service updated successfully',
      data: {
        id: service._id.toString(),
        title: service.title,
        categoryId: service.categoryId.toString(),
        subcategoryId: service.subcategoryId?.toString(),
        isActive: service.isActive,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a service
 */
export const deleteService = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { serviceId } = req.params;
    if (!serviceId) throw createError('Service ID is required', 400, 'VALIDATION_ERROR');
    validateObjectId(serviceId, 'Service ID');

    const service = await CAService.findById(serviceId);
    if (!service) throw createError('Service not found', 404, 'NOT_FOUND');

    // Optional: prevent deletion if there are user applications
    // const appCount = await CAApplication.countDocuments({ serviceId: service._id });
    // if (appCount > 0) throw createError('Cannot delete service with user applications', 400, 'VALIDATION_ERROR');

    await service.deleteOne();

    res.json({ success: true, message: 'Service deleted successfully' });
  } catch (error) {
    next(error);
  }
};

