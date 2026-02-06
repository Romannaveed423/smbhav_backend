import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { CAFormSchema } from '../../models/CAFormSchema';
import { CAFormEntry } from '../../models/CAFormEntry';
import { CAServiceCategory } from '../../models/CAServiceCategory';
import { createError } from '../../utils/errors';
import mongoose from 'mongoose';

/**
 * Get form schema for a sub-subcategory
 */
export const getFormSchema = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subSubcategoryId } = req.params;

    if (!subSubcategoryId) {
      throw createError('Sub-subcategory ID is required', 400, 'VALIDATION_ERROR');
    }

    // Verify sub-subcategory exists and is a sub-subcategory
    const subSubcategory = await CAServiceCategory.findById(subSubcategoryId);
    if (!subSubcategory || subSubcategory.level !== 'sub_subcategory') {
      throw createError('Invalid sub-subcategory', 404, 'NOT_FOUND');
    }

    const formSchema = await CAFormSchema.findOne({
      subSubcategoryId: new mongoose.Types.ObjectId(subSubcategoryId),
      isActive: true,
    }).lean();

    if (!formSchema) {
      throw createError('Form schema not found for this sub-subcategory', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: formSchema._id.toString(),
        subSubcategoryId: formSchema.subSubcategoryId.toString(),
        fields: formSchema.fields.sort((a, b) => a.order - b.order),
        sections: formSchema.sections?.sort((a, b) => a.order - b.order) || [],
        version: formSchema.version,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create or update form schema (Admin only)
 */
export const saveFormSchema = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subSubcategoryId, fields, sections } = req.body;

    if (!subSubcategoryId || !fields || !Array.isArray(fields)) {
      throw createError('Sub-subcategory ID and fields are required', 400, 'VALIDATION_ERROR');
    }

    // Verify sub-subcategory exists
    const subSubcategory = await CAServiceCategory.findById(subSubcategoryId);
    if (!subSubcategory || subSubcategory.level !== 'sub_subcategory') {
      throw createError('Invalid sub-subcategory', 404, 'NOT_FOUND');
    }

    // Check if schema exists
    const existingSchema = await CAFormSchema.findOne({
      subSubcategoryId: new mongoose.Types.ObjectId(subSubcategoryId),
    });

    if (existingSchema) {
      // Update existing schema
      existingSchema.fields = fields;
      existingSchema.sections = sections || [];
      existingSchema.version = (existingSchema.version || 1) + 1;
      existingSchema.isActive = true;
      await existingSchema.save();

      res.json({
        success: true,
        message: 'Form schema updated successfully',
        data: {
          id: existingSchema._id.toString(),
          subSubcategoryId: existingSchema.subSubcategoryId.toString(),
          fields: existingSchema.fields,
          sections: existingSchema.sections,
          version: existingSchema.version,
        },
      });
    } else {
      // Create new schema
      const newSchema = new CAFormSchema({
        subSubcategoryId: new mongoose.Types.ObjectId(subSubcategoryId),
        fields,
        sections: sections || [],
        createdBy: req.user?.id,
      });
      await newSchema.save();

      res.json({
        success: true,
        message: 'Form schema created successfully',
        data: {
          id: newSchema._id.toString(),
          subSubcategoryId: newSchema.subSubcategoryId.toString(),
          fields: newSchema.fields,
          sections: newSchema.sections,
          version: newSchema.version,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Submit form entry (user submits data)
 */
export const submitFormEntry = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { subSubcategoryId, formData, files } = req.body;
    const userId = req.user?.id;

    if (!subSubcategoryId || !formData) {
      throw createError('Sub-subcategory ID and form data are required', 400, 'VALIDATION_ERROR');
    }

    // Get form schema
    const formSchema = await CAFormSchema.findOne({
      subSubcategoryId: new mongoose.Types.ObjectId(subSubcategoryId),
      isActive: true,
    });

    if (!formSchema) {
      throw createError('Form schema not found', 404, 'NOT_FOUND');
    }

    // Validate form data against schema (basic validation)
    // In production, you'd want more comprehensive validation
    const requiredFields = formSchema.fields.filter((f) => f.isRequired);
    for (const field of requiredFields) {
      if (!formData[field.name]) {
        throw createError(`${field.label} is required`, 400, 'VALIDATION_ERROR');
      }
    }

    // Create form entry
    const formEntry = new CAFormEntry({
      userId: new mongoose.Types.ObjectId(userId),
      subSubcategoryId: new mongoose.Types.ObjectId(subSubcategoryId),
      formSchemaId: formSchema._id,
      formData,
      files: files || {},
      status: 'submitted',
      submittedAt: new Date(),
    });

    await formEntry.save();

    res.json({
      success: true,
      message: 'Form submitted successfully',
      data: {
        id: formEntry._id.toString(),
        entryId: formEntry.entryId,
        subSubcategoryId: formEntry.subSubcategoryId.toString(),
        status: formEntry.status,
        submittedAt: formEntry.submittedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get form entries for a user
 */
export const getUserFormEntries = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user?.id;
    const { subSubcategoryId, status, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query: any = {
      userId: new mongoose.Types.ObjectId(userId),
    };

    if (subSubcategoryId) {
      query.subSubcategoryId = new mongoose.Types.ObjectId(subSubcategoryId as string);
    }

    if (status) {
      query.status = status;
    }

    const [entries, total] = await Promise.all([
      CAFormEntry.find(query)
        .populate('subSubcategoryId', 'cat_name')
        .populate('formSchemaId', 'version')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CAFormEntry.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        entries: entries.map((entry) => ({
          id: entry._id.toString(),
          entryId: entry.entryId,
          subSubcategoryId: entry.subSubcategoryId,
          subSubcategoryName: (entry.subSubcategoryId as any)?.cat_name,
          status: entry.status,
          submittedAt: entry.submittedAt,
          createdAt: entry.createdAt,
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
 * Get form entry details
 */
export const getFormEntryDetails = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entryId } = req.params;
    const userId = req.user?.id;

    const entry = await CAFormEntry.findOne({
      entryId,
      userId: new mongoose.Types.ObjectId(userId),
    })
      .populate('subSubcategoryId', 'cat_name')
      .populate('formSchemaId')
      .populate('applicationId', 'applicationId status')
      .lean();

    if (!entry) {
      throw createError('Form entry not found', 404, 'NOT_FOUND');
    }

    res.json({
      success: true,
      data: {
        id: entry._id.toString(),
        entryId: entry.entryId,
        subSubcategoryId: entry.subSubcategoryId,
        subSubcategoryName: (entry.subSubcategoryId as any)?.cat_name,
        formData: entry.formData,
        files: entry.files,
        status: entry.status,
        submittedAt: entry.submittedAt,
        applicationId: entry.applicationId,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Save draft form entry
 */
export const saveDraftEntry = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { entryId, subSubcategoryId, formData, files } = req.body;
    const userId = req.user?.id;

    if (!subSubcategoryId || !formData) {
      throw createError('Sub-subcategory ID and form data are required', 400, 'VALIDATION_ERROR');
    }

    if (entryId) {
      // Update existing draft
      const entry = await CAFormEntry.findOne({
        entryId,
        userId: new mongoose.Types.ObjectId(userId),
        status: 'draft',
      });

      if (!entry) {
        throw createError('Draft entry not found', 404, 'NOT_FOUND');
      }

      entry.formData = formData;
      entry.files = files || entry.files;
      await entry.save();

      res.json({
        success: true,
        message: 'Draft saved successfully',
        data: {
          id: entry._id.toString(),
          entryId: entry.entryId,
          status: entry.status,
        },
      });
    } else {
      // Create new draft
      const formSchema = await CAFormSchema.findOne({
        subSubcategoryId: new mongoose.Types.ObjectId(subSubcategoryId),
        isActive: true,
      });

      if (!formSchema) {
        throw createError('Form schema not found', 404, 'NOT_FOUND');
      }

      const draftEntry = new CAFormEntry({
        userId: new mongoose.Types.ObjectId(userId),
        subSubcategoryId: new mongoose.Types.ObjectId(subSubcategoryId),
        formSchemaId: formSchema._id,
        formData,
        files: files || {},
        status: 'draft',
      });

      await draftEntry.save();

      res.json({
        success: true,
        message: 'Draft created successfully',
        data: {
          id: draftEntry._id.toString(),
          entryId: draftEntry.entryId,
          status: draftEntry.status,
        },
      });
    }
  } catch (error) {
    next(error);
  }
};



/**
 * List all form entries (Admin/CA)
 */
export const getAllFormEntriesAdmin = async (
 req: AuthRequest, 
 res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { status,subSubcategoryId, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Admin / CA only
    if (!req.user || !['admin', 'ca'].includes(req.user.role)) {
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }

    const query: any = {};
    if (status) query.status = status;
    if (subSubcategoryId) query.subSubcategoryId = new mongoose.Types.ObjectId(subSubcategoryId as string);

    const [entries, total] = await Promise.all([
      CAFormEntry.find(query)
        .populate('userId', 'name email')
        .populate('subSubcategoryId', 'cat_name')
        .sort({ submittedAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .lean(),
      CAFormEntry.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: {
        entries,
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
 * Review form entry (Admin/CA)
 */
export const reviewFormEntryAdmin = async (
 req: AuthRequest, 
 res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { entryId } = req.params;
    const { status, note } = req.body; // status: 'approved' | 'rejected'

    // Admin / CA only
    if (!req.user || !['admin', 'ca'].includes(req.user.role)) {
      throw createError('Unauthorized', 403, 'FORBIDDEN');
    }

    if (!['approved', 'rejected'].includes(status)) {
      throw createError('Invalid status', 400, 'INVALID_STATUS');
    }

    const entry = await CAFormEntry.findOne({ entryId });

    if (!entry) {
      throw createError('Form entry not found', 404, 'NOT_FOUND');
    }

    entry.status = status;
    entry.reviewedBy = new mongoose.Types.ObjectId(req.user.id);
    entry.reviewedAt = new Date();
    entry.reviewNotes = note || '';

    await entry.save();
    res.json({
      success: true,
      message: `Form entry ${status} successfully`,
      data: { 
        entryId: entry.entryId,
        status: entry.status,
        reviewedBy: entry.reviewedBy,
        reviewedAt: entry.reviewedAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

